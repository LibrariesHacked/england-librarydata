# England Libraries Data.  About.

Dashboard currently published at [https://england.librarydata.uk](https://england.librarydata.uk).

Public library data is rich, varied, interesting, and there is a great demand for it.  But though there's more public open data than ever, library data is rare and difficult to obtain.  There isn't much of an open data culture in public libraries - not from staff (with exceptions), library services, or in the leadership for libraries.

There are data practices going on in library services across the country that open data could help with.  Services go to the effort of submitting CIPFA benchmarking data but don't make it open, and can no longer afford to see the reports.  Services can pay more for stock management tools than it would cost to invest in staff data skills.  Many implement systems that submit their data to commercial third parties, who then use it (and claim to own it) for their own purposes.

The Society of Chief Librarians could take some responsibility for this, but an organisation made up of local government heads of service can be well-meaning, but not necessarily one that is going to initiate change or lead innovation.  Adopting open data, and maintaining and releasing it must lie with those who use that data day-to-day.

## Libraries Taskforce

The Libraries Taskforce were formed in 2015.  After some insistent emails late that year, I met with them in November to talk about library data.  As they had arrived from outside of the library world, the lack of data on libraries must have been a shock.  It was clear they didn't need anyone to tell them that library data was in a mess.

Though the meeting can't have been of use to them, it was good to discover they were systematically collecting data on the library services they visited around the country - contact details, types of libraries, counts, photos.

In December 2015 the taskforce held a data workshop inviting library leaders, data people, tech suppliers, and anyone else interested to spend a day discussing library data.  This went as such meetings do, lots of ideas, and discussion on the type of data that is and isn't useful, but few commitments.  I was only really there for one reason, to say it'd be nice if people just make existing data open, and not spend much time discussing what could and couldn't be collected.  Such meetings can be quite frustrating.  Open Data is often acknowledged as a good thing, but only to be indulged in once perfect datasets are formulated and collected in real time, with definitions that all library professionals agree upon. Undoubtedly a great aspiration, but one that will never happen.

The Taskforce did already have a decent start to a dataset that would address at least one problem.  The lack of information about how many libraries there are, how many there *were*, and the counts of different types of library ('community', local authority, etc.).

In August 2016 a letter was sent to all library authorities asking them to validate a spreadsheet of libraries.  Authorities were asked to include all libraries, closed or open, from April 2010.  This would be the basic core dataset.  The Taskforce also kindly provided me with a copy of this data, which allowed me to see the fields, and explore things that could potentially be done with such data.  From that point this project began, and has been in various stages of development since.

The taskforce provided me with the final dataset shortly before releasing this data on 30th March 2017.  This project was refreshed with that final dataset.

## This project

This project is experimental, using various open datasets such as authority boundaries, population stats, and deprivation indices.  These are merged with the core libraries dataset to provide ways of exploring the data.

It may not always be correct, and the methodology is likely to have plenty of issues, but it is open source.  In this case, this means the full code is [hosted on GitHub](https://github.com/LibrariesHacked/england-librarydata) under the MIT licence.  A [step-by-step description](https://github.com/LibrariesHacked/england-librarydata/blob/master/library-db.md) of how the underlying data was merged with other sources is provided as part of that code.

**Important: The basic library dataset has been modified in this project**.  Full details of all the modifications, with explanations, are included in the [database creation guide](https://github.com/LibrariesHacked/england-librarydata/blob/master/library-db.md).  This includes adding location data where it was not available, removing libraries that were included as 'non-libraries' (e.g. book drops), and correcting what looked to be discrepancies in the data.  For example, a library being marked as part of statutory provision but being an independent community library.

If you find any errors then shout about these, but also please suggest improvements and features.  For those with GitHub accounts you can raise bugs and feature requests, and get involved in the coding if you'd like to - there's a lot to do!

This basic core dataset is a start, at a national level, for English public libraries open data.  As well as maintaining and improving that dataset, it should lead to more open data.  Loans, expenditure, footfall, PC usage, catalogue data, and more.  These are datasets that could be used by the public to create real insight into library usage.  There should be no need to prove the value of libraries, but there's plenty to gain from a better understanding of the data, and using that to improve services.

## Comments on the Basic Dataset

The basic dataset is a first version.  Here are an initial set of commments on the current version.

| Field | Description |
| ----- | ----------- |
| Library service | The library authoritity e.g. Gloucestershire.  One issue is the variety of ways of expressing the name, which may not match official stats.  For example, 'Bath and NE Somerset', where 'Bath and North East Somerset' should probably be used. | 
| Library name | Standardisation of naming conventions would be useful here.  For example, some are appended with 'library', others not.  Some have very descriptive names such as 'Anlaby Library and Customer Service Centre at East Riding Leisure Haltemprice' - some of that information may be more appropriate in the address details. |
| Postal address | Generally looks OK.  Quite often not included, though mostly for closed libraries. |
| Postcode | Some of the postcodes for closed libraries are no longer valid (no longer exist).  This isn't really a problem with the return, as that's the accurate data, but in these cases I've replaced with the nearest current match.  This is so postcodes can be used to provide geo-coordinates.  In other cases postcodes are typed wrong and invalid.  Sometimes these are mistyped but are valid postcodes, which makes such mistakes difficult to track down. |
| Included in statutory service on 1 April 2010 | The statutory service indicator is used variably by authorities.  Cornwall claim that statutory library provision has risen from 31 statutory libraries in 2010 to 48 in 2016.  This is due to the fact that they have marked 17 community 'micro' libraries are statutory.  These libraries offer around 200 books where customers self serve on an honesty basis.  This project overrrides the statutory indication to 'No' if the library is an independent community library. |
| Included in statutory service on 1 July 2016 | Same issues as above |
| Type of library on 1 July 2016  | Main definitions were LAL (local authority), CL (commissioned), CRL (community run), ICL (independed).  The data also include LAL- (mainly book drops), CRL+ (trumped-up community run), and ICL+ (trumped-up independent).  Have removed LAL- entries as in many cases they were even explicitly marked as non-librariers.  Changed the CRL+/ICL+ to CRL/ICL, as these don't seem to provide a too meaningful addition. |
| Closed library | Indicator if the library is closed.  XL: closed library, XLR: Closed and replaced, XLT: Temporarily closed. |
| Year of closure | There's little room for ambiguity in a year of closure, but the library services manage a lot of variation.  'Dec-12', 'Sept 2012', '2012', and more.  The month could be useful, but without a defined structure it makes it more difficult to use this field.  Would suggest going either for just year, or a full date. |
| New building since 1 April 2010: insert year of opening | Same issues as above. |
| Did the new building replace an existing library: Yes/No | Instructions were 'If yes, please add the details of the former library in a new line at the end of the sheet if it isn't already shown.'  This isn't always done, the field itself also has descriptive entries rather than always Yes/No.  For example 'relocated to Arborfield Pop-up' |
| Notes | General notes field.  Looks OK as they can do what they like. |
| Number of hours open each week | A mess of different formats (19.5/49h45m/49:30:00) and descriptive answers (*'Will be the same as Cheltenham Road'*). |
| Number of staffed hours each week | Sometimes entries are long descriptive text.  Bournemouth have decided there are far more staffed hours for each library than there are overall hours.  For example Charminster library is open 39 hours a week, including 148.75 staffed hours.  Assume this is a representation of total staff time. |
| Contact email | Generally OK. |
| URL of library website | Generally OK.  There is a mixture of URLs with and without the relevant http/https prefix. |

And fields that could potentially be added:

| Field | Description |
| ----- | ----------- |
| Unique Property Reference Number (UPRN) | This would be the OS Unique Property Reference Number.  This identifier is a single reference that would allow cross-matching of the address to various other local authority datasets.  This reference would also allow for exact geo-coordinates of the location, taking these from Ordnance Survey data.  This is not open data but there is a 'presumption to publish' for various government datasets - generally granted if the information does not compromise OS commercial capabilities.  A 3000 dataset of libraries would not seriously damage OS commercial property, so a request could likely be made to allow this data to be released with an open licence. |
| Longitude/Easting | From the UPRN, the X co-ordinate of the library. |
| Latitude/Northing | From the UPRN, the Y co-ordinate of the library. |
| UPRN address | From the UPRN, the full postal address for the library. |
| UPRN postcode | From the UPRN, the postcode for the library. | 
