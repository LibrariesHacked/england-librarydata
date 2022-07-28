# England

Project to display English libraries data in a data dashboard.

## What is it?

The Libraries Taskforce have been working on an English libraries dataset to bring together a list of all libraries from library authorities in England.  This includes tracking closures, changes of library type, number of libraries, locations of libraries, and contact details.

[Public Libraries News](http://www.publiclibrariesnews.com) is the UK leading source for libraries news.  This includes regular updates about changes, local news by authority, ideas, national news, and international news.

This project aims at bringing these things together, along with latest tweets and other data - into a larger set of visualisations.

## Supporting technology

| Technology | Description |
| ---------- | ----------- |
| Web | The site is coded using front-end web technologies: HTML/CSS/JavaScript |
| Google apps scripts | Data is refreshed from Public Libraries News and Twitter by using Google apps scripts set to run regularly. |
| PostGIS database | A PostGIS database was used for the majority of the geospatial analysis. |

## Functionality

### Data dashboard

The dashboard is split into cards, providing different areas of functionality.

#### 1. Areas

The dashboard provides either data on all library services, or for specific areas (library authorities).  Using the drop down control in this card will filter the data to show for the specified library service.

#### 2. Twitter card

On selecting a library service if there is a matching tweet from the twitter data then this will be displayed.  

#### 3. Library details

If no library service selected, all libraries in England are listed to select.  If a particular service is selected then only the libraries for that service are shown.

On selecting a library, details displayed are:

- email and website (as buttons)
- library type
- closed/replaced/new details (if applicable)
- notes on the library
- deprivation deciles for the catchment area the library is located in.

#### 4. Library counts and types

If no library service is selected, this polar area chart shows the library types in England.  These are either:

- Authority: A local authority library.  Shown in green.
- Community: A community run library, with some support from the local authority.  Shown in dark blue.
- Commissioned: A library not run by the local authority but commissioned by them.  Shown in light blue.
- Independent: A library outside of local authority provision completely.  Shown in very dark grey.
- Closed:  Either permanently or temporarily closed libraries.  Shown in red.

This card also shows the total number of libraries as at July 2016, with an indicator of the difference in number since April 2010.  In then does the same for libraries that are marked as part of statutory provision.

If a library service is selected then all of the details are filtered to the libraries in that service.

#### 5. Library distances

The distance line graph is designed to show the distance (straight line - not route of travel) to the nearest library for members of the poulation.  The x axis plots the distance, starting at 0 and going to the furthest distance.  The y axis plots the number of people estimated to be that distance from a library.

When no library service is selected this shows data for England.  When a library service is selected it 

The data currently works within authority boundaries and does not take into account cross-authority boundary distance.  For example, an area of an authority may have the nearest library as one that is a different authority, this is not accounted for.

#### 6. News and changes

When a library service is selected the dashboard checks if there are associated Public Libraries News stories for that authority within the last 3 months, and shows them in this card if so.

#### 7. Deprivation stats

Deprivation stats are shown for the authority.  This is an average deprivation level of the LSOAs (Lower Super Output Areas - for which deprivation indicators are released).  LSOAs generally consist of around 1500 people.  It is not always that useful to average them over the authority.  For example, one authority may have many areas with very high deprivation, but an equal number with very low deprivation.  Another authority may have most areas with relatively mid-level deprivation.  Yet both of these situations will amount to the same average.  So take it with that understanding!

The deprivation stats are given as average deciles.  Each LSOA is given a decile (1-10) value - with 1 being within the tenth most deprived areas of the country, and 10 being within the tenth least deprived areas.

It's important not to equate least deprived with something like 'most wealthy'.  These are depriation measures so areas that have the loweest levels of deprivation are not necessary those we know of as affluent or wealthy areas.

### 8.  Nearest

Enter a postcode and select from the drop down to find the nearest library to that location.  Upon finding a location a mini map will zoom to show the route and provide some basic walking, cycling, and driving instructions.

To give a freedom to select what types of library you are interested in seeing as your local, you can untick different library types.

### Map

Map published at [https://england.librarydata.uk/map](https://england.librarydata.uk/map).

## File descriptions

A summary of some of the key files and directories in this repository.

| Folder | File | Description |
| ------ | ---- | ----------- |
| / | LICENSE | The licence for this project. MIT. |
| / | web.config | For hosting on IIS systems. |
| / | create-db.md | Step by step instructions of creating the database. |
| / | bower.json | Package manager configuration file.  Includes which packages get installed. |
| / | index.html | The home page (daashboard) |
| / | map.html | The map page |
| / | thedata.html | LIsting of data page  |
| /css/ | site.css | The stylesheet for the web site. |
| /js/ | config.js | Bits of configuration for the site |
| /js/ | libraries.js | A set of common functions used to load in and manipulate the library data |
| /js/ | dashboard.js | Javascript loaded with the dashboard page |
| /js/ | map.js | Javascript loaded with the map page |
| /js/ | tables.js | Javascript loaded with the data page |
| /images/ | dashboard.png | Image that gets displayed when linking on Twitter |

## Build

The project uses bower and node for dependency management.  It also requires the bower npm resolver package to be installed.

Set up bower requirements if necessary:

```
npm install -g bower
npm install -g bower-npm-resolver
```

And then in this project, run:

```
bower install
```

## Deploy

Once the project is built it should be able to be hosted on any web hosting environment.  Simply copy the files over.

## Third party licences

### Technology and code licences

| Name | Description | Link | Licence |
| ---- | ----------- | ---- | ------- |
| Leaflet | Lightweight JavaScript interactive map framework | [Leaflet](http://leafletjs.com/) | [Open Source](https://github.com/Leaflet/Leaflet/blob/master/LICENSE) |
| Bootstrap | HTML, CSS, and JS framework for developing responsive, mobile first projects on the web | [Bootstrap](http://getbootstrap.com/) | [MIT](https://github.com/twbs/bootstrap/blob/master/LICENSE) |
| Font Awesome |  |  |  |
| jQuery | Required by Bootstrap and used for general JavaScript shortcuts | [jQuery](https://jquery.com/) | [MIT](https://github.com/twbs/bootstrap/blob/master/LICENSE) |
| Moment JS |  |  |  |

### Data Licenses

| Data | Description | Licence |
| ---- | ----------- | ------- |
| Core Basic Dataset | The libraries taskforce core basic dataset, as collated from returns submitted by each (150) library authroity in England. | Open Government Licence |
| Public Libraries News | Data scraped from [PLN](http://www.publiclibrariesnews.com). |  |
| Map tiles | The map tiles used in any instances of web maps in the project. | &copy; Mapbox and &copy; Open Street Map contributor data. |
| OS Open Data | Includes code point open and boundary line. |  |
| ONS Open Data | Includes population estimates and indices of deprivation.  |  |

## Licence

Original code licensed under the [MIT Licence](LICENSE)
