var LibrariesFuncs = {
    ///////////////////////////////////////////////////////////////////////
    // URLS
    ///////////////////////////////////////////////////////////////////////
    librariesNewsDataUrl: '/data/pln/pln_YY_M_TYPE.json',
    librariesNewsLocationsUrl: '/data/pln/plnlocations.json',
    authoritiesUrl: '/data/libraries/authorities.csv',
    authoritiesGeoUrl: '/data/libraries/authorities_geo.json',
    authoritiesTwitterUrl: '/data/twitter/authoritiestwitter.json',
    authoritiesDistancesUrl: '/data/libraries/authorities_distances.csv',
    librariesUrl: '/data/libraries/libraries.csv',
    librariesTwitterUrl: '/data/twitter/librariestwitter.json',
    librariesDistancesUrl: '/data/libraries/libraries_distances.csv',
    ///////////////////////////////////////////////////////////////////////
    // Data Storage
    ///////////////////////////////////////////////////////////////////////
    authorities: null,
    authoritiesGeo: null,
    authoritiesTwitter: null,
    authoritiesDistances: {},
    libraries: null,
    librariesTwitter: null,
    librariesDistances: {},
    locations: {},
    stories: { changes: {}, local: {} },
    ///////////////////////////////////////////////////////////////////////////
    // Function: loadData
    // Input: months(number of months stories to load), auth (whether to load authorities
    // data), authGeo (whether to load geo auth data), libraries (whether to load
    // libraries data), twitter (whether to load twitter data), callback (the callback 
    // function)
    // Output: None. Callback
    // This function loads the library data into data storage.  Should be run by the
    // relevant page maing use of this functionality.
    ////////////////////////////////////////////////////////////////////////////
    loadData: function (months, auth, authGeo, libraries, twitter, callback) {
        var urls = [], requests = [];
        if (months > 0) urls.push(['', '', 'locations', this.librariesNewsLocationsUrl]);
        if (auth) urls.push(['', '', 'authorities', this.authoritiesUrl]);
        if (auth) urls.push(['', '', 'authorities_distances', this.authoritiesDistancesUrl]);
        if (authGeo) urls.push(['', '', 'authorities_geo', this.authoritiesGeoUrl]);
        if (libraries) urls.push(['', '', 'libraries', this.librariesUrl]);
        if (libraries) urls.push(['', '', 'libraries_distances', this.librariesDistancesUrl]);
        if (twitter) urls.push(['', '', 'authorities_twitter', this.authoritiesTwitterUrl]);
        if (twitter) urls.push(['', '', 'libraries_twitter', this.librariesTwitterUrl]);
        for (x = 0; x <= months; x++) {
            var date = moment().subtract(x, 'months'), year = date.year(), month = date.month() + 1;
            for (type in this.stories) {
                if (!this.stories[type][year]) this.stories[type][year] = {};
                if (!this.stories[type][year][month]) this.stories[type][year][month] = {};
                urls.push([month, year, type, this.librariesNewsDataUrl.replace('YY', year).replace('M', month).replace('TYPE', type)]);
            }
        }
        var getUrlFailSafe = function (url) {
            var dfd = jQuery.Deferred();
            $.ajax(url).always(function (res) { dfd.resolve(res); });
            return dfd.promise();
        };
        for (i = 0; i < urls.length; i++) requests.push(getUrlFailSafe(urls[i][3]));
        $.when.apply($, requests).always(function () {
            $.each(arguments, function (i, data) {
                var month = urls[i][0], year = urls[i][1], type = urls[i][2];
                if ((type == 'changes' || type == 'local') && !data.status) this.stories[type][year][month] = data;
                if (type == 'locations') this.locations = data;
                if (type == 'libraries') this.libraries = Papa.parse(data, { header: true, skipEmptyLines: true }).data;
                if (type == 'libraries_distances') this.librariesDistances = Papa.parse(data, { header: true, skipEmptyLines: true }).data;
                if (type == 'libraries_twitter') this.librariesTwitter = data;
                if (type == 'authorities') this.authorities = Papa.parse(data, { header: true, skipEmptyLines: true }).data;
                if (type == 'authorities_geo') this.authoritiesGeo = data;
                if (type == 'authorities_distances') this.authoritiesDistances = Papa.parse(data, { header: true, skipEmptyLines: true }).data;
                if (type == 'authorities_twitter') this.authoritiesTwitter = data;
            }.bind(this));
            callback();
        }.bind(this));
    },
    ///////////////////////////////////////////////////////////////////////////
    // Function: getTweetsSortedByDate
    // Input: None
    // Output: Object[]
    // Merges tweets from authorities and libraries and returns an array of 
    // tweet objects sorted by date.
    ////////////////////////////////////////////////////////////////////////////
    getTweetsSortedByDate: function () {
        return $.map($.merge(this.authoritiesTwitter, this.librariesTwitter), function (t, i) {
            if (t[3]) return { name: t[0], account: t[1], type: t[2], description: t[3], website: t[4], following: t[6], favourites: t[8], followers: t[5], tweets: t[7], dateAccount: t[9], avatar: t[10], latest: t[11], latestDate: t[12] }
        }).sort(function (a, b) { return moment(b[12]) - moment(a[12]) });
    },
    ///////////////////////////////////////////////////////////////////////////
    // Function: getDistancesByLibrary
    // Input: Library (Id)
    // Output: Object of distances 
    // Takes the library Id and returns and object of distances with each distance
    // as key and the associated population e.g. { 0.7: 4000 }
    ////////////////////////////////////////////////////////////////////////////
    getDistancesByLibrary: function (library) {
        var distances = {};
        $.each(this.librariesDistances, function (i, d) {
            if (d.id == library || !library) {
                if (!distances[d.distance]) distances[d.distance] = 0;
                distances[d.distance] = distances[d.distance] + parseInt(d.population);
            }
        });
        return distances;
    },
    ///////////////////////////////////////////////////////////////////////////
    // Function: getDistancesByAuthority
    // Input: Authority (name)
    // Output: Object of distances.
    // For each authority returns an object of distances with each distance as
    // object key and the associated population e.g. { 1.5: 300)
    ////////////////////////////////////////////////////////////////////////////
    getDistancesByAuthority: function (authority) {
        var distances = {};
        var authId = 0;
        $.each(this.authorities, function (i, a) { if (a.name == authority) authId = a.authority_id });
        $.each(this.authoritiesDistances, function (i, d) {
            if (d.authority == authId || authId == 0) {
                if (!distances[d.distance]) distances[d.distance] = 0;
                distances[d.distance] = distances[d.distance] + parseInt(d.population);
            }
        });
        return distances;
    },
    ///////////////////////////////////////////////////////////////////////////
    // Function: getDeprivationIndicesByAuthority
    // Input: Authority (name e.g. Barnet)
    // Output: An object array of deprivation objects
    // Returns an object array for average deprivation of authorities
    ////////////////////////////////////////////////////////////////////////////
    getDeprivationIndicesByAuthority: function (authority) {
        var dep = {};
        $.each(this.getAuthoritiesWithLibraries(), function (i, a) {
            if (a.name == authority || !authority) {
                $.each(a.libraries, function (y, l) {
                    if (l.multiple) {
                        if (l.type.indexOf('X') == 0) {
                            if (!dep['X']) dep['X'] = { multiple: 0, count: 0 };
                            dep['X'].multiple += parseFloat(l.multiple);
                            dep['X'].count++;
                        } else {
                            if (!dep[l.type]) dep[l.type] = { multiple: 0, count: 0 };
                            dep[l.type].multiple += parseFloat(l.multiple);
                            dep[l.type].count++;
                        }
                    }
                });
            }
        });
        $.each(Object.keys(dep), function (i, k) {
            $.each(Object.keys(dep[k]), function (j, b) { if (b != 'count') dep[k][b] = Math.round(dep[k][b] / dep[k]['count']); });
        });
        return dep;
    },
    ///////////////////////////////////////////////////////////////////////////
    // Function: getDeprivationIndicesByAuthorityAndLibType
    // Input: Authority (name e.g. Barnet), Library type (e.g. LAL)
    // Output: An object 
    // 
    ////////////////////////////////////////////////////////////////////////////
    getDeprivationIndicesByAuthorityAndLibType: function (authority, libType) {
        var depIndices = { multiple: 0 };
        var count = 0;
        $.each(this.getAuthoritiesWithLibraries(), function (i, a) {
            if (a.name == authority || !authority) {
                $.each(a.libraries, function (y, l) {
                    if (l.type == libType) {
                        count++;
                        if (l.multiple) depIndices.multiple += parseFloat(l.multiple);
                    }
                });
            }
        });
        $.each(Object.keys(depIndices), function (i, k) { if (depIndices[k] != 0) depIndices[k] = (depIndices[k] / count).toFixed(0); });
        return depIndices;
    },
    ///////////////////////////////////////////////////////////////////
    // Function: getDeprivationIndicesAveragesByAuthority
    // Input: authority name
    // Output: Object of deprivation indices averages for the authority.
    ///////////////////////////////////////////////////////////////////
    getDeprivationIndicesAveragesByAuthority: function (authority) {
        var depIndices = { multiple: 0, employment: 0, education: 0, adultskills: 0, health: 0, services: 0 };
        var count = 0;
        $.each(this.authorities, function (i, a) {
            if (a.name && (a.name == authority || !authority)) {
                count++;
                depIndices.multiple += parseFloat(a.multiple);
                depIndices.employment += parseFloat(a.employment);
                depIndices.education += parseFloat(a.education);
                depIndices.adultskills += parseFloat(a.adultskills);
                depIndices.health += parseFloat(a.health);
                depIndices.services += parseFloat(a.services);
            }
        });
        $.each(Object.keys(depIndices), function (i, k) { depIndices[k] = (depIndices[k] / count).toFixed(0); });
        return depIndices;
    },
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Functions: DataTables
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////
    // Function: getAuthoritiesDataTable
    // Input: None
    // Output: Object to be used in DataTables data object.
    ///////////////////////////////////////////////////////////////////
    getAuthoritiesDataTable: function () {
        var datatable = [];
        $.each(this.getAuthoritiesWithLibraries(), function (i, x) {
            datatable.push([
                x.name,
                $.map(x.libraries, function (l, y) { if (l.type != 'XL' && l.type != 'XLR' && l.type != 'XLT') return l.name }).length,
                x.population,
                parseInt(x.sixteen_fiftynine) + parseInt(x.over_sixty),
                x.dependent_children,
                x.over_sixty,
                x.working_age,
                x.hectares,
                $.map(x.libraries, function (l, y) { if (l.type == 'LAL') return l.name }).length,
                $.map(x.libraries, function (l, y) { if (l.type == 'CL') return l.name }).length,
                $.map(x.libraries, function (l, y) { if (l.type == 'CRL') return l.name }).length,
                $.map(x.libraries, function (l, y) { if (l.type == 'ICL') return l.name }).length,
                $.map(x.libraries, function (l, y) { if (l.type == 'XL' || l.type == 'XLR' || l.type == 'XLT') return l.name }).length,
                $.map(x.libraries, function (l, y) { if (l.opened_year != '') return l.name }).length
            ]);
        });
        return datatable;
    },
    /////////////////////////////////////////////////////////////
    // Function: getLibrariesDataTable
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getLibrariesDataTable: function () {
        var datatable = [];
        var authorities = this.getLibrariesByAuthority();
        $.each(authorities, function (i, a) {
            $.each(a, function (y, l) {
                datatable.push([l.name, l.postcode, l.type, (l.statutory2010 == 't' ? 'Yes' : 'No'), (l.statutory2016 == 't' ? 'Yes' : 'No'), l.population, (parseInt(l.sixteen_fiftynine) + parseInt(l.over_sixty)), l.dependent_children, l.multiple, l.employment, l.education, l.adultskills, l.services, l.health, l.address, l.notes, l.email, l.url, l.closed_year]);
            });
        });
        return datatable;
    },
    /////////////////////////////////////////////////////////////
    // Function: getNewsDataTable
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getNewsDataTable: function (type) {
        var datatable = [];
        $.each(this.getStoriesGroupedByLocation(type), function (i, a) {
            $.each(a.stories, function (y, c) { datatable.push([i, c.date, c.text, c.url]); });
        });
        return datatable;
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthorityListSorted
    // Input: None
    // Output: Array or authority names, sorted alphabetically.
    /////////////////////////////////////////////////////////////
    getAuthorityListSorted: function () {
        return $.map(this.authorities, function (i, x) { return i.name }).sort();
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthorityById
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthorityById: function (id) {
        var auth = {};
        $.each(this.authorities, function (i, a) {
            if (a.authority_id == id) {
                auth = a;
                return true;
            }
        });
        return auth;
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthorityByIdWithLibrariesByType
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthorityByIdWithLibrariesByType: function (id) {
        var auth = {};
        $.each(this.authorities, function (i, a) {
            if (a.authority_id == id) {
                auth = a;
                auth.libraries = {};
                $.each(this.libraries, function (y, l) {
                    if (l.authority_id == id && !auth.libraries[l.type]) auth.libraries[l.type] = [];
                    if (l.authority_id == id) auth.libraries[l.type].push(l);
                });
                return true;
            }
        }.bind(this));
        return auth;
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthorityByName
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthorityByName: function (name) {
        var auth = {};
        $.each(this.authorities, function (i, a) {
            if (a.name == name) auth = a;
        });
        return auth;
    },
    /////////////////////////////////////////////////////////////
    // Function: getLibrariesListSorted
    // Input: Authority name
    // Output: An array of objects (libraries) with an id and name
    /////////////////////////////////////////////////////////////
    getLibrariesListSorted: function (authority) {
        var libraries = this.getLibrariesByAuthority();
        return $.map(this.authorities, function (i, x) {
            if (i.name == authority || !authority) return $.map(libraries[i.authority_id], function (y, z) { return { id: y.id, name: y.name } });
        }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    },
    /////////////////////////////////////////////////////////////
    // Function: getStatCountsByAuthority
    // Input: authority (name)
    // Output: Object of stats
    // 
    /////////////////////////////////////////////////////////////
    getStatCountsByAuthority: function (authority) {
        var counts = { statutory2010: 0, statutory2016: 0, libraries: 0, replaced: 0, replacements: 0, closedLibraries: 0, newLibs: 0, libsChange: 0, population: 0, area: 0, peoplePerLibrary: 0, areaPerLibrary: 0 };
        $.each(this.getAuthoritiesWithLibraries(), function (i, x) {
            if (i != '' && (i == authority || !authority)) {
                counts.area = counts.area + parseFloat(x.hectares);
                counts.population = counts.population + parseInt(x.population);
                $.each(x.libraries, function (y, lib) {
                    if (lib.statutory2010 == 't') counts.statutory2010++;
                    if (lib.statutory2016 == 't') counts.statutory2016++;
                    if (lib.replacement == 't') counts.replacements++;
                    if (lib.closed == '') counts.libraries++;
                    if (lib.closed == 'XLR') counts.replaced++;
                    if (lib.closed != '' && lib.closed != 'XLR') counts.closedLibraries++;
                    if (lib.opened_year != '' && lib.replacement == 'f') counts.newLibs++;
                });

                // For each library service there MUST be as many replaced libraries as there are replacements.
                // Authorities have a habit of listing libraries that are new, but not those that are closed.
                if (counts.replacements > counts.replaced) {
                    // Assume that the missing replaced libraries were also statutory
                    counts.statutory2010 = counts.statutory2010 + (counts.replacements - counts.replaced);
                    // Correct the count of replaced libraries
                    counts.replaced = counts.replacements;
                }
            }
        });
        counts.libsChange = (counts.newLibs + counts.replacements) - (counts.closedLibraries + counts.replaced);
        counts.statutoryChange = counts.statutory2016 - counts.statutory2010;
        counts.peoplePerLibrary = counts.population / counts.libraries;
        counts.areaPerLibrary = counts.area / counts.libraries;
        return counts;
    },
    /////////////////////////////////////////////////////////////
    // Function: getCountLibrariesByAuthorityType
    // Input: authority (name), type (library type)
    // Output: Count
    // Returns a count of the specified type of library.
    /////////////////////////////////////////////////////////////
    getCountLibrariesByAuthorityType: function (authority, type) {
        var count = 0;
        $.each(this.getAuthoritiesWithLibraries(), function (i, x) {
            if (i == authority || !authority) $.each(x.libraries, function (y, lib) { if (lib.type == type) count = count + 1; });
        });
        return count;
    },
    /////////////////////////////////////////////////////////////
    // Function: getCountLibraryTypesByAuthority
    // Input: authority (name)
    // Output: Counts
    // Returns count of the types of library.  For closed libraries
    // the counts are merged to one single type.
    /////////////////////////////////////////////////////////////
    getCountLibraryTypesByAuthority: function (authority) {
        var counts = {};
        $.each(this.getAuthoritiesWithLibraries(), function (i, x) {
            if (i == authority || !authority) {
                $.each(x.libraries, function (y, lib) {
                    if (!counts[lib.type]) counts[lib.type] = 0;
                    counts[lib.type]++;
                });
            }
        });
        if (counts.XL || counts.XLR || counts.XLT) counts['X'] = (counts.XL || 0) + (counts.XLR || 0) + (counts.XLT || 0);
        delete counts.XL;
        delete counts.XLT;
        delete counts.XLR;
        // We're going to merge together closed statuses
        return counts;
    },
    /////////////////////////////////////////////////////////////
    // Function: getLibraryById
    // Input: Library Id
    // Output: The library object
    // Gets the library object by Id from the libraries data array.
    /////////////////////////////////////////////////////////////
    getLibraryById: function (lib) {
        var library = {};
        $.each(this.libraries, function (i, a) {
            if (a.id == lib) {
                library = a;
                return false;
            }
        });
        return library;
    },
    /////////////////////////////////////////////////////////////
    // Function: getLibraryByName
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getLibraryByName: function (lib) {
        var library = {};
        $.each(this.libraries, function (i, a) {
            if (a.name == lib) library = a;
        });
        return library;
    },
    /////////////////////////////////////////////////////////////
    // Function: searchByPostcode
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    searchByPostcode: function (postcode, callback) {
        $.get('https://api.postcodes.io/postcodes/' + postcode, function (data) {
            var lat = data.result.latitude;
            var lng = data.result.longitude;
            callback({ lat: lat, lng: lng });
        });
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthoritiesListedById
    // Input: None
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthoritiesListedById: function () {
        var authorities = {};
        $.each(this.authorities, function (i, a) {
            authorities[a.authority_id] = a;
        });
        return authorities;
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthoritiesListedByName
    // Input: None
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthoritiesListedByName: function () {
        var authorities = {};
        $.each(this.authorities, function (i, a) {
            authorities[a.name] = a;
        });
        return authorities;
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthoritiesListedByNameWithBenchmarks
    // Input: None
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthoritiesListedByNameWithBenchmarks: function () {
        var authorities = {};
        var libraries = this.getLibrariesByAuthority();
        $.each(this.authorities, function (i, a) {

            var libs = libraries[a.authority_id];
            var libcount = $.map(libs, function (l, i) { if (l.closed == '') return 1 }).sum();
            var lalcount = $.map(libs, function (l, i) { if (l.type == 'LAL') return 1 }).sum();
            var clcount = $.map(libs, function (l, i) { if (l.type == 'CL') return 1 }).sum();
            var crlcount = $.map(libs, function (l, i) { if (l.type == 'CRL') return 1 }).sum();
            var iclcount = $.map(libs, function (l, i) { if (l.type == 'ICL') return 1 }).sum();
            var closedcount = $.map(libs, function (l, i) { if (l.type.indexOf('X') != -1) return 1 }).sum();

            authorities[a.name] = {
                peopleperlibrary: { display: 'People per library', value: (a.population / libcount).toFixed(0), sort: 'asc', x: 'Population per library' },
                libraries: { display: 'Number of libraries', value: libcount, sort: 'desc', x: 'Number of libraries' },
                lallibraries: { display: 'Number of local authority libraries', value: lalcount, sort: 'desc', x: 'Number of local authority libraries' },
                cllibraries: { display: 'Number of commissioned libraries', value: clcount, sort: 'desc', x: 'Number of commissioned libraries' },
                crllibraries: { display: 'Number of community run libraries', value: crlcount, sort: 'desc', x: 'Number of community libraries' },
                icllibraries: { display: 'Number of independent community libraries', value: iclcount, sort: 'desc', x: 'Number of independent libraries' },
                closedlibraries: { display: 'Number of closed libraries', value: closedcount, sort: 'desc', x: 'Number of libraries closed' },
                areaperlibrary: { display: 'Area (ha) per library', value: (a.hectares / libcount).toFixed(0), sort: 'asc', x: 'Area (ha) per library' },
                population: { display: 'Population', value: a.population, sort: 'desc', x: 'Population' },
                area: { display: 'Area (ha)', value: a.hectares, sort: 'desc', x: 'Area (ha)' }
            };
        });
        return authorities;
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthoritiesWithStories
    // Input: None
    // Output: Object. Authority as key and array of stories
    // for each authority
    /////////////////////////////////////////////////////////////
    getAuthoritiesWithStories: function () {
        var changes = this.getStoriesGroupedByLocation('changes');
        var local = this.getStoriesGroupedByLocation('local');
        var authStories = {};
        $.each(this.authorities, function (x, y) {
            if (changes[y.name] || local[y.name]) authStories[y.name] = { stories: (changes[y.name] ? changes[y.name].stories : []).concat((local[y.name] ? local[y.name].stories : [])) };
            if (authStories[y.name]) authStories[y.name].stories = authStories[y.name].stories.sort(function (a, b) { return moment(b.date) - moment(a.date) })
        }.bind(this));
        return authStories;
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthoritiesWithLibraries
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthoritiesWithLibraries: function () {
        var authorities = {};
        var authorityArray = this.authorities.slice().sort(function (a, b) { return a.name - b.name });
        var libraries = this.getLibrariesByAuthority();
        $.each(authorityArray, function (i, auth) {
            if (!authorities[auth['name']]) authorities[auth['name']] = { libraries: [] };
            $.extend(authorities[auth['name']], auth);
            authorities[auth['name']].libraries = libraries[auth['authority_id']];
        }.bind(this));
        return authorities;
    },
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Functions: Authority Geo Data
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    // Function: getAuthGeoWithStories
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthGeoWithStories: function () {
        var authGeoData = this.authoritiesGeo;
        var changes = this.getStoriesGroupedByLocation('changes');
        var local = this.getStoriesGroupedByLocation('local');
        var totalChanges = 0;
        var totalLocal = 0;
        $.each(authGeoData.features, function (x, y) {
            if (changes[y.properties.name]) authGeoData.features[x].properties['changes'] = changes[y.properties.name];
            if (local[y.properties.name]) authGeoData.features[x].properties['local'] = local[y.properties.name];
            totalLocal = totalLocal + (local[y.properties.name] ? local[y.properties.name].stories.length : 0);
            totalChanges = totalChanges + (changes[y.properties.name] ? changes[y.properties.name].stories.length : 0);
        }.bind(this));
        $.each(authGeoData.features, function (x, y) {
            authGeoData.features[x].properties['pcLocalNews'] = (authGeoData.features[x].properties['local'] ? (authGeoData.features[x].properties['local'].stories.length / totalLocal) * 30 : 0);
            authGeoData.features[x].properties['pcChanges'] = (authGeoData.features[x].properties['changes'] ? (authGeoData.features[x].properties['changes'].stories.length / totalChanges) * 50 : 0);
        }.bind(this));
        return authGeoData;
    },
    /////////////////////////////////////////////////////////////
    // Function: getAuthGeoWithStoriesAndLibraries
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAuthGeoWithStoriesAndLibraries: function () {
        var auth = {};
        var libs = this.getLibrariesByAuthority();
        var auths = this.getAuthoritiesListedById();
        var authGeoData = this.getAuthGeoWithStories();
        $.each(authGeoData.features, function (x, y) {
            var closedCount = 0;
            var nonClosedCount = 0;
            var localAuthorityCount = 0;
            var authData = auths[authGeoData.features[x].properties.authority_id];
            authGeoData.features[x].properties.libraries = {};
            $.each(libs[authGeoData.features[x].properties.authority_id], function (i, l) {
                if (!authGeoData.features[x].properties.libraries[l.type] && l.type != '') authGeoData.features[x].properties.libraries[l.type] = { libs: [] };
                if ((l.type != '' && l.closed == '') || l.lat != '') authGeoData.features[x].properties.libraries[l.type].libs.push(l);
                if (l.type != 'XL' && l.type != 'XLR' && l.type != 'XLT') nonClosedCount = nonClosedCount + 1;
                if (l.type == 'XL' || l.type == 'XLR' || l.type == 'XLT') closedCount = closedCount + 1;
                if (l.type == 'LAL') localAuthorityCount = localAuthorityCount + 1;
            });
            auth[authGeoData.features[x].properties.name] = { idx: x };
            authGeoData.features[x].properties['libraryCount'] = nonClosedCount;
            authGeoData.features[x].properties['closedLibraryCount'] = closedCount;
            authGeoData.features[x].properties['lalLibraryCount'] = localAuthorityCount;
            authGeoData.features[x].properties['libraryCountPerArea'] = nonClosedCount / authData.hectares;
            authGeoData.features[x].properties['libraryCountPerPopulation'] = nonClosedCount / authData.population;
        }.bind(this));
        var librariesSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.libraryCount - authGeoData.features[auth[b].idx].properties.libraryCount;
        });
        var librariesPerPopulationSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.libraryCountPerPopulation - authGeoData.features[auth[b].idx].properties.libraryCountPerPopulation;
        });
        var librariesPerAreaSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[b].idx].properties.libraryCountPerArea - authGeoData.features[auth[a].idx].properties.libraryCountPerArea;
        });
        var authLALSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.lalLibraryCount - authGeoData.features[auth[b].idx].properties.lalLibraryCount;
        });
        var closedLibrariesSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.closedLibraryCount - authGeoData.features[auth[b].idx].properties.closedLibraryCount;
        });
        $.each(authGeoData.features, function (x, y) {
            authGeoData.features[x].properties['pcLibraries'] = librariesSorted.indexOf(y.properties.name) / Object.keys(librariesSorted).length.toFixed(1);
            authGeoData.features[x].properties['pcLibrariesPerPopulation'] = librariesPerPopulationSorted.indexOf(y.properties.name) / Object.keys(librariesPerPopulationSorted).length.toFixed(1);
            authGeoData.features[x].properties['pcLibrariesPerArea'] = librariesPerAreaSorted.indexOf(y.properties.name) / Object.keys(librariesPerAreaSorted).length.toFixed(1);
            authGeoData.features[x].properties['pcClosedLibraries'] = (authGeoData.features[x].properties.closedLibraryCount == 0 ? 0 : closedLibrariesSorted.indexOf(y.properties.name) / Object.keys(closedLibrariesSorted).length.toFixed(1));
            authGeoData.features[x].properties['pcLalLibraries'] = authLALSorted.indexOf(y.properties.name) / Object.keys(authLALSorted).length.toFixed(1);

        }.bind(this));
        return authGeoData;
    },
    /////////////////////////////////////////////////////////////
    // Function: get3DAuthGeo
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    get3DAuthGeo: function () {
        var auth = {};
        var libs = this.getLibrariesByAuthority();
        var auths = this.getAuthoritiesListedById();
        var authGeoData = this.getAuthGeoWithStories();
        $.each(authGeoData.features, function (x, y) {
            var closedCount = 0;
            var nonClosedCount = 0;
            var localAuthorityCount = 0;
            var authData = auths[authGeoData.features[x].properties.authority_id];
            authGeoData.features[x].properties.libraries = {};
            $.each(libs[authGeoData.features[x].properties.authority_id], function (i, l) {
                if (!authGeoData.features[x].properties.libraries[l.type] && l.type != '') authGeoData.features[x].properties.libraries[l.type] = { libs: [] };
                if ((l.type != '' && l.closed == '') || l.lat != '') authGeoData.features[x].properties.libraries[l.type].libs.push(l);
                if (l.type != 'XL' && l.type != 'XLR' && l.type != 'XLT') nonClosedCount = nonClosedCount + 1;
                if (l.type == 'XL' || l.type == 'XLR' || l.type == 'XLT') closedCount = closedCount + 1;
                if (l.type == 'LAL') localAuthorityCount = localAuthorityCount + 1;
            });
            auth[authGeoData.features[x].properties.name] = { idx: x };
            authGeoData.features[x].properties['libraries'] = nonClosedCount;
            authGeoData.features[x].properties['closedlibraries'] = closedCount;
            authGeoData.features[x].properties['lallibraries'] = localAuthorityCount;
            authGeoData.features[x].properties['areaperlibrary'] = (authData.hectares / nonClosedCount).toFixed(0);
            authGeoData.features[x].properties['populationperlibrary'] = (authData.population / nonClosedCount).toFixed(0);
        }.bind(this));

        var librariesSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.libraries - authGeoData.features[auth[b].idx].properties.libraries;
        });
        var populationPerLibrarySorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.populationperlibrary - authGeoData.features[auth[b].idx].properties.populationperlibrary;
        });
        var areaPerLibrarySorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.areaperlibrary - authGeoData.features[auth[b].idx].properties.areaperlibrary;
        });
        var authLALSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.lallibraries - authGeoData.features[auth[b].idx].properties.lallibraries;
        });
        var closedLibrariesSorted = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[auth[a].idx].properties.closedlibraries - authGeoData.features[auth[b].idx].properties.closedlibraries;
        });

        var getColour = function (index, opacity) {
            var c = config.libStyles['ICL'];
            if (index > 25) c = config.libStyles['CL'];
            if (index > 50) c = config.libStyles['XL'];
            if (index > 75) c = config.libStyles['XLT'];
            if (index > 100) c = config.libStyles['CRL'];
            if (index > 125) c = config.libStyles['LAL'];
            return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
        };

        $.each(authGeoData.features, function (x, y) {
            authGeoData.features[x].properties['librariesheight'] = authGeoData.features[x].properties['libraries'] * 300;
            authGeoData.features[x].properties['librariescolour'] = getColour(librariesSorted.indexOf(y.properties.name), '0.1');

            authGeoData.features[x].properties['populationperlibraryheight'] = authGeoData.features[x].properties['populationperlibrary'] / 2;
            authGeoData.features[x].properties['populationperlibrarycolour'] = getColour(populationPerLibrarySorted.indexOf(y.properties.name));

            authGeoData.features[x].properties['areaperlibraryheight'] = authGeoData.features[x].properties['areaperlibrary'] / 1.5;
            authGeoData.features[x].properties['areaperlibrarycolour'] = getColour(areaPerLibrarySorted.indexOf(y.properties.name));
        }.bind(this));
        return authGeoData;
    },
    /////////////////////////////////////////////////////////////
    // Function: getLibrariesByAuthority
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getLibrariesByAuthority: function () {
        var authLibraries = {};
        $.each(this.libraries, function (i, lib) {
            if (!authLibraries[lib['authority_id']]) authLibraries[lib['authority_id']] = [];
            if (lib.type == '') lib.type = lib.closed;
            if (lib.type != '') authLibraries[lib['authority_id']].push(lib);
        }.bind(this));
        return authLibraries;
    },
    /////////////////////////////////////////////////////////////
    // Function: getLibraryLocations
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getLibraryLocations: function () {
        var libArray = [];
        $.each(this.libraries, function (i, lib) {
            if (lib.type != '' && lib.type != 'XL' && lib.type != 'XLR' && lib.lat && lib.lng && lib.lat != '' && lib.lng != '') {
                libArray.push({ lat: lib.lat, lng: lib.lng, name: lib.name, address: lib.address, type: lib.type });
            }
        }.bind(this));
        return libArray;
    },
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Functions: Address Lookup
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    // Function: getAddressCoordinates
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAddressCoordinates: function (address, callback) {
        var url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + address + '.json?access_token=' + config.mapBoxToken;
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function (json) {
                var results = $.map(json.features, function (data, i) { return { value: data.place_name, data: data.geometry.coordinates } });
                callback(results);
            }
        });
    },
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Functions: Routing
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    // Function: getRouteToLibrary
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getRouteToLibrary: function (fromLat, fromLng, toLat, toLng, routePref, callback) {
        var url = 'https://api.mapbox.com/directions/v5/mapbox/' + routePref.toLowerCase() + '/' + fromLng + ',' + fromLat + ';' + toLng + ',' + toLat + '?overview=full&steps=true&access_token=' + config.mapBoxToken;
        var lineCoords = [];
        $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function (json) {
                callback({ steps: json.routes[0].legs[0].steps, distance: json.routes[0].distance, time: json.routes[0].duration, line: polyline.decode(json.routes[0].geometry) });
            }
        });
    },
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Functions: Twitter Data
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    // Function: getLatestAuthorityTweet
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getLatestAuthorityTweet: function (auth) {
        var tweet = null;
        $.each(this.authoritiesTwitter, function (i, t) {
            if (t[4] && t[0].toLowerCase().replace('county council', '').trim() == auth.toLowerCase().replace('county council', '').trim()) tweet = { name: t[0], account: t[1], type: t[2], description: t[3], website: t[4], following: t[6], favourites: t[8], followers: t[5], tweets: t[7], dateAccount: t[9], avatar: t[10], latest: t[11], latestDate: t[12] };
        }.bind(this));
        return tweet;
    },
    /////////////////////////////////////////////////////////////
    // Function: getLatestLibraryTweet
    // Input: Library (library name)
    // Output: A tweet object with all the tweet information on it.
    // 
    /////////////////////////////////////////////////////////////
    getLatestLibraryTweet: function (lib) {
        var tweet = null;
        $.each(this.librariesTwitter, function (i, t) {
            if (lib && t[0].toLowerCase() == lib.toLowerCase()) tweet = t;
        }.bind(this));
        return tweet;
    },
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Functions: Public Libraries News
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    // Function: getAllStoriesGroupedByLocation
    // Input: 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    getAllStoriesGroupedByLocation: function () {
        return $.extend(this.getStoriesGroupedByLocation('changes'), this.getStoriesGroupedByLocation('local'));
    },
    /////////////////////////////////////////////////////////////
    // Function: getStoriesGroupedByLocation
    // Input: Story type (local or changes)
    // Output: Object with location as key.
    // 
    /////////////////////////////////////////////////////////////
    getStoriesGroupedByLocation: function (type) {
        var locs = {};
        $.each(this.stories[type], function (i, y) {
            $.each(y, function (x, m) {
                $.each(m, function (z, s) {
                    if (!locs[s[0]]) locs[s[0]] = { lat: this.locations[s[0]] ? this.locations[s[0]][0] : 0, lng: this.locations[s[0]] ? this.locations[s[0]][1] : 0, stories: [] };
                    locs[s[0]].stories.push({ date: s[1], text: s[2], url: s[3], type: type });
                }.bind(this));
            }.bind(this));
        }.bind(this));
        return locs;
    },
    /////////////////////////////////////////////////////////////
    // Function: storyCount
    // Input: Type (the 
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    storyCount: function (type) {
        var count = 0;
        $.each(this.stories[type], function (i, y) {
            $.each(y, function (x, m) {
                count = count + m.length;
            }.bind(this));
        }.bind(this));
        return count;
    },
    /////////////////////////////////////////////////////////////
    // Function: locationsSortedByCount
    // Input: None
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    locationsSortedByCount: function () {
        var locsObj = {};
        var locs = [];
        $.each(this.stories, function (type, a) {
            $.each(this.stories[type], function (i, y) {
                $.each(y, function (x, m) {
                    $.each(m, function (z, s) {
                        if (!locsObj[s[0]]) locsObj[s[0]] = { count: 0 };
                        locsObj[s[0]].count = locsObj[s[0]].count + 1;
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
        $.each(Object.keys(locsObj), function (i, y) { locs.push(y); });
        return locs.sort(function (a, b) { return locsObj[b].count - locsObj[a].count; })
    },
    /////////////////////////////////////////////////////////////
    // Function: storyCountByMonth
    // Input: None
    // Output: 
    // 
    /////////////////////////////////////////////////////////////
    storyCountByMonth: function () {
        var data = [], months = {};
        $.each(this.stories, function (i, t) {
            $.each(t, function (x, y) {
                $.each(y, function (z, m) {
                    if (!months[x + '-' + z]) months[x + '-' + z] = {};
                    months[x + '-' + z][i] = m.length;
                });
            });
        });
        $.each(months, function (x, d) {
            var obj = { month: x };
            $.each(d, function (k, v) { obj[k] = v; });
            data.push(obj)
        });
        return data;
    },
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Functions: Library catchments
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    // Function: getLibraryCatchment
    // Input: library id
    // Output: Callback(catchment geojson)
    // Runs asynchronousley, returns library catchments
    /////////////////////////////////////////////////////////////
    getLibraryCatchment: function (id, callback) {
        $.get('/data/libraries/catchments/library_id_' + id + '.geojson', function (lib_catchment) { callback(lib_catchment); });
    },
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Functions: Supporting helpers
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////
    // Function: getNumFormat
    // Input: Number
    // Output: String (formatted number).
    // Formats a number into a concide readable format (e.g. 1.1K)
    /////////////////////////////////////////////////////////////
    getNumFormat: function (num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num ? parseInt(num).toFixed(0) : null;
    },
    // Function: hexToRgb
    // Input: 
    // Output:
    // 
    /////////////////////////////////////////////////////////////
    hexToRgb: function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    },
    getRandomColour: function () {
        var letters = '0123456789ABCDEF';
        var colour = '#';
        for (var i = 0; i < 6; i++) {
            colour += letters[Math.floor(Math.random() * 16)];
        }
        return colour;
    }
};