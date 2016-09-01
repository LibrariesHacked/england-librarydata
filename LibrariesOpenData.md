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
select distinct authority from raw order by authority
```

```
update authorities a
set code = (select code from district_borough_unitary_region r where replace(replace(replace(replace(r.name, ' City',''), ' London Boro',''), ' (B)',''), ' District','') = a.name)
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


Export the authorities:

```
copy (
	select row_to_json(fc)
	from (
		select 'FeatureCollection' As type, array_to_json(array_agg(f)) as features 
		from (
			select 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((SELECT l FROM (SELECT name, type, code, hectares) As l)) as properties
			from (
				select a.name as Name, c.descriptio as Type, c.code as Code, c.hectares as Hectares, ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(geom, 27700),4326), 0.001) as Geom 
				from authorities a
				join county_region c
				on a.code = c.code
				union
				select b.name as Name, d.descriptio as Type, d.code as Code, d.hectares as Hectares, ST_SimplifyPreserveTopology(ST_Transform(ST_SetSRID(geom, 27700), 4326), 0.001) as Geom from authorities b
				join district_borough_unitary_region d
				on d.code = b.code
			) As lg   
		) As f 
	)  As fc
) To 'C:\development\librarieshacked\public-libraries-news\data\Authorities.json'
```


## Create libraries table


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
COPY postcodes FROM 'C:\Users\dave_\Desktop\CSV\postcodes.csv' DELIMITER ',' CSV;
```

## Additional dataset: OS boundaries

The Ordnance Survey release 


```
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\county_electoral_division_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\county_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\district_borough_unitary_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\district_borough_unitary_ward_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\european_region_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\greater_london_const_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\high_water_polyline.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\parish_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\scotland_and_wales_const_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\scotland_and_wales_region_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\unitary_electoral_division_region.shp" | psql -d uklibraries -U "postgres"
shp2pgsql "C:\Users\dave_\Desktop\Boundaries\Data\GB\westminster_const_region.shp" | psql -d uklibraries -U "postgres"
```

## Additional dataset: ONS Population estimates mid-2015


## Additional dataset: Lower super output areas



## Additional dataset: Indices of deprivation