# England.  LibraryData.

Project to display English libraries data in a data dashboard.

## What is it?

The Libraries Taskforce have been working on an English libraries dataset to bring together a list of all libraries and library authorities in England.  This includes tracking closures, changes of library type, number of libraries, locations of libraries, and contact details.

[Public Libraries News](http://www.publiclibrariesnews.com) is the UK leading source for libraries news.  This includes regular updates about changes, local news by authority, ideas, national news, and international news.

This project aims at bringing these things together, along with latest tweets and other data - into a larger set of visualisations.

## Supporting technology

| Technology | Description |
| ---------- | ----------- |
| Web | The site is coded using front-end web technologies: HTML/CSS/JavaScript |
| Google apps scripts | Data is refreshed from Public Libraries News and Twitter by using Google apps scripts. |
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

### 4. Library counts and types

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



### 8.  Nearest.



### Map


### The Data


### About 


## File descriptions

A summary of some of the key files in this repository.

| Folder | File | Description |
| ------ | ---- | ----------- |
| / | LICENSE |  |
| / | create-db.md |  |
| / | bower |  |
| / | index.html |  |
| / | map.html |  |
| / | data.html |  |
| /css/ | site.js |  |
| /js/ | dashboard.js |  |
| /js/ | map.js |  |
| /js/ | map.js |  |
| /data/ |  |  |

## Build

The project uses bower for dependency management.  To build, run:

```
bower install
```

## Deploy

Once the project is built it should be able to be hosted on any web hosting environment.

## Third party licences

### Data licences

| Name | Description | Link | Licence |
| ---- | ----------- | ---- | ------- |
| | | | |

### Technology and code licences

| Name | Description | Link | Licence |
| ---- | ----------- | ---- | ------- |
| Leaflet | Lightweight JavaScript interactive map framework | [Leaflet](http://leafletjs.com/) | [Open Source](https://github.com/Leaflet/Leaflet/blob/master/LICENSE) |
| Bootstrap | HTML, CSS, and JS framework for developing responsive, mobile first projects on the web | [Bootstrap](http://getbootstrap.com/) | [MIT](https://github.com/twbs/bootstrap/blob/master/LICENSE) |
| Bootswatch |  |  |  |
| Font Awesom |  |  |  |
| jQuery | Required by Bootstrap and used for general JavaScript shortcuts | [jQuery](https://jquery.com/) | [MIT](https://github.com/twbs/bootstrap/blob/master/LICENSE) |
| Moment JS |  |  |  |

## Licence

Original code licensed under the [MIT Licence](LICENSE)

## Data Licenses

| Data | Description | Licence |
| ---- | ----------- | ------- |
| Core Basic Dataset |  | Open Government Licence |
| Map tiles |  | &copy; Mapbox and &copy; Open Street Map contributor data. |
| 
- The Libraries Taskforce basic dataset is released under the Open Government Licence.
- The maps are created using Mapbox tiles.  These are 
- Authority boundary lines are taken from Ordnance Survey Open data, in particular, Boundary-line open.  
- Population estimates are taken from the Office for National Statistics.
- English Indices of Deprivation are taken from the ONS.
- Public Libraries News data is taken from [PLN](http://www.publiclibrariesnews.com).
