var PublicLibrariesNews = {
    locationsUrl: '/data/PLNLocations.json?v=2',
    dataUrl: '/data/PLN_YY_M_TYPE.json?v=2',
    authGeoUrl: '/data/AuthoritiesGeo.json?v=2',
    authUrl: '/data/Authorities.csv>v=2',
    librariesUrl: '/data/Libraries.csv?v=2',
    authoritiesGeo: null,
    authorities: null,
    libraries: null,
    locations: {},
    stories: {
        changes: {},
        local: {}
    },
    loadData: function (months, authGeo, auth, libraries, callback) {
        // Need to work out which files to load.
        // Filenames are in the form PLN_2015_11_changes
        var urls = [];
        if (authGeo) urls.push(['', '', 'authgeo', this.authGeoUrl]);
        if (auth) urls.push(['', '', 'authorities', this.authUrl]);
        if (libraries) urls.push(['', '', 'libraries', this.librariesUrl]);

        for (x = 0; x <= months ; x++) {
            var date = moment().subtract(x, 'months');
            var year = date.year();
            var month = date.month() + 1;
            for (type in this.stories) {
                if (!this.stories[type][year]) this.stories[type][year] = {};
                if (!this.stories[type][year][month]) {
                    this.stories[type][year][month] = {};
                    urls.push([month, year, type, this.dataUrl.replace('YY', year).replace('M', month).replace('TYPE', type)]);
                }
            }
        }
        if (Object.keys(this.locations).length == 0) urls.push(['', '', 'locations', this.locationsUrl]);
        var requests = [];
        for (i = 0; i < urls.length; i++) {
            requests.push($.ajax(urls[i][3]));
        }
        $.when.apply($, requests).done(function () {
            $.each(arguments, function (i, data) {
                var month = urls[i][0];
                var year = urls[i][1];
                var type = urls[i][2];
                if (type == 'changes' || type == 'local') this.stories[type][year][month] = data[0];
                if (type == 'locations') this.locations = data[0];
                if (type == 'libraries') this.libraries = Papa.parse(data[0], { header: true });
                if (type == 'authgeo') this.authoritiesGeo = data[0];
                if (type == 'authorities') this.authorities = Papa.parse(data[0], { header: true });
            }.bind(this));
            callback();
        }.bind(this));
    },
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
    getAuthGeoWithStoriesAndLibraries: function () {
        var authGeoData = this.getAuthGeoDataWithStories();
        var libs = this.getLibrariesByAuthority();
        var auth = {};
        $.each(authGeoData.features, function (x, y) {
            authGeoData.features[x].libraries = {};
            $.each(libraries[authGeoData.features[x].properties.authority_id], function () {
                if (!authGeoData.features[x].libraries[libs.type]) authGeoData.features[x].libraries[lib.type] = { libs: [] };
                if ((lib.type != '' && lib.closed == '') || lib.lat != '') libs[lib.type].libs.push(lib);
            });
            auth[authGeoData.features[x].properties.name] = { idx: x };
        }.bind(this));
        var authLALSortedLibraryCount = Object.keys(auth).sort(function (a, b) {
            return authGeoData.features[a].properties.libraries['LAL'] - authGeoData.features[b].properties.libraries['LAL'];
        });
        return authGeoData;
    },
    getLibrariesByAuthority: function () {
        var authLibraries = {};
        $.each(this.libraries.data, function (i, lib) {
            if (!authLibraries[lib['authority_id']]) authLibraries[lib['authority_id']] = [];
            if (lib.type == '') lib.type = 'XL';
            authLibraries[lib['authority_id']].push(lib);
        }.bind(this));
        return authLibraries;
    },
    getStoriesGroupedByLocation: function (type) {
        var locs = {};
        $.each(this.stories[type], function (i, y) {
            $.each(y, function (x, m) {
                $.each(m, function (z, s) {
                    if (!locs[s[0]]) locs[s[0]] = { lat: this.locations[s[0]][0], lng: this.locations[s[0]][1], stories: [] };
                    locs[s[0]].stories.push({ date: s[1], text: s[2], url: s[3] });
                }.bind(this));
            }.bind(this));
        }.bind(this));
        return locs;
    },
    storyCount: function (type) {
        var count = 0;
        $.each(this.stories[type], function (i, y) {
            $.each(y, function (x, m) {
                count = count + m.length;
            }.bind(this));
        }.bind(this));
        return count;
    },
    locationsSortedByCount: function (type) {
        var locsObj = {};
        var locs = [];
        $.each(this.stories[type], function (i, y) {
            $.each(y, function (x, m) {
                $.each(m, function (z, s) {
                    if (!locsObj[s[0]]) locsObj[s[0]] = { count: 0 };
                    locsObj[s[0]].count = locsObj[s[0]].count + 1;
                }.bind(this));
            }.bind(this));
        }.bind(this));
        $.each(Object.keys(locsObj), function (i, y) {
            locs.push(y);
        });
        locs.sort(function (a, b) {
            return locsObj[b].count - locsObj[a].count;
        })
        return locs;
    },
    storyCountByMonth: function () {
        var data = [];
        var months = {};
        $.each(this.stories, function (i, t) {
            // types
            $.each(t, function (x, y) {
                // years
                $.each(y, function (z, m) {
                    if (!months[x + '-' + z]) months[x + '-' + z] = {};
                    months[x + '-' + z][i] = m.length;
                });
            });
        });
        $.each(months, function (x, d) {
            var obj = { month: x };
            $.each(d, function (k, v) {
                obj[k] = v;
            });
            data.push(obj)
        });
        return data;
    }
};