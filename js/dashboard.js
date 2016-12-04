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
    /////////////////////////////////////////////////////////
    // Helper Function: getMiles
    /////////////////////////////////////////////////////////
    var getMiles = function (i) { return i * 0.000621371192; };

    /////////////////////////////////////////////////
    // Variables
    // Declared variables that get set later on
    /////////////////////////////////////////////////
    var fmlMap = null, authMap = null, authBoundary = null, typeDonut = null, fmlLibraryMarker = null, fmlHomeMarker = null, fmlRoute = null;

    // Global Chart options
    Chart.defaults.global.defaultFontColor = '#98978B';
    Chart.defaults.global.defaultFontFamily = '"Roboto","Helvetica Neue",Helvetica,Arial,sans-serif';

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
            PublicLibrariesNews.getRouteToLibrary(fmlHomeMarker._latlng.lat, fmlHomeMarker._latlng.lng, fmlLibraryMarker._latlng.lat, fmlLibraryMarker._latlng.lng, type, function (route) {
                if (fmlRoute != null) fmlMap.removeLayer(fmlRoute);
                fmlRoute = L.polyline($.map(route.line, function (ll, i) { return L.latLng([ll[0], ll[1]]); }), { color: config.libStyles['ICL'].colour, dashArray: [5, 5], weight: 2 });
                fmlMap.addLayer(fmlRoute);
                $('#fmlRouteContent #' + type + ' #div' + type + 'Distance p').text(getMiles(route.distance).toFixed(1) + ' miles');
                $('#fmlRouteContent #' + type + ' #div' + type + 'Time p').text(moment.duration(route.time * 1000).humanize() + ' ');
                var stepsHtml = '';
                $('#div' + type + 'Instructions').empty();
                $.each(route.steps, function (i, x) {
                    stepsHtml += x.maneuver.instruction;
                    if (x.maneuver.type == 'depart' || x.maneuver.type == 'continue') stepsHtml += ' for ' + moment.duration(x.duration, 'seconds').humanize();
                    stepsHtml += '. ';
                });
                $('#div' + type + 'Instructions').append('<p><small>' + stepsHtml + '</small></p>');
                $('#div' + type + 'Instructions p small').shorten({ chars: 30 });
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

                // get the library types
                var libTypes = [];
                $.each($('.chb-libtype:checked'), function (i, x) { libTypes.push($(x).val()) });

                // If there are existing markers and route lines, remove them
                if (fmlLibraryMarker != null) fmlMap.removeLayer(fmlLibraryMarker);
                if (fmlHomeMarker != null) fmlMap.removeLayer(fmlHomeMarker);
                if (fmlRoute != null) fmlMap.removeLayer(fmlRoute);

                // create marker array
                var librariesArray = $.map(PublicLibrariesNews.getLibraryLocations(), function (l, i) {
                    if (libTypes.indexOf(l.type) != -1) {
                        var marker = L.marker([l.lat, l.lng], { icon: L.AwesomeMarkers.icon({ icon: 'book', markerColor: 'green' }) });
                        marker.name = l.name;
                        marker.address = l.address;
                        return marker;
                    }
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

                $('#fmlLibrary').text(fmlLibraryMarker.name + ' ' + fmlLibraryMarker.address);

                // Zoom to user location - this will take a little time so delay other actions.
                var displayRouteDetails = function () {
                    fmlMap.off('moveend', displayRouteDetails);
                    // Add the home and the library marker and the route
                    fmlMap.addLayer(fmlHomeMarker);
                    fmlMap.addLayer(fmlLibraryMarker);
                    $('#spFmlHome').show();
                    $('#spFmlSpinning').hide();
                    setRouteData('Walking');
                };
                fmlMap.on('moveend', displayRouteDetails);
                fmlMap.flyToBounds([[fmlHomeMarker._latlng.lat, fmlHomeMarker._latlng.lng], [fmlLibraryMarker._latlng.lat, fmlLibraryMarker._latlng.lng]]);
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
                    })
                }],
                labels: $.map(Object.keys(config.libStyles), function (x, y) {
                    return config.libStyles[x].type;
                })
            },
            type: "polarArea",
            options: {
                elements: {
                    arc: {
                        borderColor: "#98978B"
                    }
                },
                legend: {
                    position: 'bottom'
                },
                startAngle: (-0.3 * Math.PI)
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
            $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", '').text('Select a library'));
            $.each(PublicLibrariesNews.getLibrariesListSorted(authority), function (y, z) { $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", z).text(z)) });
            $('#selLibraryDetailsLibrary').attr('disabled', false);
        };
        // Initially set the library select for all libraries.
        updateLibraryDetailsSelect();

        // Event: On selecting a library, display that library's details.
        $('#selLibraryDetailsLibrary').change(function () {
            var lib = $('#selLibraryDetailsLibrary').find(":selected").val()
            if (lib == '') return;
            var library = PublicLibrariesNews.getLibraryByName(lib);
            $('#divLibraryDetails').empty();
            $('#divLibraryDetails').append('<h4>' + library.name + '</h4>');
            $('#divLibraryDetails').append('<p>' + (library.type ? ('<small class="text-' + config.libStyles[library.type].cssClass + '">' + config.libStyles[library.type].type + '.</small> ') : '') +
                (library.address ? (' <small>' + library.address + '.</small> ') : '') +
                (library.notes ? (' <small>' + library.notes + '</small> ') : '') + '</p>');
            if (library.email) $('#divLibraryDetails').append('<a href="mailto:' + library.email + '" target="_blank" class="btn btn-xs btn-info"><span class="fa fa-envelope"></span> Email</a>  ');
            if (library.url) $('#divLibraryDetails').append('<a href="' + library.url + '" target="_blank" class="btn btn-xs btn-info"><span class="fa fa-external-link"></span> Website</a>');
            $('#divLibraryDetails').append('<h5>Deprivation</h5><div class="row"><div class="col col-xs-3"><small class="text-muted">multiple</small><p class="lead text-info strong">' + library.imd_decile + '</p></div>' +
                '<div class="col col-xs-3"><small class="text-muted">income</small><p class="lead text-warning strong">' + library.income_decile + '</p></div>' +
                '<div class="col col-xs-3"><small class="text-muted">education</small><p class="lead text-success strong">' + library.education_decile + '</p></div>' +
                '<div class="col col-xs-3"><small class="text-muted">health</small><p class="lead text-danger strong">' + library.health_decile + '</p></div></div>' + 
                '<p><small class="text-muted">numbers represent deprivation deciles (1-10) for the area the library is located.  1 would be within the 10th most deprived in england, 10 the least deprived.</small></p>');
        });

        /////////////////////////////////////////////////////////////////
        // 4. Widgets: Public Libraries News Local and changes stories
        /////////////////////////////////////////////////////////////////
        var stories = PublicLibrariesNews.getAuthoritiesWithStories();
        var storiesOrdered = Object.keys(stories).sort(function (a, b) { return stories[b].stories.length - stories[a].stories.length });
        var currentlyShowing = [0, 0];
        var skipStoriesToAuthority = function (authority) {
            var id = storiesOrdered.indexOf(authority);
            $('#divNewsStories').hide();
            if (id != -1) {
                $('#divNewsStories').show();
                if ((currentlyShowing[1] == id) || (currentlyShowing[0] == id)) return false;
                currentlyShowing[0] = id;
                currentlyShowing[1] = id;
                updateSwitchChevrons();
                removeLocation('first');
                for (x = 0 ; x < 1; x++) addLocation(id + x, 'last');
            }
        };
        var setItemDetails = function (item, index) {
            var authSt = stories[$(item).data('auth')].stories;
            if (index == authSt.length) index = 0;
            $(item).find('span').text((index + 1) + '/' + authSt.length);
            $('.list-group-item-text').shorten('destroy');
            $(item).find('.list-group-item-text').html(authSt[index].text.replace($(item).data('auth') + ' – ', ''));
            $(item).find('.btn-pln-link').html('<span class="fa fa-external-link"></span>  ' + moment(authSt[index].date).fromNow());
            $(item).find('.btn-pln-link').attr('href', 'http://www.publiclibrariesnews.com/' + authSt[index].url);
            $('.list-group-item-text').shorten();
            $(item).data('current', index);
        };
        var clickNextItem = function (e) {
            e.preventDefault();
            var item = $(e.currentTarget.parentNode.parentNode);
            var index = $(item).data('current') + 1;
            setItemDetails(item, index);
        };
        var addLocation = function (index, position) {
            var it = stories[storiesOrdered[index]];
            var li = '<div href="#" class="list-group-item" data-current="0" data-auth="' + storiesOrdered[index] + '">' +
                '<span class="badge">1/' + it.stories.length + '</span>' +
                '<h4 class="list-group-item-heading">' + storiesOrdered[index] + '</h4>' +
                '<p class="list-group-item-text">' + $('<div/>').html(it.stories[0].text.replace(storiesOrdered[index] + ' – ', '')).text() + '</p>' +
                (it.stories.length > 1 ? '<p class="pull-right"><a id="Location' + index + '" href="#">next item &raquo;</a></p>' : '') +
                '<p><a class="btn btn-danger btn-xs btn-pln-link" href="http://www.publiclibrariesnews.com/' + it.stories[0].url + '" target="_blank"><span class="fa fa-external-link"></span>  ' + moment(it.stories[0].date).fromNow() + '</a></p></div>';
            position == 'first' ? $('#newsCounts').prepend(li) : $('#newsCounts').append(li);
            $('.list-group-item-text').shorten();
            $('#Location' + index).on('click', clickNextItem);
        };
        var removeLocation = function (position) {
            $('#newsCounts div:' + position).remove();
        };
        var updateSwitchChevrons = function () {
            $('#newsSwitch li').attr('class', '');
            if (currentlyShowing[0] != 0) {
                $('#newsSwitch li a').first().html('&laquo; ' + storiesOrdered[currentlyShowing[0] - 1]);
            } else {
                $('#newsSwitch li a').first().html('&laquo;');
                $('#newsSwitch li').first().attr('class', 'disabled');
            }
            if (currentlyShowing[1] != storiesOrdered.length - 1) {
                $('#newsSwitch li a').last().html(storiesOrdered[currentlyShowing[1] + 1] + ' &raquo;');
            } else {
                $('#newsSwitch li a').last().html('&raquo;');
                $('#newsSwitch li').last().attr('class', 'disabled');
            }
        };
        var clickShiftChangeItems = function (e) {
            e.preventDefault();
            var id = e.currentTarget.parentNode.parentNode.id;
            var incr = $(e.target).data('direction');
            if ((currentlyShowing[1] == storiesOrdered.length - 1) || (currentlyShowing[0] == 0 && incr == -1)) return false;
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
                    '<a href="https://twitter.com/' + tweet.account + '" target="_blank" title="twitter account link for ' + tweet.account + '"><span class="fa fa-twitter pull-right text-info tweet-account-link"></span></a>' +
                    '<h4 class="list-group-item-heading">' + tweet.name + '</h4>' +
                    '<div class="row">' +
                    '<div class="stats col col-xs-4"><small class="text-muted">tweets</small><p class="lead text-info strong">' + tweet.tweets + '</p></div>' +
                    '<div class="stats col col-xs-4"><small class="text-muted">followers</small><p class="lead text-warning strong">' + tweet.followers + '</p></div>' +
                    '<div class="stats col col-xs-4"><small class="text-muted">following</small><p class="lead text-success strong">' + tweet.following + '</p></div>' +
                    '</div>' +
                    '<p class="list-group-item-text">' + moment(tweet.latestDate, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').fromNow() + ': ' + $('<div/>').html(twttr.txt.autoLink(tweet.latest)).html() + '</p>' + '</div>';
                position == 'first' ? $('#tweetsCounts').prepend(li) : $('#tweetsCounts').append(li);
            }
        };
        var removeTweet = function (position) {
            $('#tweetsCounts div:first').remove();
        };
        var skipTwitterToAuthority = function (authority) {
            var id = -1;
            $.each(tweets, function (i, t) { if (t.name.indexOf(authority) != -1) id = i; });
            $('#divTwitter').hide();
            if (id != -1) {
                $('#divTwitter').hide();
                if ((currentlyShowingTwitter[1] == id) || (currentlyShowingTwitter[0] == id)) return false;
                currentlyShowingTwitter[0] = id;
                currentlyShowingTwitter[1] = id;
                updateTwitterSwitchChevrons();
                removeTweet('first');
                for (x = 0 ; x < 1; x++) addTweet(id + x, 'last');
            }
        };
        var updateTwitterSwitchChevrons = function () {
            $('#tweetsSwitch li').attr('class', '');
            if (currentlyShowingTwitter[0] != 0) {
                $('#tweetsSwitch li a').first().html('&laquo; @' + tweets[currentlyShowingTwitter[0] - 1].account);
            } else {
                $('#tweetsSwitch li a').first().html('&laquo;');
                $('#tweetsSwitch li').first().attr('class', 'disabled');
            }
            if (currentlyShowingTwitter[1] != tweets.length - 1) {
                $('#tweetsSwitch li a').last().html('@' + tweets[currentlyShowingTwitter[1] + 1].account + ' &raquo;');
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
                },
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Deprivation decile (1-10)'
                        },
                        ticks: {
                            beginAtZero: true
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Deprivation type'
                        }
                    }]
                },
                title: {
                    display: true,
                    text: 'Deprivation in library locations'
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
                        backgroundColor: config.libStyles[x].colour
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
                        spanGaps: false,
                        backgroundColor: config.libStyles['CL'].colour,
                        borderColor: '#98978B',
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        borderWidth: 2
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
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Distance (miles)'
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Population %'
                        }
                    }]
                }
            }
        });
        var updateLibDistancesLine = function (authority) {
            var distances = PublicLibrariesNews.getDistancesByAuthority(authority);
            var totalDistance = 0, population = 0;
            $.each(distances, function (i, x) {
                totalDistance = (totalDistance + (i * x));
                population = population + x;
            })
            distanceLine.config.data.labels = $.map(distances, function (x, y) { if (y != 'undefined') return y; });
            distanceLine.config.data.datasets[0].data = $.map(distances, function (x, y) { return Math.round((x / population) * 100); });
            distanceLine.update();
            
            $('#divDistanceAverage p').text((totalDistance / population).toFixed(1) + ' miles');
            $('#divDistanceLongest p').text(Object.keys(distances).sort((function (a, b) { return parseInt(b) - parseInt(a) }))[0] + ' miles');
            $('#divDistancePopOverOne p').text(Math.round((($.map(Object.keys(distances), function (x, i) { if (parseInt(x) > 1) return distances[x]; })).sum() / population) * 100) + '%');
        };
        updateLibDistancesLine();

        var updateAuthBoundary = function (authority) {
            if (authBoundary != null) authMap.removeLayer(authBoundary);
            authBoundary = L.polyline($.map(route.line, function (ll, i) { return L.latLng([ll[0], ll[1]]); }), { color: config.libStyles['ICL'].colour, dashArray: [5, 5], weight: 2 });
            authMap.addLayer(fmlRoute);
        };

        authmap = L.map('divAuthMap', { zoomControl: false }).setView([52.6, -2.5], 7);
        L.tileLayer(config.mapTilesLight).addTo(authmap);
        $.each(PublicLibrariesNews.getAuthorityListSorted(), function (i, x) { $('#selAuthority').append($("<option></option>").attr("value", x).text(x)); });
        // EVENT: Change authority
        $('#selAuthority').change(function () {
            var auth = $('#selAuthority').find(":selected").val();
            updateLibraryDetailsSelect(auth);
            updateLibTypesDonut(auth);
            updateLibTypeStatsBar(auth);
            updateLibDistancesLine(auth);
            if (auth) skipStoriesToAuthority(auth);
            if (auth) skipTwitterToAuthority(auth);
        });
    });

    ///////////////////////
    // EXTENSIONS
    //////////////////////
    // Leaflet Helper: Get distance of a line
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
    // Array: Get sum of values in an array
    Array.prototype.sum = function () {
        var total = 0;
        for (var i = 0; i < this.length; i++) {
            total += parseFloat(this[i]);
        }
        return total;
    };
});