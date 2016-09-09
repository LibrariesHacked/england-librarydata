# Libraries open data PostgreSQL setup

These are instructions to set up a spatial database using the Libraries Taskforce open dataset.

## Pre-requisites


## Convert source data

The spreadsheet is distributed as an Excel file.

To convert that file it was opened in Excel and the rows copied and saved to a new file, and then saved as CSV (in Save as dialog: )

## Setup receiving table

The data can then be imported directly into a database.  

```

```



## Create authorities table

```

```

```
insert into authorities(name)
select distinct authority 
from raw 
order by authority
```

```
update authorities a
set code = (
	select code from district_borough_unitary_region r 
	where replace(replace(replace(replace(r.name, ' City',''), ' London Boro',''), ' (B)',''), ' District','') = a.name)
```


```
select a.name as Name, c.descriptio as Type, c.code as Code, c.hectares as Hectares, ST_SimplifyPreserveTopology(geom, 0.1) as Geom from authorities a
join county_region c
on a.code = c.code
union
select b.name as Name, d.descriptio as Type, d.code as Code, d.hectares as Hectares, ST_SimplifyPreserveTopology(geom, 0.1) as Geom from authorities b
join district_borough_unitary_region d
on d.code = b.code
```


Export an authorities CSV file:

```

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
				select a.id as authority_id, a.name as Name, c.descriptio as Type, c.code as Code, c.hectares as Hectares, p.population as Population, ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(geom, 27700),4326), 0.001) as Geom 
				from authorities a
				join county_region c
				on a.code = c.code
				left outer join population p
				on p.code = a.code
				union
				select b.id as authority_id, b.name as Name, d.descriptio as Type, d.code as Code, d.hectares as Hectares, p.population as Population, ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(geom, 27700), 4326), 0.001) as Geom 
				from authorities b
				join district_borough_unitary_region d
				on d.code = b.code
				left outer join population p
				on p.code = b.code
			) As lg   
		) As f 
	)  As fc
) To 'AuthoritiesGeo.json'
```


## Create libraries table

```

```


```
insert into libraries(
	name, authority_id, postcode, eastings, northings, closed, 
	statutory2010, statutory2016, type, closed_year, opened_year, 
	replacement, notes)
select 	r.library, a.id, p.postcode, p.eastings, p.northings, 
	case 	when r.xl = 'XL' then true else false end, 
	case 	when r.statutoryapril2010 = 'yes' then true else false end,
	case 	when r.statutoryjuly2016 = 'yes' then true else false end,
	case 	when r.lal = 'LAL' then 'LAL'
			when r.crl = 'CRL' then 'CRL'
			when r.cl = 'CL' then 'CL'
			when r.icl = 'ICL' then 'ICL' end,
	cast(replace(r.yearclosed,'?','0') as integer),
	cast(replace(r.new,'?', '0') as integer),
	case 	when lower(r.replacement) = 'yes' then true else false end,
	r.notes
from raw r
join authorities a
on a.name = r.authority
left outer join postcodes p
on r.postcode = p.postcode
order by r.authority
```

Export the libraries data.

```
copy (
	select 	l.name,
		a.id "authority_id",
		l.postcode,
		ST_X(ST_Transform(ST_SetSRID(ST_MakePoint(eastings, northings), 27700), 4326)) "lng", 
		ST_Y(ST_Transform(ST_SetSRID(ST_MakePoint(eastings, northings), 27700), 4326)) "lat",
		l.closed,
		l.statutory2010,
		l.statutory2016,
		type, 
		closed_year,
		opened_year,
		replacement,
		notes
	from libraries l
	join authorities a
	on a.id = l.authority_id
) to 'Libraries.csv' DELIMITER ',' CSV HEADER;
```

## Additional dataset: OS Code-point Open

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
create table public.postcodes
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
COPY postcodes FROM 'postcodes.csv' DELIMITER ',' CSV;
```

## Additional dataset: OS boundaries

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

## Additional dataset: ONS Population estimates mid-2015

The Office for National Statistics release [mid-year population estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland), the last of these being for 2015 (release June 2016).


Create a basic table with 3 columns to store the counts.

```

```


Import the data.

```
COPY population FROM 'C:\Development\LibrariesHacked\public-libraries-news\data\UKPopulation.csv' DELIMITER ',' CSV;
```


## Additional dataset: Lower super output areas

- Download from http://geoportal.statistics.gov.uk/datasets?q=LSOA Boundaries
- Select Lower Super Output Areas (December 2001) Full Clipped Boundaries in England and Wales



```
shp2pgsql "LSOA_2001_EW_BFC_V2.shp" | psql -d uklibraries -U "postgres"
```

## Additional dataset: Indices of deprivation

- Download from https://www.gov.uk/government/statistics/english-indices-of-deprivation-2015
- Select to download the CSV *File 7: all ranks, deciles and scores for the indices of deprivation, and population denominators*

Create the table:




```
COPY imd FROM 'File_7_ID_2015_All_ranks__deciles_and_scores_for_the_Indices_of_Deprivation__and_population_denominators.csv' DELIMITER ',' CSV HEADER;
```