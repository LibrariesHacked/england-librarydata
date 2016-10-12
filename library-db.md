# Libraries open data PostgreSQL setup

These are instructions to set up a spatial database using the Libraries Taskforce open dataset.

## Pre-requisites

- A [postGIS](http://postgis.net/install/) database setup.

## Dataset: OS Code-point Open

The Ordnance Survey have an open data product listing all postcodes in the UK, complete with geo-cordinates (the centre of the postcode) and various codes specifying the authorities that postcode falls within.

For example, for the postcode GL194JW:

| Postcode | 
|  |  |  |

This data is provided as a series of CSV files.  There are many ways to combine CSV files into one depending on operating system.  For a simple Windows PC, run the following command using the cmd.exe tool.

```
copy *.csv postcodes.csv
```

Once the data is in a single CSV file it can be imported into a database.  Create the table and then copy the postcodes CSV data into it.

```
create table postcodes
(
  postcode character varying(8) NOT NULL,
  positional_quality_indicator integer,
  eastings numeric,
  northings numeric,
  country_code character varying(9),
  nhs_regional_ha_code character varying(9),
  nhs_ha_code character varying(9),
  admin_county_code character varying(9),
  admin_district_code character varying(9),
  admin_ward_code character varying(9),
  CONSTRAINT pk_postcode PRIMARY KEY (postcode)
)
```

```
copy postcodes FROM 'postcodes.csv' delimiter ',' csv;
```

## Dataset: OS boundaries

The Ordnance Survey release 

```
shp2pgsql "county_electoral_division_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "county_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "district_borough_unitary_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "district_borough_unitary_ward_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "european_region_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "greater_london_const_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "high_water_polyline.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "parish_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "scotland_and_wales_const_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "scotland_and_wales_region_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "unitary_electoral_division_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "westminster_const_region.shp" | psql -d uklibraries -U "postgres"
```

## Dataset: ONS Population estimates mid-2015

The Office for National Statistics release [mid-year population estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland), the last of these being for 2015 (release June 2016).


Create a basic table with 3 columns to store the counts.

```

```


Import the data.

```
COPY population FROM 'C:\Development\LibrariesHacked\public-libraries-news\data\UKPopulation.csv' DELIMITER ',' CSV;
```


## Dataset: Lower super output areas

- Download from http://geoportal.statistics.gov.uk/datasets?q=LSOA Boundaries
- Select Lower Super Output Areas (December 2001) Full Clipped Boundaries in England and Wales
- Import the data.

```
shp2pgsql "LSOA_2001_EW_BFC_V2.shp" | psql -d uklibraries -U "postgres"
```

## Dataset: Indices of deprivation

- Download from https://www.gov.uk/government/statistics/english-indices-of-deprivation-2015
- Select to download the CSV *File 7: all ranks, deciles and scores for the indices of deprivation, and population denominators*

Create the table:




```
copy imd from 'File_7_ID_2015_All_ranks__deciles_and_scores_for_the_Indices_of_Deprivation__and_population_denominators.csv' delimiter ',' csv header;
```


## Convert source data

The spreadsheet is distributed as an Excel file.

To convert that file it was opened in Excel, the rows copied and saved to a new file, and then saved as CSV.

## Setup receiving table

The data can then be imported directly into a database.  Firstly create a table to hold the data.

```
create table raw
(
  authority text,
  library text,
  address text,
  postcode text,
  statutoryapril2010 text,
  statutoryjuly2016 text,
  libtype text,
  closed text,
  yearclosed text,
  new text,
  replacement text,
  notes text,
  hours text,
  staffhours text,
  email text,
  url text
)
```

Then import the data.

```
copy raw from 'librariesraw.csv' delimiter ',' csv;
```

## Create authorities table

First create the basic table structure.

```
create table authorities
(
  id serial,
  name text,
  code character varying(9),
  constraint pk_authority primary key (id)
)
```

Then insert all the unique authority names from the raw library data.

```
insert into authorities(name)
select distinct trim(both from authority) 
from raw 
order by trim(both from authority) 
```

Then to have a dataset that we can reliably merge from data elsewhere we're going to add the authority codes used in datasets like those published by the Office for National Statistics, and Ordnance Survey.  That data can come from the authority boundaries.

Firstly try to match using the District/Borough/Unitary region table.

```
update authorities a
set code = (
	select code from district_borough_unitary_region r 
	where replace(replace(replace(replace(r.name, ' City',''), ' London Boro',''), ' (B)',''), ' District','') = a.name)
where code is null
```

Then fill in the missing ones from the County regions table.

```
update authorities a
set code = (
	select code from county_region r 
	where replace(r.name, ' County', '') = a.name)
where code is null
```

That will still leave around 20 with no matching code.  The likely reason for this will be counties that are named irregularly (e.g. Bath and NE Somerset instead of Bath and North East Somerset).

Edit the table manually to fill in the missing values.

Export an authorities CSV file:

```
copy (
	select a.id as authority_id, a.name as Name, c.descriptio as Type, c.code as Code, c.hectares as Hectares, p.population as Population
	from authorities a
	join county_region c
	on a.code = c.code
	left outer join population p
	on p.code = a.code
	union
	select b.id as authority_id, b.name as Name, d.descriptio as Type, d.code as Code, d.hectares as Hectares, p.population as Population 
	from authorities b
	join district_borough_unitary_region d
	on d.code = b.code
	left outer join population p
	on p.code = b.code
) to 'authorities.csv' delimiter ',' csv header;
```

Export the authorities as GeoJSON:

```
copy (
	select row_to_json(fc)
	from (
		select 'FeatureCollection' As type, array_to_json(array_agg(f)) as features 
		from (
			select 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((SELECT l FROM (SELECT authority_id, name, type, code, hectares, population) As l)) as properties
			from (
				select a.id as authority_id, a.name as Name, c.descriptio as Type, c.code as Code, c.hectares as Hectares, p.population as Population, ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(geom, 27700),4326), 0.002) as Geom 
				from authorities a
				join county_region c
				on a.code = c.code
				left outer join population p
				on p.code = a.code
				union
				select b.id as authority_id, b.name as Name, d.descriptio as Type, d.code as Code, d.hectares as Hectares, p.population as Population, ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(geom, 27700), 4326), 0.002) as Geom 
				from authorities b
				join district_borough_unitary_region d
				on d.code = b.code
				left outer join population p
				on p.code = b.code
			) As lg   
		) As f 
	)  As fc
) To 'authoritiesgeo.json'
```

## Create libraries table

```
create table libraries
(
  id serial,
  name text,
  authority_id integer NOT NULL,
  address text,
  postcode character varying(8),
  postcodelat numeric, 
  postcodelng numeric,
  lat numeric,
  lng numeric,
  type character varying(4),
  closed_year integer,
  statutory2010 boolean,
  statutory2016 boolean,
  opened_year integer,
  replacement boolean,
  notes text,
  hours numeric,
  staffhours numeric,
  email text, 
  url text,
  constraint pk_library primary key (id)
)
```

Then take data from lots of tables and put it into the libraries table.

```
insert into libraries(
	name, authority_id, address, postcode, postcodelat, postcodelng, type, closed_year, statutory2010, 
	statutory2016, opened_year, replacement, notes, hours, staffhours, email, url)
select	r.library, a.id, r.address, p.postcode, 
	ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(p.eastings, p.northings),27700), 4326)),
	ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(p.eastings, p.northings),27700), 4326)),
	case when r.libtype is null then 'XL' else r.libtype end,  
	cast(r.yearclosed as integer),
	case when r.statutoryapril2010 = 'yes' then true else false end,
	case when r.statutoryjuly2016 = 'yes' then true else false end,
	cast(r.new as integer),
	case when lower(r.replacement) = 'yes' then true else false end,
	r.notes, cast(r.hours as numeric), cast(r.staffhours as numeric), r.email, r.url
from raw r
join authorities a
on a.name = r.authority
left outer join postcodes p
on r.postcode = p.postcode
order by r.authority, r.library
```

Export the libraries data to geocode it.  While doing this, create a bounding box by authority boundaries.  This should give the geocoder more to go on.

```
copy (
	select 	l1.id, l1.name, l1.address, l1.postcode, ST_AsText(ST_Envelope(ST_Transform(ST_SetSRID(d.geom, 27700), 4326))), l1.lat, l1.lng
	from libraries l1
	join authorities a1
	on a1.id = l1.authority_id
	join district_borough_unitary_region d
	on d.code = a1.code
	union
	select 	l2.id, l2.name, l2.address, l2.postcode, ST_AsText(ST_Envelope(ST_Transform(ST_SetSRID(c.geom, 27700), 4326))), l2.lat, l2.lng
	from libraries l2
	join authorities a2
	on a2.id = l2.authority_id
	join county_region c
	on c.code = a2.code
) to 'librariesgeo.csv' delimiter ',' csv header;
```

Or, more simply:

```
copy (
	select 	id, name || ',' || coalesce(address, '') || ',' || coalesce(postcode, '') "address" 
	from libraries
) to 'librariesgeo.csv' delimiter ',' csv header;
```


```
create table librarylocations
(
  libraryid integer not null,
  lat numeric,
  lng numeric,
  constraint librarylocations_pkey primary key (libraryid)
)
```

```
copy librarylocations from 'C:\Development\LibrariesHacked\public-libraries-news\data\librarylocations.csv' delimiter ',' csv;
```

Update the libraries table with the lat/lng values.

```
update libraries l
set lat = ll.lat,
lng = ll.lng
from librarylocations ll
where ll.libraryid = l.id
```

Finally, export the libraries data.

```
copy (
	select 	l.name,
		a.id "authority_id",
		l.address,
		l.postcode,
		case when ST_Within(
				ST_Transform(ST_SetSRID(ST_MakePoint(l.lng, l.lat), 4326), 27700), 
				(select ST_SetSRID(geom, 27700) from (select code, geom from county_region union select code, geom from district_borough_unitary_region) ab where ab.code = a.code)
			) then '' else '' end,
		l.postcodelat,
		l.postcodelng,
		l.lat,
		l.lng,
		--ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(eastings, northings), 27700), 4326)) "lng", 
		--ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(eastings, northings), 27700), 4326)) "lat",
		--l.closed,
		l.statutory2010,
		l.statutory2016,
		type, 
		closed_year,
		opened_year,
		replacement,
		notes
		-- Add the LSOA data
		--ls.lsoa11nm "lsoa_name",
		--ls.lsoa11cd "lsoa_code",
		-- Add the deprivation data
		--i.imd_decile,
		--i.income_decile,
		--i.education_decile,
		--i.health_decile,
		--i.crime_decile,
		--i.housing_decile,
		--i.environment_decile
	from libraries l
	join authorities a
	on a.id = l.authority_id
	--join lsoa_boundaries ls
	--on ST_Within(ST_SetSRID(ST_MakePoint(eastings, northings), 27700), ST_SetSRID(ls.geom, 27700))
	--join imd i
	--on i.lsoa_code = ls.lsoa11cd
) to 'libraries.csv' delimiter ','csv header;
```

