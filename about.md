# public library open data

Public library data is rich, varied, interesting, and there is a great demand for it.  But thoough there is more public open data than ever, data on libraries is rare and difficult to obtain.  Other than protecting the public's personal information, all data related to libraries should be openly licensed, and freely available for anyone to use.  

But there is not an open data culture in public libraries - not from librarians (with some exceptions), library services, or in the Society of Chief Librarians.  The sector needs to adopt a culture of open by default, and the primary responsibility for this must lie with individual professionals.  The SCL could adopt a shared open data policy, and communicate this, but the task of maintaining and releasing open data lies with those who use that data day-to-day.

## libraries taskforce

The Libraries Taskforce were formed in 2015.  After some insistent emails late in 2015 to the Taskforce about open data, I had a quick meeting in November to talk about aggravations with public library data.  As they had partially come in from outside of the library world, the lack of any good data on libraries had probably come as a shock to them.  It was clear they didn't need anyone to tell them that library data was in a mess.  

One thing it was good to see they were doing was systematically collecting data on the library services they visited around the country - contact details, types of libraries, counts, photos.

In December 2015 the taskforce held a data workshop inviting library leaders, data people, tech suppliers, and anyone else interested (e.g. myself) to spend a day discussing library data.  This went as such meetings tend to when you get a mass of people in one room, though co-ordination and separating into groups was good.  Lots of ideas, and lots of discussion on the type of data that is and isn't useful.  I was only really there for one reason, to say just make existing data open, and not to bother discussing too much what could and couldn't be specifically collected.  It can be frustrating being in such meetings.  For public library open data it often feels like an all or nothing approach has adopted.  Open Data is acknowledged as a good thing, but only after perfect datasets are formulated and collected in real time, with definitions that everyone agrees upon, that also must include social outcome data. Undoubtedly a great aspiration but it will never happen.  The tendency to overthink things and wish to either do something in one go, or not do it at all, means small changes in culture are much harder to achieve.

But the Taskforce did have a decent start to a dataset that would address at least one problem.  The lack of information just about how many libraries there are, how many there were, and the counts of different types of library ('community', local authority, etc.).

In August 2016 a letter was sent to all library authorities asking them to validate an un-validated spreadsheet, which was a list from the taskforce of libraries.  Authorities were asked to include all libraries, closed or open, from April 2010.

The taskforce also provided me with a copy of this unvalidated data, which allowed me to see the fields and explore would could potentially be done with such data.  From which this project began.

## this project

This project is experimental, using various open datasets such as authority boundaries, population stats, and deprivation indices.  These are merged with the core libraries dataset to provide ways of exploring the data.

It may not always be correct, and the methodology is likely to have plenty of issues, but it is open source.  In this case, this means the full code is [hosted on GitHub](https://github.com/LibrariesHacked/england-librarydata) under the MIT licence.  A [step-by-step description](https://github.com/LibrariesHacked/england-librarydata/blob/master/library-db.md) of how the underlying data was merged with other sources is provided as part of that code.

** Important: The core library dataset has been modified in this project.  Full details of all the modifications, with explanations, are included in the [database creation guide](https://github.com/LibrariesHacked/england-librarydata/blob/master/library-db.md).  This includes adding location data where it was not available, removing some libraries that were included as 'non-libraries' (e.g. book drops), and correcting what looked to be discrepancies in the data.  For example, a library being marked as part of statutory provision but being an independent community library.

If you find any errors then shout about these, but also please suggest improvements and features.  For those with GitHub accounts you can raise bugs and feature requests and get involved in the coding if you'd like to - there's a lot to do!

The core dataset is a start, at a national level, for English public libraries open data.  As well as maintaining and improving that dataset, which must ultimately be taken on by library services, it should lead to more open data.  Loans, expenditure, footfall, PC usage, catalogue data, and more.  These are datasets that could be used by the public to create real insight into library usage.  There should be no need to prove the value of libraries, but there's plenty to gain from a better understanding of the data, and using that to improve services.

## comments on the basic core dataset

The basic dataset is clearly not a finished product, it is a first version with a long way to go.  But it requires investment in time by the library services, and those who wish to use the data.  Here are an initial set of commments on the current version.

### current fields

| Field | Description |
| ----- | ----------- |
| Library service | The library authoritity e.g. Gloucestershire.  Some issues with this field are the variety of ways of expressing the name, which may not match official stats.  For example, 'Bath and NE Somerset', where 'Bath and North East Somerset' should probably be used. | 
| Library name | Standardisation of naming conventions would be useful here.  For example, some are appended with 'library', others not.  Some have very descriptive names such as 'Anlaby Library and Customer Service Centre at East Riding Leisure Haltemprice' - some of that information may be more appropriate in the address details. |
| Postal address |  |
| Postcode |  |
| Included in statutory service on 1 April 2010 | The statutory service indicator is used variably by authorities.  The majority use this as in the initial instructions, which were: ''.  However Cornwall claim that statutory library provision has risen from 31 statutory libraries in 2010 to 48 in 2016.  This is due to the fact that they have marked 17 community 'micro' libraries are statutory.  These libraries offer around 200 books where customers self serve on an honesty basis.  Due to the dubious nature of this being part of statutory provision, this project overrrides the statutory indication to 'No' if the library is an independent community library. |
| Included in statutory service on 1 July 2016 | Same issues as above |
| Type of library on 1 July 2016  | Main definitions were LAL (local authority), CL (commissioned), CRL (community run), ICL (independed).  The data also include  LAL- (book drops), CRL+ (trumped up community run), and ICL+ (trumped up independent).  Have removed LAL- entries and then the CRL+/ICL+ turned to normal CRL/ICL. |
| Closed library | Indicator if the library is closed.  XL: closed library, XLR: Closed and replaced, XLT: Temporarily closed. |
| Year of closure | There's little room for ambiguity in a year of closure, but the library services manage a lot of variation.  'Dec-12', 'Sept 2012', '2012', and more.  The month could be useful, but without a defined structure it makes it more difficult to use this field.  Would suggest going either for just year, or a full date. |
| New building since 1 April 2010: insert year of opening |  |
| Did the new building replace an existing library: Yes/No | Instructions were 'If yes, please add the details of the former library in a new line at the end of the sheet if it isn't already shown.'  |
| Notes | General notes field.  Looks OK as they can do what they like. |
| Number of hours open each week |  |
| Number of staffed hours each week | Mised entries here for what should just be a number of hours.  Bournemouth have gone quite leftfield here and decided that there are far more staffed hours for each library than there are overall hours.  For example Charminster library is open 39 hours a week, including 148.75 staffed hours. |
| Contact email | Generally OK. |
| URL of library website | Generally OK.  Mixture of URLs with or without the http/https prefix. |

### suggested fields

| Unique Property Reference Number (UPRN) | This suggested field would be the OS Unique Property Reference Number.  This identifier is a single reference that would allow cross-matching of the address to various other local authority datasets.  This reference would also allow for exact geo-coordinates of the location, taking these from Ordnance Survey data.  This is not open data but there is a 'presumption to publish' for various government datasets - generally granted ifthe information does not compromise OS commercial capabilities.  A 3000 dataset of libraries would not seriously damage OS commercial property, so a request could likely be made to allow this data to be released with an open licence. |
| Longitude/Easting | From the UPRN, include the X co-ordinate of the library. |
| Latitude/Northing | From the UPRN, include the Y co-ordinate of the library. |
| UPRN address | From the UPRN, include the full postal address for the library. |
| UPRN postcode | From the UPRN, include the postcode for the library. | 

# licences and open data<

- The Libraries Taskforce basic dataset is released under the Open Government Licence.
- The maps are created using Mapbox tiles.  These are &copy; Mapbox and contain Open Street Map contributor data.
- Authority boundary lines are taken from Ordnance Survey Open data, in particular, Boundary-line open.  
- Population estimates are taken from the Office for National Statistics.
- English Indices of Deprivation are taken from the ONS.
- Public Libraries News data is taken from [PLN](http://www.publiclibrariesnews.com), provided 

## Other library open data

For a great introduction to libraries open data please do look at [Newcastle Libraries open data](https://www.newcastle.gov.uk/your-council-and-democracy/open-data-and-access-information/open-data/data-sets/libraries-data-sets) and hack events

- [Twitter @librarieshacked](https://twitter.com/librarieshacked)
- [Email info @ librarieshacked](mailto:info@librarieshacked.org)
- [Web { libraries: hacked }](https://www.librarieshacked.org)