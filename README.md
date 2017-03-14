# England.  LibraryData.

Project to display English libraries data in a data dashboard.

## What is it?

The Libraries Taskforce have been working on an English libraries dataset to bring together a list of all libraries and library authorities in England.  This includes tracking closures, changes of library type, number of libraries, locations of libraries, and contact details.

[Public Libraries News](http://www.publiclibrariesnews.com) is the UK leading source for libraries news.  This includes regular updates about changes, local news by authority, ideas, national news, and international news.

This project aims at bringing these things together, along with latest tweets and lots of other data, into a larger set of visualisations.

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

With no library service selected all libraries are listed to select.  If a particular service is selected then only the libraries for that service are shown.

On selecting a library, details displayed are:

- email and website (as buttons)
- library type
- closed/replaced/new details (if applicable)
- notes on the library
- deprivation deciles for the area the library is located in.

#### 3. Library distance stats



#### 4. Find nearest library


#### 5. Library types


#### 6. News and changes


#### 7. Libraries on Twitter


#### 8. Deprivation stats

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