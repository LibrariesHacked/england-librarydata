$(function () {

    /////////////////////////////////////////////////////////
    // Helper Function: numFormat
    /////////////////////////////////////////////////////////
    var numFormat = function (num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toFixed(0);
    };
    var getMiles = function (i) {
        return i * 0.000621371192;
    };

    /////////////////////////////////////////////////
    // Variables
    // Declared variables that get set later on
    /////////////////////////////////////////////////
    var fmlMap = null, typeDonut = null, fmlLibraryMarker = null, fmlHomeMarker = null, fmlRoute = null;


    //////////////////////////////////////////////
    // LOAD.  Load the data.
    // 2 months worth.  No geo, Yes twitter, Yes 
    //////////////////////////////////////////////
    PublicLibrariesNews.loadData(2, false, true, true, true, function () {

        ///////////////////////////////////////////////////////////////////
        // 1. Find My Library
        // Provides a means to enter postcode to find the closest library.
        // Displays this on a map, and displays configurable route.
        ///////////////////////////////////////////////////////////////////

        // FUNCTION: setRouteData
        var setRouteData = function (type) {
            //$('#fmlRouteContent #' + type + ' div').text('');
            PublicLibrariesNews.getRouteToLibrary(fmlHomeMarker._latlng.lat, fmlHomeMarker._latlng.lng, fmlLibraryMarker._latlng.lat, fmlLibraryMarker._latlng.lng, type, function (route) {
                if (fmlRoute != null) fmlMap.removeLayer(fmlRoute);
                fmlRoute = L.polyline($.map(route.line, function (ll, i) { return L.latLng([ll[0], ll[1]]); }), { color: config.libStyles['LAL'].colour, dashArray: [5, 5], weight: 2 });
                fmlMap.addLayer(fmlRoute);
                $('#fmlRouteContent #' + type + ' #div' + type + 'Distance p').text(getMiles(route.distance).toFixed(1) + ' miles');
                $('#fmlRouteContent #' + type + ' #div' + type + 'Time p').text(moment.duration(route.time * 1000).humanize() + ' ');
            });
        };
        // EVENT: Route type change
        $('#divFmlContent a[data-toggle="tab"]').on('shown.bs.tab', function (e) { setRouteData($(e.target).attr("href").replace('#', '')) });
        // EVENT: Address autocomplete
        $('#txtAddress').autocomplete({
            lookup: function (query, done) {
                PublicLibrariesNews.getAddressCoordinates(query, function (data) { done({ suggestions: data }) });
            },
            onSelect: function (suggestion) {
                $('#spFmlHome').hide();
                $('#spFmlSpinning').show();

                // If there are existing markers and route lines, remove them
                if (fmlLibraryMarker != null) fmlMap.removeLayer(fmlLibraryMarker);
                if (fmlHomeMarker != null) fmlMap.removeLayer(fmlHomeMarker);
                if (fmlRoute != null) fmlMap.removeLayer(fmlRoute);

                // create marker array
                var librariesArray = $.map(PublicLibrariesNews.getLibraryLocations(), function (l, i) {
                    var marker = L.marker([l.lat, l.lng], { icon: L.AwesomeMarkers.icon({ icon: 'book', markerColor: 'green' }) });
                    marker.name = l.name;
                    marker.address = l.address;
                    return marker;
                });
                // If the map hasn't been created, create it.
                if (fmlMap == null) {
                    $('#divFmlMap').show();
                    $('#divFmlContent').show();
                    fmlMap = L.map('divFmlMap', { zoomControl: false }).setView([52.6, -2.5], 7);
                    L.tileLayer(config.mapTilesStreets).addTo(fmlMap);
                }

                // Construct closest and home markers
                fmlLibraryMarker = L.GeometryUtil.closestLayer(fmlMap, librariesArray, L.latLng(suggestion.data[1], suggestion.data[0]), false).layer;
                fmlHomeMarker = L.marker([suggestion.data[1], suggestion.data[0]], { icon: L.AwesomeMarkers.icon({ icon: 'home', markerColor: 'red' }) });

                $('#fmlLibrary').text(fmlLibraryMarker.name);
                $('#fmlLibraryAddress').text(fmlLibraryMarker.address);

                // Zoom to user location - this will take a little time so delay other actions.
                fmlMap.flyToBounds([[fmlHomeMarker._latlng.lat, fmlHomeMarker._latlng.lng], [fmlLibraryMarker._latlng.lat, fmlLibraryMarker._latlng.lng]]);

                // Add the home and the library marker and the route
                fmlMap.addLayer(fmlHomeMarker);
                fmlMap.addLayer(fmlLibraryMarker);
                $('#spFmlHome').show();
                $('#spFmlSpinning').hide();

                setRouteData('Walking');
            }
        });

        //////////////////////////////////////////////
        // 2. Widget: Library types by authority
        //////////////////////////////////////////////
        var typeDonut = new Chart($('#divLibrariesDonutChart'), {
            data: {
                datasets: [{
                    data: [11, 16, 7, 3, 14],
                    backgroundColor: $.map(Object.keys(config.libStyles), function (x, y) {
                        return config.libStyles[x].colour;
                    }),
                    label: 'My dataset' // for legend
                }],
                labels: $.map(Object.keys(config.libStyles), function (x, y) {
                    return config.libStyles[x].type;
                })
            },
            type: "polarArea",
            options: {
                elements: {
                    arc: {
                        borderColor: "#000000"
                    }
                }
            }
        });
        var updateLibTypesDonut = function (libAuthority) {
            typeDonut.config.data.datasets[0].data = [];
            $.each(Object.keys(config.libStyles), function (t, c) {
                typeDonut.config.data.datasets[0].data.push(PublicLibrariesNews.getCountLibrariesByAuthorityType(libAuthority, c));
            });
            var stats = PublicLibrariesNews.getStatCountsByAuthority(libAuthority);
            $('#divAuthStats1 #divNumLibs p').text(numFormat(stats.libraries));
            $('#divAuthStats1 #divArea p').text(numFormat(stats.area));
            $('#divAuthStats1 #divPopulation p').text(numFormat(stats.population));
            $('#divAuthStats2 #divClosedLibs p').text(numFormat(stats.closedLibraries));
            $('#divAuthStats2 #divLibsPerPopulation p').text(numFormat(stats.peoplePerLibrary));
            $('#divAuthStats2 #divLibsPerArea p').text(numFormat(stats.areaPerLibrary));
            typeDonut.update();
        };
        // Initially set the library types donut chart.
        updateLibTypesDonut();

        //////////////////////////////////////////////
        // 3. Widget: Library details by authority
        //////////////////////////////////////////////

        // Populate the select library control
        var updateLibraryDetailsSelect = function (authority) {
            $('#selLibraryDetailsLibrary').attr('disabled', true);
            $('#selLibraryDetailsLibrary').empty();
            if (!authority || authority == '') return;
            $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", '').text('Select a library'));
            $.each(PublicLibrariesNews.getLibrariesListSorted(authority), function (y, z) { $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", z).text(z)) });
            $('#selLibraryDetailsLibrary').attr('disabled', false);
        };
        // Initially set the library select for all libraries.
        updateLibraryDetailsSelect();

        // Event: On selecting a library, display that library's details.
        $('#selLibraryDetailsLibrary').change(function () {
            var libAuth = [$('#selLibraryDetailsLibrary').find(":selected").val(), $('#selAuthority').find(":selected").val()];
            if (libAuth[0] == '') return;
            var library = PublicLibrariesNews.getLibraryByAuthorityNameAndLibName(libAuth[1], libAuth[0]);
            $('#divLibraryDetails').empty();
            $('#divLibraryDetails').append('<h4>' + library.name + '</h4>');
            $('#divLibraryDetails').append('<small>' + (library.type ? config.libStyles[library.type].type : '') + '</small>');
            $('#divLibraryDetails').append('<p>' + (library.address ? '' : '') + '</p>');
            $('#divLibraryDetails').append('<p>' + (library.notes ? library.notes : '') + '</p>');
        });

        /////////////////////////////////////////////////////////////////
        // 4. Widgets: Public Libraries News Local and changes stories
        // 
        /////////////////////////////////////////////////////////////////
        var locs = PublicLibrariesNews.locationsSortedByCount();
        var currentlyShowing = [0, 0];
        var clickNextItem = function (e) {
            e.preventDefault();
            var item = $(e.currentTarget.parentNode.parentNode);
            var authSt = PublicLibrariesNews.getAllStoriesGroupedByLocation()[$(item).data('auth')].stories;
            var index = $(item).data('current') + 1;
            if (index == authSt.length) index = 0;
            $(item).data('current', index);
            $(item).find('span').text((index + 1) + '/' + authSt.length);
            $(item).find('.list-group-item-text').html(authSt[index].text.replace($(item).data('auth') + ' – ', ''));
        };
        var addLocation = function (index, position) {
            var it = PublicLibrariesNews.getAllStoriesGroupedByLocation()[locs[index]];
            var li = '<div href="#" class="list-group-item" data-current="0" data-auth="' + locs[index] + '">' +
                '<span class="badge">1/' + it.stories.length + '</span>' +
                '<h4 class="list-group-item-heading">' + locs[index] + '</h4>' +
                '<p class="list-group-item-text">' + $('<div/>').html(it.stories[0].text.replace(locs[index] + ' – ', '')).text() + '</p>' +
                (it.stories.length > 1 ? '<p class="pull-right"><a id="Location' + index + '" href="#">next item &raquo;</a></p>' : '') +
                '<p><a href="http://www.publiclibrariesnews.com/' + it.stories[0].url + '" target="_blank">' + moment(it.stories[0].date).fromNow() + '</a></p></div>';

            position == 'first' ? $('#newsCounts').prepend(li) : $('#newsCounts').append(li);
            $('#Location' + index).on('click', clickNextItem);
        };
        var removeLocation = function (position) {
            $('#newsCounts div:' + position).remove();
        };
        var updateSwitchChevrons = function () {
            $('#newsSwitch li').attr('class', '');
            if (currentlyShowing[0] != 0) {
                $('#newsSwitch li a').first().html('&laquo; ' + locs[currentlyShowing[0] - 1]);
            } else {
                $('#newsSwitch li a').first().html('&laquo;');
                $('#newsSwitch li').first().attr('class', 'disabled');
            }
            if (currentlyShowing[1] != locs.length - 1) {
                $('#newsSwitch li a').last().html(locs[currentlyShowing[1] + 1] + ' &raquo;');
            } else {
                $('#newsSwitch li a').last().html('&raquo;');
                $('#newsSwitch li').last().attr('class', 'disabled');
            }
        };
        var clickShiftChangeItems = function (e) {
            e.preventDefault();
            var id = e.currentTarget.parentNode.parentNode.id;
            var incr = $(e.target).data('direction');
            if ((currentlyShowing[1] == locs.length - 1) || (currentlyShowing[0] == 0 && incr == -1)) return false;
            currentlyShowing[0] = currentlyShowing[0] + incr;
            currentlyShowing[1] = currentlyShowing[1] + incr;
            updateSwitchChevrons();
            removeLocation((incr == 1 ? 'first' : 'last'));
            addLocation(incr == 1 ? currentlyShowing[1] : currentlyShowing[0], (incr == 1 ? 'last' : 'first'));
        };
        $('ul.page-story-list li a').on('click', clickShiftChangeItems);
        // Initial setup: 3 items for changes, 1 for local news (generally longer)
        updateSwitchChevrons();
        for (x = 0 ; x < 1; x++) addLocation(x, 'last');


        //////////////////////////////////////////////
        // 6. Twitter
        // 
        //////////////////////////////////////////////
        var tweets = PublicLibrariesNews.getTweetsSortedByDate();
        var currentlyShowingTwitter = [0, 0];

        var addTweet = function (index, position) {
            if (tweets && tweets[index]) {
                var tweet = tweets[index]
                var li = '<div href="#" class="list-group-item twitter-list" data-current="0" data-auth="' + tweet.account + '">' +
                    '<a href="' + tweet.account + '"><span class="fa fa-twitter pull-right text-info"></span></a>' +
                    '<h4 class="list-group-item-heading">' + tweet.name + '</h4>' +
                    '<p class="list-group-item-text">' + $('<div/>').html(twttr.txt.autoLink(tweet.latest)).html() + '</p>' + '</div>';
                position == 'first' ? $('#tweetsCounts').prepend(li) : $('#tweetsCounts').append(li);
            }
        };
        var removeTweet = function (position) {
            $('#tweetsCounts div:' + position).remove();
        };
        var updateTwitterSwitchChevrons = function () {
            $('#twitterSwitch li').attr('class', '');
            if (currentlyShowingTwitter[0] != 0) {
                $('#tweetsSwitch li a').first().html('&laquo; ' + tweets[currentlyShowingTwitter[0] - 1].account);
            } else {
                $('#tweetsSwitch li a').first().html('&laquo;');
                $('#tweetsSwitch li').first().attr('class', 'disabled');
            }
            if (currentlyShowingTwitter[1] != tweets.length - 1) {
                $('#tweetsSwitch li a').last().html(tweets[currentlyShowingTwitter[1] + 1].account + ' &raquo;');
            } else {
                $('#tweetsSwitch li a').last().html('&raquo;');
                $('#tweetsSwitch li').last().attr('class', 'disabled');
            }
        };
        var clickShiftChangeTwitterItems = function (e) {
            e.preventDefault();
            var id = e.currentTarget.parentNode.parentNode.id;
            var incr = $(e.target).data('direction');
            if ((currentlyShowingTwitter[1] == tweets.length - 1) || (currentlyShowingTwitter[0] == 0 && incr == -1)) return false;
            currentlyShowingTwitter[0] = currentlyShowingTwitter[0] + incr;
            currentlyShowingTwitter[1] = currentlyShowingTwitter[1] + incr;
            updateTwitterSwitchChevrons();
            removeTweet((incr == 1 ? 'first' : 'last'));
            addTweet(incr == 1 ? currentlyShowingTwitter[1] : currentlyShowingTwitter[0], (incr == 1 ? 'last' : 'first'));
        };
        $('ul.page-twitter-list li a').on('click', clickShiftChangeTwitterItems);
        // Initial setup: 3 items for changes, 1 for local news (generally longer)
        updateTwitterSwitchChevrons();
        for (x = 0 ; x < 1; x++) addTweet(x, 'last');

        //////////////////////////////////////////////
        // 8. Widget: Area stats
        //  
        //////////////////////////////////////////////
        var typeBar = new Chart($('#divLibrariesStatsBarChart'), {
            type: 'horizontalBar',
            data: {
                labels: ['Multiple', 'Crime', 'Income', 'Health', 'Education'],
                datasets: []
            },
            options: {
                animation: {
                    animateScale: true
                },
                legend: {
                    position: 'bottom'
                }
            }
        });
        var updateLibTypeStatsBar = function (authority) {
            var authDepStats = PublicLibrariesNews.getDeprivationIndicesAveragesByAuthority(authority);
            $('#divIMD p').text((authDepStats.Multiple.sum() / authDepStats.Multiple.length).toFixed(0));
            $('#divCrime p').text((authDepStats.Crime.sum() / authDepStats.Crime.length).toFixed(0));
            $('#divIncome p').text((authDepStats.Income.sum() / authDepStats.Income.length).toFixed(0));
            $('#divHealth p').text((authDepStats.Health.sum() / authDepStats.Health.length).toFixed(0));
            $('#divEducation p').text((authDepStats.Education.sum() / authDepStats.Education.length).toFixed(0));
            $('#divHousing p').text((authDepStats.Housing.sum() / authDepStats.Housing.length).toFixed(0));
            typeBar.config.data.datasets = $.map(Object.keys(config.libStyles), function (x, y) {
                var ind = PublicLibrariesNews.getDeprivationIndicesByAuthorityAndLibType(authority, x);
                if (ind.Multiple.length > 0) {
                    return {
                        label: config.libStyles[x].type,
                        data: $.map(Object.keys(ind), function (i, y) {
                            var sum = 0;
                            $.each(ind[i], function (c, v) { sum = sum + parseInt(v) });
                            return ind[i] == 0 ? '' : (sum / ind[i].length).toFixed(1);
                        }),
                        backgroundColor: config.libStyles[x].colour,
                        hoverBackgroundColor: config.libStyles[x].colour
                    };
                }
            });
            typeBar.update();
        };
        updateLibTypeStatsBar();

        //////////////////////////////////////////////
        // 9. Widget: Distance stats
        //////////////////////////////////////////////
        var distanceLine = new Chart($('#divLibrariesDistancesLineChart'), {
            type: 'line',
            data: {
                labels: [0, 1, 2, 3, 4, 5, 6],
                datasets: [
                    {
                        data: [65, 59, 80, 81, 56, 55, 40],
                        spanGaps: false
                    }
                ]
            },
            options: {
                animation: { animateScale: true },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            maxTicksLimit: 8
                        }
                    }]
                }
            }
        });
        var updateLibDistancesLine = function (authority) {
            var distances = PublicLibrariesNews.getDistancesByAuthority(authority);
            distanceLine.config.data.labels = $.map(distances, function (x, y) { if (y != 'undefined') return y; });
            distanceLine.config.data.datasets[0].data = $.map(distances, function (x, y) { return x; });
            distanceLine.update();
            var totalDistance = 0, population = 0;
            $.each(distances, function (i, x) {
                totalDistance = (totalDistance + (i * x));
                population = population + x
            })
            $('#divDistanceAverage p').text((totalDistance / population).toFixed(1) + ' miles');
        };
        updateLibDistancesLine();
        $.each(PublicLibrariesNews.getAuthorityListSorted(), function (i, x) { $('#selAuthority').append($("<option></option>").attr("value", x).text(x)); });


        // EVENT: Change authority
        $('#selAuthority').change(function () {
            var auth = $('#selAuthority').find(":selected").val();
            updateLibraryDetailsSelect(auth);
            updateLibTypesDonut(auth);
            updateLibTypeStatsBar(auth);
            updateLibDistancesLine(auth);
        });
    });

    ///////////////////////
    // EXTENSIONS
    // Leaflet Helper: Get distance of a line
    //////////////////////
    L.Polyline = L.Polyline.extend({
        getDistance: function (system) {
            // distance in meters
            var mDistance = 0,
                length = this._latlngs.length;
            for (var i = 1; i < length; i++) {
                mDistance += this._latlngs[i].distanceTo(this._latlngs[i - 1]);
            }
            // optional
            if (system === 'imperial') {
                return mDistance / 1609.34;
            } else {
                return mDistance / 1000;
            }
        }
    });
    Array.prototype.sum = function () {
        var total = 0;
        for (var i = 0; i < this.length; i++) {
            total += parseFloat(this[i]);
        }
        return total;
    };
});