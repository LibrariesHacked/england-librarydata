# Libraries database setup

These are instructions to set up a spatial database using the Libraries Taskforce open dataset.

## Pre-requisites

1.  A [PostgreSQL](https://www.postgresql.org/) database server.  These instructions completed with version 9.6.1.
2.  A [PostGIS](http://postgis.net/install/) database server (extensions for PostgreSQL).  These instructions completed with version 2.3.2.

## Database setup

1.  Create a new database

```
-- database: englandlibs.  create new db.
create database englandlibs;
```

2.  We want this to be a spatial database, so on the database run the command to add PostGIS extensions.

```
-- extension: postgis.  add spatial extensions to the database.
create extension postgis;
```

## Dataset: OS Code-point Open

The Ordnance Survey have an open data product listing all postcodes in the UK, complete with geo-cordinates (the centre of the postcode), and various codes specifying the authorities each postcode falls within.  

1.  Download code-point open from [OS Open Data](https://www.ordnancesurvey.co.uk/opendatadownload/products.html).  It's open data but unfortunately you need to sign up.

This data is provided as a series of CSV files for each postcode area.  It would be a lot simpler to import the data as a single CSV file.  There are many ways to combine CSV files into one, depending on your operating system.

2.  For Windows, run the following command at a command prompt.

```
copy *.csv postcodes.csv
```

Once the data is in a single CSV file it can be imported into a database.  A copy of postcodes.csv is included in the **data/OS** folder in this project.

3.  Create the table.

```
-- table: postcodes.
create table postcodes
(
  postcode character varying(8) not null,
  positional_quality_indicator integer,
  eastings numeric,
  northings numeric,
  country_code character varying(9),
  nhs_regional_ha_code character varying(9),
  nhs_ha_code character varying(9),
  admin_county_code character varying(9),
  admin_district_code character varying(9),
  admin_ward_code character varying(9),
  constraint pk_postcodes_postcode primary key (postcode)
);

-- index: cuix_postcodes_postcode.  a unique clustered index for postcode.
create unique index cuix_postcodes_postcode on postcodes using btree (postcode);
alter table postcodes cluster on cuix_postcodes_postcode;

-- index: ix_postcodes_postcode_coords.  a unique index for postcode and the postcode coordinates.
create unique index ix_postcodes_postcode_coords on postcodes using btree (postcode, eastings, northings);
```

4.  Import the postcodes data into the new table.

```
copy postcodes FROM 'postcodes.csv' delimiter ',' csv;
```

5.  Add a geometry column to make use of the eastings and northings.

```
-- add the geometry column for the table
select AddGeometryColumn ('postcodes','geom',27700,'POINT',2);
-- and update the column to store the coordinates
update postcodes set geom = ST_SetSRID(ST_MakePoint(eastings, northings), 27700);
select UpdateGeometrySRID('postcodes', 'geom', 27700);

-- index: uix_postcodes_geom.  a spatial index on the geometry.
create index ix_postcodes_geom ON postcodes using gist (geom);
```

## Dataset: OS authority boundaries

1.  Download [Boundary Lines](https://www.ordnancesurvey.co.uk/opendatadownload/products.html) from the OS Open Data products.  Alternatively, copies of the relevant boundary line files (county_region and district_borough_unitary_region) are included in the **data/os** directory of this project.

2.  From a command prompt, run the following commands (requires **shp2pgsql** which should be installed with PostGIS).  This will prompt for the password of your database server (for the specified username) and automatically create the relevant tables.

```
shp2pgsql "county_region.shp" | psql -d englandlibs -U "username"
shp2pgsql "district_borough_unitary_region.shp" | psql -d englandlibs -U "username"
```

That will create some tables with the boundary data in, but doesn't create the indexes.  We'll merge together the tables into a new one and then index that.

3.  Create the new table

```
-- table: regions.  a table to store local authority boundaries.
create table regions
(
  name character varying(60),
  area_code character varying(3),
  code character varying(9),
  hectares double precision,
  area double precision,
  geom geometry(MultiPolygon),
  constraint pk_regions_code primary key (code)
);

-- insert data into regions.
insert into regions
(select name, area_code, code, hectares, area, geom from county_region
union
select name, area_code, code, hectares, area, geom from district_borough_unitary_region);

-- geometry: set srid.
select UpdateGeometrySRID('regions', 'geom', 27700);

-- get rid of the old tables
drop table county_region;
drop table district_borough_unitary_region;
```

3.  Run the following commands on the database to do some indexing.

```
-- index: cuix_regions_code.  a unique clustered index on the authority code.
create unique index cuix_regions_code on regions using btree (code);
alter table regions cluster on cuix_regions_code;

-- Index: ix_regions_geom.  a spatial index on the geometry.
create index ix_regions_geom on regions using gist (geom);
```

## Dataset: ONS UK and Authorities population estimates mid-2015

1.  Download from the ONS [2015 mid-year population estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/populationestimatesforukenglandandwalesscotlandandnorthernireland).  A copy of the data is included in the **data/ons** directory of this project.

2.  Create a basic table with 3 columns to store the counts.

```
-- table: population
create table regions_population
(
  code character varying(9) not null,
  name character varying(60),
  population integer,
  constraint pk_population_code primary key (code)
);

-- index: cuix_population_code.  a unique clustered index on the authority code.
create unique index cuix_population_code on regions_population using btree (code);
alter table regions_population cluster on cuix_population_code;

-- index: uix_population_code_population.  a unique index on authority code and population count.
create unique index uix_population_code_population on regions_population using btree (code, population);
```

3.  Import the data from the CSV file into the table.

```
-- table: population.  populate the table
copy population FROM 'ukpopulation.csv' delimiter ',' csv;
```

## Dataset: ONS Output area boundaries

1.  Download [Output Area (December 2011) Full Clipped Boundaries in England and Wales](http://geoportal.statistics.gov.uk/datasets/09b8a48426e3482ebbc0b0c49985c0fb_0).  Select to download the Shapefile.

2.  Import the data into the database.

```
shp2pgsql "Output_Area_December_2011_Full_Clipped_Boundaries_in_England_and_Wales.shp" | psql -d englandlibs -U "username"
```

3.  Then modify the table a little and add some indexes.

```
-- table: rename to oa_boundaries
alter table "output_area_december_2011_full_clipped_boundaries_in_england_an" rename to oa_boundaries

-- geometry: set srid.
select UpdateGeometrySRID('oa_boundaries', 'geom', 27700);

-- index: cuix_oaboundaries_code.  a unique clustered index on output area code.
create unique index cuix_oaboundaries_code on oa_boundaries using btree (oa11cd);
alter table oa_boundaries cluster on cuix_oaboundaries_code;

-- index: ix_oaboundaries_geom.  a spatial index on the output area geometry.
create index ix_oaboundaries_geom on oa_boundaries using gist (geom);
```

## Dataset: Output area population mid-2015.

1.  Download the following Census Output Area population statistics. 

- [Census Output Area Estimates - London](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesinthelondonregionofengland)
- [Census Output Area Estimates - East](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesintheeastregionofengland)
- [Census Output Area Estimates - South West](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesinthesouthwestregionofengland)
- [Census Output Area Estimates - Yorkshire and the Humber](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesintheyorkshireandthehumberregionofengland)
- [Census Output Area Estimates - North West](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesinthenorthwestregionofengland)
- [Census Output Area Estimates - South East](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesinthesoutheastregionofengland)
- [Census Output Area Estimates - East Midlands](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesintheeastmidlandsregionofengland)
- [Census Output Area Estimates - West Midlands](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesinthewestmidlandsregionofengland)
- [Census Output Area Estimates - North East](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesinthenortheastregionofengland)
- [Census Output Area Estimates - Wales](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/censusoutputareaestimatesinwales)

These files are in Excel format but the second worksheet in each one can be converted to CSV to get at the data.  Copies of all the CSVs are held in this project in the **data/ons** folder.

2.  Create a database table to hold these population stats.

```
-- table: oa_populations.  a table of population stats, split by output area.
create table oa_population
(
	oa character varying(9) not null,
	lsoa character varying(9) not null,
	all_ages integer,
	age_0 integer,age_1 integer,age_2 integer,age_3 integer,age_4 integer,age_5 integer,age_6 integer,age_7 integer,age_8 integer,age_9 integer,
	age_10 integer,age_11 integer,age_12 integer,age_13 integer,age_14 integer,age_15 integer,age_16 integer,age_17 integer,age_18 integer,age_19 integer,
	age_20 integer,age_21 integer,age_22 integer,age_23 integer,age_24 integer,age_25 integer,age_26 integer,age_27 integer,age_28 integer,age_29 integer,
	age_30 integer,age_31 integer,age_32 integer,age_33 integer,age_34 integer,age_35 integer,age_36 integer,age_37 integer,age_38 integer,age_39 integer,
	age_40 integer,age_41 integer,age_42 integer,age_43 integer,age_44 integer,age_45 integer,age_46 integer,age_47 integer,age_48 integer,age_49 integer,
	age_50 integer,age_51 integer,age_52 integer,age_53 integer,age_54 integer,age_55 integer,age_56 integer,age_57 integer,age_58 integer,age_59 integer,
	age_60 integer,age_61 integer,age_62 integer,age_63 integer,age_64 integer,age_65 integer,age_66 integer,age_67 integer,age_68 integer,age_69 integer,
	age_70 integer,age_71 integer,age_72 integer,age_73 integer,age_74 integer,age_75 integer,age_76 integer,age_77 integer,age_78 integer,age_79 integer,
	age_80 integer,age_81 integer,age_82 integer,age_83 integer,age_84 integer,age_85 integer,age_86 integer,age_87 integer,age_88 integer,age_89 integer,
	age_90 integer,
	constraint pk_oapopulations_oa primary key (oa)
);

-- index: cuix_oapopulations_lsoa_oa.  a unique clustered index on lsoa code and oa code.
create unique index cuix_oapopulations_lsoa_oa on oa_population using btree (lsoa, oa);
alter table oa_population cluster on cuix_oapopulations_lsoa_oa;

-- index: uix_oapopulations_oa_population.  an index on oa code and population count.
create unique index uix_oapopulations_oa_population on oa_population using btree (oa, all_ages);
```

3.  Then import the data from the CSV files.

```
-- table:  oa_population.  populate the table.
copy oa_population FROM 'coa-population-mid2015-east.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-eastmidlands.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-london.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-northeast.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-northwest.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-southeast.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-southwest.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-wales.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-westmidlands.csv' delimiter ',' csv header;
copy oa_population FROM 'coa-population-mid2015-yorkshireandthehumber.csv' delimiter ',' csv header;
```

## Dataset: ONS Lower layer super output area boundaries

1.  Download LSOA Boundaries Shapefile from [ONS Geoportal](http://geoportal.statistics.gov.uk/datasets?q=LSOA%20Boundaries).  Select the download of [Lower Layer Super Output Areas (December 2011) Full Clipped Boundaries in England and Wales](http://geoportal.statistics.gov.uk/datasets/da831f80764346889837c72508f046fa_0).

2.  From a command line run the following command.

```
shp2pgsql "Lower_Layer_Super_Output_Areas_December_2011_Full_Clipped__Boundaries_in_England_and_Wales.shp" | psql -d englandlibs -U "username"
```

3.  Then modify the table and add some indexes.

```
-- table: rename to lsoa_boundaries.
alter table Lower_Layer_Super_Output_Areas_December_2011_Full_Clipped__Boun rename to lsoa_boundaries

-- index: cuix_lsoaboundaries_code.  a unique clustered index on lsoa code.
create unique index cuix_lsoaboundaries_code on lsoa_boundaries using btree (lsoa11cd);
alter table lsoa_boundaries cluster on cuix_lsoaboundaries_code;
-- Set the SRID for the geometry
select UpdateGeometrySRID('lsoa_boundaries', 'geom', 27700);

-- index: ix_lsoaboundaries_geom.  a spatial index on the lsoa geometry.
create index ix_lsoaboundaries_geom on lsoa_boundaries using gist (geom);
```

## Dataset: ONS Lower layer super output areas population weighted centroids

1.  Download Shapefile from [ONS Geoportal](http://geoportal.statistics.gov.uk/datasets?q=LSOA Boundaries).  Select Lower Layer Super Output Areas (December 2011) Population Weighted Centroids

2.  From a command line run the following command:

```
shp2pgsql "Lower_Layer_Super_Output_Areas_December_2011_Population_Weighted_Centroids.shp" | psql -d englandlibs -U "username"
```

3.  Then modify the table and add some indexes.

```
-- table: rename to lsoa_population_weighted.
alter table Lower_Layer_Super_Output_Areas_December_2011_Population_Weighted_Centroids rename to lsoa_population_weighted;

-- index: cuix_lsoapopulationweighted_code.
create unique index cuix_lsoapopulationweighted_code on lsoa_population_weighted using btree (lsoa11cd);
alter table lsoa_population_weighted cluster on cuix_lsoapopulationweighted_code;
select UpdateGeometrySRID('lsoa_population_weighted', 'geom', 27700);

-- index: ix_lsoapopulationweighted_geom.
create index ix_lsoapopulationweighted_geom on lsoa_population_weighted using gist (geom);
```

## Dataset: ONS Lower layer super output areas population estimates mid-2015 

1.  Download from [2015 ONS LSOA Population Estimates](https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/lowersuperoutputareamidyearpopulationestimates)  A CSV is available in the **data/ons** folder of this project.

2.  Create a table to store the data.

```
-- table: lsoa_population
create table lsoa_population
(
	code character varying(9) not null,
	name text,
	all_ages integer,
	age_0 integer,age_1 integer,age_2 integer,age_3 integer,age_4 integer,age_5 integer,age_6 integer,age_7 integer,age_8 integer,age_9 integer,
	age_10 integer,age_11 integer,age_12 integer,age_13 integer,age_14 integer,age_15 integer,age_16 integer,age_17 integer,age_18 integer,age_19 integer,
	age_20 integer,age_21 integer,age_22 integer,age_23 integer,age_24 integer,age_25 integer,age_26 integer,age_27 integer,age_28 integer,age_29 integer,
	age_30 integer,age_31 integer,age_32 integer,age_33 integer,age_34 integer,age_35 integer,age_36 integer,age_37 integer,age_38 integer,age_39 integer,
	age_40 integer,age_41 integer,age_42 integer,age_43 integer,age_44 integer,age_45 integer,age_46 integer,age_47 integer,age_48 integer,age_49 integer,
	age_50 integer,age_51 integer,age_52 integer,age_53 integer,age_54 integer,age_55 integer,age_56 integer,age_57 integer,age_58 integer,age_59 integer,
	age_60 integer,age_61 integer,age_62 integer,age_63 integer,age_64 integer,age_65 integer,age_66 integer,age_67 integer,age_68 integer,age_69 integer,
	age_70 integer,age_71 integer,age_72 integer,age_73 integer,age_74 integer,age_75 integer,age_76 integer,age_77 integer,age_78 integer,age_79 integer,
	age_80 integer,age_81 integer,age_82 integer,age_83 integer,age_84 integer,age_85 integer,age_86 integer,age_87 integer,age_88 integer,age_89 integer,
	age_90 integer,
	constraint pk_lsoapopulation_code primary key (code)
);

-- index: cuix_lsoapopulation_code.  a unique clustered index on lsoa code.
create unique index cuix_lsoapopulation_code on lsoa_population using btree (code);
alter table lsoa_population cluster on cuix_lsoapopulation_code;

-- index: uix_lsoapopulation_code_population.   a unique index on lsoa code and population.
create unique index uix_lsoapopulation_code_population on lsoa_population using btree (code, all_ages);
```

3.  Import the data

```
copy lsoa_population FROM 'lsoa-population-mid2015.csv' delimiter ',' csv header;
```

## Dataset: Indices of deprivation

1.  Download from [Gov.UK statistics](https://www.gov.uk/government/statistics/english-indices-of-deprivation-2015).  Select to download the CSV *File 7: all ranks, deciles and scores for the indices of deprivation, and population denominators*

2.  Create a table to store the data.

```
-- table: lsoa_imd.  a table to store deprivation statistics.
create table lsoa_imd
(
  lsoa_code character varying(9) not null, lsoa_name text, district_code character varying(9), district_name text,
  imd_score numeric, imd_rank integer, imd_decile integer,
  income_score numeric, income_rank integer, income_decile integer,
  employment_score numeric, employment_rank integer, employment_decile integer,
  education_score numeric, education_rank integer, education_decile integer,
  health_score numeric, health_rank integer, health_decile integer,
  crime_score numeric, crime_rank integer, crime_decile integer,
  housing_score numeric, housing_rank integer, housing_decile integer,
  environment_score numeric, environment_rank integer, environment_decile integer,
  idaci_score numeric, idaci_rank integer, idaci_decile integer,
  idaopi_score numeric, idaopi_rank integer, idaopi_decile integer,
  children_score numeric, children_rank integer, children_decile integer,
  adultskills_score numeric, adultskills_rank integer, adultskills_decile integer,
  geographical_score numeric, geographical_rank integer, geographical_decile integer,
  wider_score numeric, wider_rank integer, wider_decile integer,
  indoors_score numeric, indoors_rank integer, indoors_decile integer,
  outdoors_score numeric, outdoors_rank integer, outdoors_decile integer,
  population_total integer, dependent_children integer, sixteen_fiftynine integer, over_sixty integer, working_age numeric,
  constraint pk_imd_code primary key (lsoa_code)
);

-- index: cuix_imd_code.  a unique clustered index on lsoa code
create unique index cuix_imd_code on lsoa_imd using btree (lsoa_code);
alter table lsoa_imd cluster on cuix_imd_code;
```

3.  Copy the data from the CSV into the table.

```
copy lsoa_imd from 'lsoa-imd.csv' delimiter ',' csv header;
```

##  Dataset: Libraries Taskforce source data

1.  Convert the Excel file.  The spreadsheet is distributed from the Libraries Taskforce as an Excel file.  To convert that file it was opened in Excel, the rows copied and saved to a new file, and then saved as CSV.  The data can then be imported directly into a database.

2.  Create a table to hold the data.

```
-- table: libraries_raw.  stores the raw data from the libraries taskforce.
create table libraries_raw
(
  authority text, library text, address text, postcode text, statutoryapril2010 text, statutoryjuly2016 text, libtype text, closed text,
  yearclosed text, new text, replacement text, notes text, hours text, staffhours text, email text, url text
);
```

3.  Import the data.

```
copy libraries_raw from 'librariesraw.csv' delimiter ',' csv;
```

## Table: Authorities.

1.  Create the basic table structure.

```
-- table: authorities.  table to store a list of library services data.
create table authorities
(
  id serial, name text, code character varying(9), 
  constraint pk_authority primary key (id)
);

-- index: cuix_authorities_id. clustered index on the authority code.
create unique index cuix_authorities_id on authorities USING btree (id);
alter table authorities cluster on cuix_authorities_id;

-- index: uix_authorities_code.
create unique index uix_authorities_code on authorities USING btree (code);
```

2.  Insert all the unique authority names from the raw library data.

```
insert into authorities(name)
select distinct trim(both from authority)
from libraries_raw order by trim(both from authority);
```

Then to have a dataset that we can reliably merge from data elsewhere we're going to add the authority codes used in datasets like those published by the Office for National Statistics, and Ordnance Survey.  That data can come from the authority boundaries.

3.  Try to match using the region table.

```
update authorities a
set code = (
	select code from regions r
	where regexp_replace(r.name,' City| London Boro| \(B\)| District|City of | County', '','g') = a.name)
where a.code is null;
```

That will still leave 10 with no matching code.  The reason for this will be authorities in the taskforce dataset that are named irregularly (e.g. *Bath and NE Somerset* instead of *Bath and North East Somerset*).

4.  Edit the table manually to fill in the missing values.

```
-- table: authorities.  populate the table.
update authorities set code = 'E06000022' where name = 'Bath and NE Somerset';
update authorities set code = 'E06000043' where name = 'Brighton and Hove';
update authorities set code = 'E09000001' where name = 'City of London';
update authorities set code = 'E06000047' where name = 'Durham';
update authorities set code = 'E06000019' where name = 'Herefordshire';
update authorities set code = 'E06000016' where name = 'Leicester City';
update authorities set code = 'E06000033' where name = 'Southend on Sea';
update authorities set code = 'E08000013' where name = 'St Helens';
update authorities set code = 'E06000004' where name = 'Stockton on Tees';
update authorities set code = 'E06000021' where name = 'Stoke on Trent';
```

## Get all the LSOAs for each authority

1.  Create a table to hold the LSOA lookups.

```
-- table: authorities_lsoas.  stores a lookup to match authority code to lsoa code.
create table authorities_lsoas
(
  code character varying(9), lsoa_code character varying(9),
  constraint pk_authoritieslsoas_code primary key (code, lsoa_code)
);

-- index: cuix_authoritieslsoas_code_lsoa.  unique clustered index on authority and lsoa code.
create unique index cuix_authoritieslsoas_code_lsoa on authorities_lsoas using btree (code, lsoa_code);
alter table authorities_lsoas cluster on cuix_authoritieslsoas_code_lsoa;
```

2.  And then insert the data into that table.

```
-- table:  authorities_lsoas.  populate the table.
insert into authorities_lsoas
select r.code, ls.lsoa11cd
from authorities a
join regions r
on a.code = r.code
join lsoa_boundaries ls
on ST_Intersects(ls.geom, r.geom)
and ST_Area(ST_Intersection(r.geom, ls.geom))/ST_Area(ls.geom) > 0.5;
```

## Get all the OAs for each authority

1.  Create the table to hold the output area lookups.

```
-- table: authorities_oas.  holds output area codes for each authority.
create table authorities_oas
(
  code character varying(9), lsoa_code character varying(9), oa_code character varying(9),
  constraint pk_authoritiesoas_code primary key (code, lsoa_code, oa_code)
);

-- index: cuix_authoritiesoas_code_lsoa_oa.
create unique index cuix_authoritiesoas_code_lsoa_oa on authorities_oas using btree (code, lsoa_code, oa_code);
alter table authorities_oas cluster on cuix_authoritiesoas_code_lsoa_oa;
```

2.  And import the data

```
-- table:  authorities_oas.  populate the table.
insert into authorities_oas
select r.code, ls.lsoa11cd, oa.oa11cd
from authorities a
join regions r
on a.code = r.code
join lsoa_boundaries ls
on ST_Intersects(ls.geom, r.geom)
and ST_Area(ST_Intersection(r.geom, ls.geom))/ST_Area(ls.geom) > 0.5
join oa_boundaries oa
on ST_Intersects(oa.geom, ls.geom)
and ST_Area(ST_Intersection(ls.geom, oa.geom))/ST_Area(oa.geom) > 0.5
```

## Export the authorities details

1.  Export an authorities CSV file.

```
-- export: authorities.
copy (
	select
	a.id as authority_id,
	a.name as name,
	r.code as code,
	r.hectares as hectares,
	round(avg(i.imd_decile), 3) as multiple,
	round(avg(i.income_decile), 3) as income,
	round(avg(i.employment_decile), 3) as employment,
	round(avg(i.education_decile), 3) as education,
	round(avg(i.health_decile), 3) as health,
	round(avg(i.crime_decile), 3) as crime,
	round(avg(i.housing_decile), 3) as housing,
	round(avg(i.environment_decile), 3) as environment,
	round(avg(i.idaci_decile), 3) as idaci,
	round(avg(i.idaopi_decile), 3) as idaopi,
	round(avg(i.children_decile), 3) as education,
	round(avg(i.adultskills_decile), 3) as adultskills,
	round(avg(i.geographical_decile), 3) as services,
	round(avg(i.wider_decile), 3) as wider,
	round(avg(i.indoors_decile), 3) as indoors,
	round(avg(i.outdoors_decile), 3) as outdoors,
	p.population as population,
	sum(lsp.age_0 + lsp.age_1 + lsp.age_2 + lsp.age_3 + lsp.age_4 + lsp.age_5 + lsp.age_6 + lsp.age_7 + lsp.age_8 +
	lsp.age_9 + lsp.age_10 + lsp.age_11 + lsp.age_12 + lsp.age_13 + lsp.age_14 + lsp.age_15) as dependent_children,
	sum(lsp.age_16 + lsp.age_17 + lsp.age_18 + lsp.age_19 + lsp.age_20 + lsp.age_21 + lsp.age_22 + lsp.age_23 + lsp.age_24 +
	lsp.age_25 + lsp.age_26 + lsp.age_27 + lsp.age_28 + lsp.age_29 + lsp.age_30 + lsp.age_31 + lsp.age_32 + lsp.age_33 + lsp.age_34 +
	lsp.age_35 + lsp.age_36 + lsp.age_37 + lsp.age_38 + lsp.age_39 + lsp.age_40 + lsp.age_41 + lsp.age_42 + lsp.age_43 + lsp.age_44 +
	lsp.age_45 + lsp.age_46 + lsp.age_47 + lsp.age_48 + lsp.age_49 + lsp.age_50 + lsp.age_51 + lsp.age_52 + lsp.age_53 + lsp.age_54 +
	lsp.age_55 + lsp.age_56 + lsp.age_57 + lsp.age_58 + lsp.age_59 + lsp.age_60 + lsp.age_61 + lsp.age_62 + lsp.age_63) as working_age,
	sum(lsp.age_16 + lsp.age_17 + lsp.age_18 + lsp.age_19 + lsp.age_20 + lsp.age_21 + lsp.age_22 + lsp.age_23 + lsp.age_24 + 
	lsp.age_25 + lsp.age_26 + lsp.age_27 + lsp.age_28 + lsp.age_29 + lsp.age_30 + lsp.age_31 + lsp.age_32 + lsp.age_33 + lsp.age_34 + 
	lsp.age_35 + lsp.age_36 + lsp.age_37 + lsp.age_38 + lsp.age_39 + lsp.age_40 + lsp.age_41 + lsp.age_42 + lsp.age_43 + lsp.age_44 + 
	lsp.age_45 + lsp.age_46 + lsp.age_47 + lsp.age_48 + lsp.age_49 + lsp.age_50 + lsp.age_51 + lsp.age_52 + lsp.age_53 + lsp.age_54 + 
	lsp.age_55 + lsp.age_56 + lsp.age_57 + lsp.age_58 + lsp.age_59) as sixteen_fiftynine,
	sum(lsp.age_60 + lsp.age_61 + lsp.age_62 + lsp.age_63 + lsp.age_64 + lsp.age_65 + lsp.age_66 + lsp.age_67 + lsp.age_68 + 
	lsp.age_69 + lsp.age_70 + lsp.age_71 + lsp.age_72 + lsp.age_73 + lsp.age_74 + lsp.age_75 + lsp.age_76 + lsp.age_77 + lsp.age_78 + 
	lsp.age_80 + lsp.age_81 + lsp.age_82 + lsp.age_83 + lsp.age_84 + lsp.age_85 + lsp.age_86 + lsp.age_87 + lsp.age_88 + lsp.age_89 + lsp.age_90) as over_sixty
		from authorities a
		join regions r
		on a.code = r.code
		join regions_population p
		on p.code = a.code
		join authorities_lsoas ls
		on ls.code = r.code
		join lsoa_imd i
		on i.lsoa_code = ls.lsoa_code
		join lsoa_population lsp
		on lsp.code = ls.lsoa_code
		group by a.id, a.name, r.code, r.hectares, p.population
		order by a.name
) to 'authorities.csv' delimiter ',' csv header;
```

2.  Export the authorities as GeoJSON.

```
-- export:  authorities_geo.
copy (
	select row_to_json(fc)
	from (
		select 'FeatureCollection' As type, array_to_json(array_agg(f)) as features
		from (
			select 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((select l from (select authority_id, name, code) As l)) as properties
			from (
				select a.id as authority_id, a.name as name, r.code as code, ST_SimplifyPreserveTopology(ST_Transform(geom, 4326), 0.002) as geom 
				from authorities a
				join regions r
				on a.code = r.code
				order by a.name
			) As lg
		) As f
	)  As fc
) To 'authorities_geo.json'
```

## Create libraries table

1.  Create the table.

```
-- table: libraries.  stores the library data.
create table libraries
(
  id serial, name text, authority_id integer, address text,
  postcode character varying(8), postcode_easting numeric, postcode_northing numeric,
  lat numeric, lng numeric,
  type character varying(4),
  closed character varying(4), closed_year text,
  statutory2010 boolean, statutory2016 boolean,
  opened_year text, replacement boolean,
  notes text, hours text, staffhours text,
  email text, url text,
  constraint pk_library primary key (id)
);

-- index: cuix_libraries_id_authid.
create unique index cuix_libraries_id_authid on libraries using btree (id, authority_id);
alter table libraries cluster on cuix_libraries_id_authid;

-- index: uix_libraries_authid.
create index uix_libraries_authid on libraries using btree (authority_id);
```

2.  Take data from lots of tables and put it into the libraries table.

```
-- table: libraries.  populate the library data.
insert into libraries(
	name, authority_id, address, postcode, postcode_easting, postcode_northing, type, closed, closed_year, statutory2010, 
	statutory2016, opened_year, replacement, notes, hours, staffhours, email, url)
select trim(both from r.library), a.id, trim(both from r.address), p.postcode,
	p.eastings, p.northings, trim(both from r.libtype),
	trim(both from r.closed),
	trim(both from r.yearclosed),
	case when lower(trim(both from r.statutoryapril2010)) = 'yes' then true else false end,
	case when lower(trim(both from r.statutoryjuly2016)) = 'yes' then true else false end,
	trim(both from r.new),
	case when lower(trim(both from replacement)) not like 'no%' and trim(both from replacement) != '' then true else false end,
	trim(both from r.notes), trim(both from r.hours), trim(both from r.staffhours), trim(both from r.email), trim(both from r.url)
from libraries_raw r
join authorities a
on a.name = trim(both from r.authority)
left outer join postcodes p
on replace(upper(r.postcode), ' ', '') = replace(p.postcode, ' ', '')
order by r.authority, r.library;
```

There are some decisions to be made about cleaning up the data from the raw library details into a new one.  For library types there are the following in the dataset:

| Library type | Count | Description |
| ------------ | ----- | ----------- |
| | 236 | No library type, but they are all closed libraries.  Leave as is. |
| ICL+ | 8 | Seem to be the same as ICL.  Will convert these to ICL.  |
| LAL | 2247 | Library building funded, run and managed by local authority staff.  Leave as is. |
| CRL | 279 | Libraries operating now as a library with some level of ongoing support from a local authority.  Leave as is. |
| CL | 406 | Libraries commissioned and funded by a local authority.  Leave as is. |
| ICL | 34 | Libraries transferred to the management of a non local authority body, either community group or third party, which is OUTSIDE THE LOCAL AUTHORITY NETWORK.  Leave as is. |
| LAL- | 30 | These appear to be book drops and other non-libraries.  Will remove these. |
| CRL+ | 29 | Seem to be the same as CRL.  Will convert to CRL. |

Now, what about the closed status?

| Closed type | Count | Description |
| ----------- | ----- | ----------- |
|  | 3021 | No closed indicator.  Hopefully they're not closed.  Leave as is. |
| XL | 119 | Closed library.  Leave as is. |
| XLR | 114 | Library replaced.  Leave as is. |
| XLT | 15 | Library temporarily closed.  Leave as is. |

That makes for 248 closed libraries.  Aside from the statuses, there are then some oddities.

| Issue | Count | Resolution |
| ----- | ----- | ---------- |
| No closed status but a closed year.  What's going on here?  Set them to closed. | 5 | Set closed status to XL.  Set statutory2016 value to No. |
| Less replaced libraries than replacements | 114/216 | There are 114 libraries set as replaced.  And 216 libraries marked as replacements.  The likelihood here is that library services have included new libraries but not listed the ones they replaced.  Can't do much about that, except accoutn for it in the dashboard. |
| Closed status but also library type.  Would like this to always be the case but it is generally not.  | 13 | Remove the library type where the library is closed. |

So that's a set of rules for library type.  Then there is the statutory and non-statutory indicator for 2010 and 2016.  Services completing the data return should indicate (Yes/No) whether the library was included as part of their statutory service both in April 2010 and July 2016.  If the library is new then it should be marked as No in 2010.  There are the following slightly odd responses:

| Issue | Count | Resolution |
| ------ | ----- | ---------- |
| Library, not marked as new or replacement, but marked as statutory in 2016 but not in 2010.  Some of these appear to be libraries that haven't changed status. Others are micro libraries or collections that are replacements for mobile library services. | 31 | Change statutory 2016 value to No.  |
| Independent community library marked as statutory in 2016.  If these are supported by the authority, would expect them to be marked as CRL. | 1 | Change statutory 2016 value to No. |
| Have a closed year but marked as statutory in 2016.  Some may be temporary closures, others indefinite. | 6 | Change statutory 2016 value to No. |
| New, but marked as statutory in 2010.  | 122 | Change statutory 2010 value to No |
| Have a closed status but marked as statutory in 2016.  | 9 | Change statutory 2016 value to No |

Then, there's the closed and opened years.  

| Issue | Count | Resolution |
| ----- | ----- | ---------- |
| No closed year, but closed status. | 13 | Set to closed in 2016. |
| Invalid closed year.  If completed, these should be a year (e.g. 2015).  Some of them are dates like Sep-2015. | 13 | Manually correct.  Could prob do it cleverly but not much point. |
| Invalid opened year.  If completed, these should be a year (e.g. 2015).  Some of them are dates like Sep-2015. There are 4 occasions that authorities think it's appropriate to put 'Yes' to a question on closed year. | 19 | Manually correct.  Could prob do it cleverly but not much point. |

What about addresses?

| Issue | Count | Resolution |
| ----- | ----- | ---------- |
| No address and no postcode | 19 | Must fix these manually. |
| Invalid postcodes in raw data |  | Must fix manually |

3. Clean up the data.  Run the following scripts to implement the rules above.

```
-- library type rules
delete from libraries where type = 'LAL-';
update libraries set type = 'ICL' where type = 'ICL+';
update libraries set type = 'CRL' where type = 'CRL+';

-- closed oddities
update libraries set closed = 'XL' where closed_year is not null;
update libraries set type = null where type is not null and closed is not null;

-- statutory indicator rules
update libraries set statutory2016 = 'f' where statutory2016 = 't' and statutory2010 = 'f' and opened_year is null;
update libraries set statutory2016 = 'f' where type = 'ICL';
update libraries set statutory2010 = 'f' where closed_year is not null and statutory2016 = 't';
update libraries set statutory2010 = 'f' where opened_year is not null;
update libraries set statutory2016 = 'f' where closed is not null and statutory2016 = 't';

-- corrections to closed years
update libraries set closed_year = '2013' where authority_id = 1 and name = 'Castle Green' and closed_year is not null;
update libraries set closed_year = '2010' where authority_id = 1 and name = 'Fanshawe' and closed_year is not null;
update libraries set closed_year = '2012' where authority_id = 1 and name = 'Markyate' and closed_year is not null;
update libraries set closed_year = '2013' where authority_id = 1 and name = 'Rush Green' and closed_year is not null;
update libraries set closed_year = '2016' where authority_id = 16 and name = 'Cheltenham Road' and closed_year is not null;
update libraries set closed_year = '2014' where authority_id = 54 and name = 'Rainham Library' and closed_year is not null;
update libraries set closed_year = '2016' where authority_id = 69 and name = 'Burley library' and closed_year is not null;
update libraries set closed_year = '2016' where authority_id = 71 and name = 'Barwell' and closed_year is not null;
update libraries set closed_year = '2016' where authority_id = 111 and name = 'Central library' and closed_year is not null;
update libraries set closed_year = '2012' where authority_id = 121 and name = 'Dialstone Library' and closed_year is not null;
update libraries set closed_year = '2014' where authority_id = 149 and name = 'Ashmore Park Library' and closed_year is not null;
update libraries set closed_year = '2010' where authority_id = 149 and name = 'Wednesfield Library' and closed_year is not null;
update libraries set closed_year = '2016' where authority_id = 151 and name = 'Haxby' and closed_year is not null;

-- corrections to opened years
update libraries set opened_year = '2010' where authority_id = 1 and name = 'Dagenham' and opened_year is not null;
update libraries set opened_year = '2016' where authority_id = 2 and name = 'Grahame Park (now called Colindale)' and opened_year is not null;
update libraries set opened_year = '2010' where authority_id = 20 and name = 'King Cross' and opened_year is not null;
update libraries set opened_year = '2016' where authority_id = 44 and name = 'Chopwell Library' and opened_year is not null;
update libraries set opened_year = '2016' where authority_id = 44 and name = 'Felling Library' and opened_year is not null;
update libraries set opened_year = '2015' where authority_id = 44 and name = 'Wrekenton Library' and opened_year is not null;
update libraries set opened_year = '2016' where authority_id = 51 and name = 'Marcus Garvey Library' and opened_year is not null;
update libraries set opened_year = '2014' where authority_id = 54 and name = 'Rainham Library' and opened_year is not null;
update libraries set opened_year = '2010' where authority_id = 89 and name = 'Corby' and opened_year is not null;
update libraries set opened_year = '2015' where authority_id = 89 and name = 'Towcester' and opened_year is not null;
update libraries set opened_year = '2012' where authority_id = 89 and name = 'Wootton' and opened_year is not null;
update libraries set opened_year = '2013' where authority_id = 110 and name = 'Craven Arms' and opened_year is not null;
update libraries set opened_year = '2016' where authority_id = 111 and name = 'Library @ The Curve' and opened_year is not null;
update libraries set opened_year = '2014' where authority_id = 121 and name = 'Adswood and Bridgehall' and opened_year is not null;
update libraries set opened_year = '2014' where authority_id = 121 and name = 'Offerton' and opened_year is not null;
update libraries set opened_year = '2010' where authority_id = 127 and name = 'Library @ The Life Centre' and opened_year is not null;
update libraries set opened_year = '2013' where authority_id = 127 and name = 'Library @ Westcroft Centre' and opened_year is not null;
update libraries set opened_year = '2012' where authority_id = 129 and name = 'Hattersley' and opened_year is not null;
update libraries set opened_year = '2014' where authority_id = 149 and name = 'Wednesfield Library' and opened_year is not null;

-- correct invalid postcodes
"Central";"Barnsley" "S70 2JF" to S70 2SR
"Paulton (The Hub)";"Bath and NE Somerset""BS29 7QG" to BS39 7QG
"Shard End Library";"Birmingham" B34 7AG to B34 7AZ
"Bingley ";"Bradford" BD16 1AW to BD16 1AJ
"Keighley ";"Bradford" BD21 3SX to BD21�3RY
"Preston";"Brent" HA9 8PL to HA9 8PP
"Town Hall";"Brent" HA9 9HU to HA9 9HP
"Winslow";"Buckinghamshire" MK18 3RB to MK18 3DL
"Camomile Street Library";"City of London" EC3A 7EX to EC3A 7AS
"Appleby Library";"Cumbria" CA16 1QP to CA16 6QN
"Brampton Library ";"Cumbria" CA8 8NX to CA8 1NW
"Burton Book Drop";"Cumbria" LA6 7NA to LA6 1NA
"Consett Library";"Durham" DH8 5AT to DH8 5SD
"Newton Aycliffe Library";"Durham" DL5 5QG to DL5 5RW
"Crowborough Library";"East Sussex" TN6 1DH to TN6 1AR
"Chelmsford library";"Essex" CM1 1LH to CM1 3UP
"Frinton library";"Essex" C013 9DA to CO13 9DA
"Alresford ";"Hampshire" S024 9AQ to SO24 9AQ
"Central Resources Library";"Hertfordshire" AL10 8XG to AL10 8TN
"Harpenden";"Hertfordshire" AL5 4EN to AL5 4ED
"Redbourn";"Hertfordshire" AL3 3JQ to AL3 7BP
"Allington Library";"Kent"  ME6 0PR to ME16 0PR
"Newington Library";"Kent" CT12 6NB to CT12 6FA
"Holderness Road Customer Service Centre Library";"Kingston upon Hull" HU9 2AH to HU9 2BN
"Waterloo";"Lambeth" SE1 7AG to SE1 7AE
"Garforth library and one stop centre";"Leeds" LS25 1DU to LS25 1EH
"Farley Community Centre";"Luton"
"Wigmore";"Luton"
"Arcadia library and leisure centre";"Manchester"
"Newbiggin Hall Library";"Newcastle upon Tyne"
"East Ham Library";"Newham"
"Diss Library";"Norfolk"
"Long Ashton ";"North Somerset"
"Portishead";"North Somerset"
"Weston-super-Mare ";"North Somerset"
"Forest Hall";"North Tyneside"
"Shiremoor";"North Tyneside"
"Corby";"Northamptonshire"
"Corby";"Northamptonshire"
"Daventry";"Northamptonshire"
"Thrapston";"Northamptonshire"
"Mansfield Woodhouse ";"Nottinghamshire"
"Newark ";"Nottinghamshire"
"Worksop";"Nottinghamshire"
"Failsworth Library";"Oldham"
"Littlemore";"Oxfordshire"
"Old Marston";"Oxfordshire"
"Peers";"Oxfordshire"
"Skelton Library";"Redcar and Cleveland"
"Richmond Information & Reference Library";"Richmond upon Thames"
"Richmond Local Studies Library & Archive";"Richmond upon Thames"
"Central Library and Arts Centre";"Rotherham"
"Highley";"Shropshire"
"Primrose library";"South Tyneside"
"Adswood and Bridgehall ";"Stockport"
"Dialstone Library";"Stockport"
"Offerton ";"Stockport"
"Thornaby Central Library and Customer Service Centre";"Stockton on Tees"
"Park Library";"Swindon"
"Bethnal Green library";"Tower Hamlets"
"Wakefield One";"Wakefield"
"Wakefield (Drury lane)";"Wakefield"
"Wakefield (Balne Lane)";"Wakefield"
"Lymm ";"Warrington"
"Trowbridge";"Wiltshire"
"Wargrave ";"Wokingham"


-- correct addresses with no data


```

## Geocoding the libraries

Although all of the libraries have some address data (either a full address or postcode).  We need coordinates in order to do some of the geographic profiling, and match libraries to particuar areas.  To do this, we'll need to use a geocoding service such as Open Street Map.  Where we can't get geocoordinates, we can always fall back on postcodes, for which we have the centre coordinates (centroids).  That is a little less accurate though as a postcode can span over a wide area.

1.  Export the libraries data to geocode it.  While doing this, create a bounding box to limit the area that we wish to search within.  This should give the geocoder more to go on, and reduce the number of false matches, which we won't otherwise be able to check.

```
copy (
	select 	l.id, l.name, l.address, l.postcode, 
	case when l.postcode is not null then ST_AsText(ST_Envelope(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(l.postcode_easting, l.postcode_northing), 27700), 4326)::geography, 1609)::geometry))
	else ST_AsText(ST_Envelope(ST_Transform(r.geom, 4326))) end
	from libraries l
	join authorities a
	on a.id = l.authority_id
	join regions r
	on r.code = a.code
) to '/data/libraries/libraries_addresses.csv' delimiter ',' csv header;
```

4.  We're then going to run this through a geocoder.

There is a python script in the scripts directory of this project that will take the output of the above query (librariesgeo.csv), and geocode it using Open Street Map.

Run that file, which will take about an hour.  It will produce another file (librariesgeo.csv).

5.  Create a table to store the locations.

```
create table librarylocations
(
  libraryid integer not null,
  lat numeric,
  lng numeric,
  constraint pk_librarylocations_libraryid primary key (libraryid)
);
```

6.  Import the library locations.

```
copy librarylocations from 'librarylocations.csv' delimiter ',' csv;
```

7.  And update the locations.  This checks that the geocoded value is also within the relevant authority boundary.

```
update libraries u
set lat = ll.lat, lng = ll.lng
from librarylocations ll
join libraries l
on l.id = ll.libraryid
join authorities a
on a.id = l.authority_id
where ST_Within(
	ST_Transform(ST_SetSRID(ST_MakePoint(ll.lng, ll.lat), 4326), 27700), 
	(select geom 
		from (	select code, geom 
			from regions ) ab 
		where ab.code = a.code))
and u.id = ll.libraryid;
```

8.  Then, fill in any blanks with the postcode values:

```
update libraries l
set lat = l.postcodelat,
lng = l.postcodelng
where l.lat is null and l.lng is null;
```

9. The create a convenient geometry column.

```
select AddGeometryColumn ('libraries','geom', 27700, 'POINT', 2);
-- and update the column to store the coordinates
update libraries set geom = ST_Transform(ST_SetSRID(ST_MakePoint(lng, lat), 4326), 27700);

-- index: uix_libraries_geom
create index ix_libraries_geom on libraries using btree (geom);
```

## Export data on libraries.

1.  Export a CSV.

```
copy (select l.name,
	a.id "authority_id",
	l.address,
	l.postcode,
	l.lat,
	l.lng,
	l.statutory2010,
	l.statutory2016,
	l.type, 
	l.closed,
	l.closed_year,
	l.opened_year,
	l.replacement,
	l.notes,
	l.hours,
	l.staffhours,
	l.url,
	l.email,
	-- Add the LSOA data
	ls.lsoa11nm "lsoa_name",
	ls.lsoa11cd "lsoa_code",
	-- Add the deprivation data
	i.imd_decile as multiple,
	i.income_decile as income,
	i.employment_decile as employment,
	i.education_decile as education,
	i.children_decile as children,
	i.health_decile as health,
	i.adultskills_decile as adultskills,
	i.crime_decile as crime,
	i.housing_decile as housing,
	i.geographical_decile as services,
	i.environment_decile as environment
from libraries l
join authorities a
on a.id = l.authority_id
left outer join lsoa_boundaries ls
on ST_Within(l.geom, ls.geom)
left outer join imd i
on i.lsoa_code = ls.lsoa11cd) to 'data\libraries\libraries.csv' delimiter ','csv header;
```

## Distance calculations and catchment areas

It'd also be good to do some distance analysis, such as how far people have to travel to their nearest library.  What we need for that is to create a catchment area for each library from census output areas.  

It makes sense to only do this for statutory libraries.  It also makes sense to do it only for open libraries, but then it may also be useful to see what a catchment area was for a closed library.  To do this we need to run a catchment analysis for libraries open in 2010 and one for libraries open in 2016.

1.  Create a table to hold library catchment areas.

```
-- table: libraries_catchments.  holds libraries and output areas.
create table libraries_catchments (
	library_id integer,
	oa_code character varying(9),
	constraint pk_librariescatchments_id_code primary key (library_id, oa_code)
);

-- index: cuix_librarycatchments_id_code.  clustered unique index on library id and oa code.
create unique index cuix_librariescatchments_id_code on libraries_catchments using btree (library_id, oa_code);
alter table libraries_catchments cluster on cuix_librariescatchments_id_code;
```

2.  Create the catchment areas for current open and statutory libraries.

```
insert into libraries_catchments
select
(select l.id
	from libraries l
	join authorities a
	on a.id = l.authority_id
	join authorities_oas ao
	on ao.code  = a.code
	and ao.oa_code = o.oa11cd
	where l.statutory2016 = 't'
	and l.closed is null
	order by l.geom <-> o.geom limit 1) as library_id,
o.oa11cd
from oa_boundaries o
join authorities_oas aos
on aos.oa_code = o.oa11cd;
```

3.  Add the catchment areas for closed libraries.

```
insert into libraries_catchments
select ca.library_id, ca.ao11cd from (
	select
	(select l.id
		from libraries l
		join authorities a
		on a.id = l.authority_id
		join authorities_oas ao
		on ao.code  = a.code
		and ao.oa_code = o.oa11cd
		where l.statutory2010 = 't'
		order by l.geom <-> o.geom limit 1) as library_id,
	o.oa11cd
	from oa_boundaries o
	join authorities_oas aos
	on aos.oa_code = o.oa11cd) as ca
join libraries li
on li.id = ca.library_id
where li.closed is not null;
```

4.  Add a table for cross authority catchment areas.

```
-- table: libraries_catchments.  holds libraries and output areas.
create table libraries_catchments_xauth (
	library_id integer,
	oa_code character varying(9),
	constraint pk_librariescatchmentsxauth_id_code primary key (library_id, oa_code)
);

-- index: cuix_librarycatchmentsxauth_id_code.  clustered unique index on library id and oa code.
create unique index cuix_librariescatchmentsxauth_id_code on libraries_catchments_xauth using btree (library_id, oa_code);
alter table libraries_catchments_xauth cluster on cuix_librariescatchmentsxauth_id_code;
```

5.  Add cross-authority catchment areas for open libraries

```
insert into libraries_catchments_xauth
select
(select l.id
	from libraries l
	where l.statutory2016 = 't'
	and l.closed is null
	order by l.geom <-> o.geom limit 1) as library_id,
o.oa11cd
from oa_boundaries o
join authorities_oas aos
on aos.oa_code = o.oa11cd;
```

6.  Add cross-authority catchment areas for closed libraries

```
insert into libraries_catchments_xauth
select ca.library_id, ca.oa11cd from( 
	select
	(select l.id
		from libraries l
		where l.statutory2010 = 't'
		order by l.geom <-> o.geom limit 1) as library_id,
	o.oa11cd
	from oa_boundaries o
	join authorities_oas aos
	on aos.oa_code = o.oa11cd) as ca
join libraries li
on li.id = ca.library_id
where li.closed is not null;
```

## Distance calculations

1.  Export a file to show distances for authorities.

```
copy (select a.id as authority, sum(op.all_ages) as population, round(round(cast(ST_Distance(l.geom, ST_Centroid(oab.geom)) / 1609.34 as numeric) * 2, 0) /2, 1) as distance
from libraries_catchments lc
join libraries l
on l.id = lc.library_id
join authorities_oas ao
on ao.oa_code = lc.oa_code
join authorities a
on a.code = ao.code
join oa_population op
on op.oa = lc.oa_code
join oa_boundaries oab
on oab.oa11cd = lc.oa_code
where l.closed is null
group by authority, distance) to 'data\libraries\distances.csv' delimiter ','csv header;
```

2.  Export a file to show distances within the catchment for each library.

```
copy (select l.id, 
sum(op.all_ages) as population, 
round(cast(ST_Distance(l.geom, ST_Centroid(oab.geom)) / 1609.34 as numeric), 1) as distance
from libraries_catchments lc
join libraries l
on l.id = lc.library_id
join oa_boundaries oab
on oab.oa11cd = lc.oa_code
join oa_population op
on op.oa = lc.oa_code
group by l.id, distance) to 'data\libraries\librariesdistances.csv' delimiter ','csv header;
```