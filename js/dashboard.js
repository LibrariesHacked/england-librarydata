$(function () {

    /////////////////////////////////////////////////
    // Variables
    // Declared variables that get set later on
    /////////////////////////////////////////////////
    var fmlMap = null, authMap = null, authBoundary = null, typeDonut = null, fmlLibraryMarker = null, fmlHomeMarker = null, fmlRoute = null;

    // Global Chart options
    Chart.defaults.global.defaultFontColor = '#98978B';
    Chart.defaults.global.defaultFontFamily = '"Roboto","Helvetica Neue",Helvetica,Arial,sans-serif';

    //////////////////////////////////////////////
    // LOAD.  Load the data
    //////////////////////////////////////////////
    PublicLibrariesNews.loadData(2, true, false, true, true, function () {

        //////////////////////////////////////////////
        // 1. Widget: Select area
        //////////////////////////////////////////////

        // Populate the authorities select control
        $.each(PublicLibrariesNews.getAuthorityListSorted(), function (i, x) { $('#selAuthority').append($("<option></option>").attr("value", x).text(x)); });

        // Function: updateAll
        // Run when the authority is changed to update all individual widgets
        var updateAll = function () {
            var auth = $('#selAuthority').find(":selected");
            $('.sel-auth-name').removeClass('text-dark-gray text-success').addClass((auth.val() ? 'text-success' : 'text-dark-gray'));
            $('.sel-auth-name').text(auth.text());
            updateLibTypesDonut(auth.val());
            updateLibTypeStatsBar(auth.val());
            updateLibDistancesLine(auth.val());
            updateLibraryDetailsSelect(auth.val());
            if (auth.val()) skipStoriesToAuthority(auth.val());
            if (auth.val()) skipTwitterToAuthority(auth.val());
            (auth.text().indexOf('tersh') != -1 ? $('#divBetaAlert').removeClass('alert-warning').addClass('alert-danger') : $('#divBetaAlert').removeClass('alert-danger').addClass('alert-warning'));
        };
        // EVENT: Change authority
        $('#selAuthority').change(function () { updateAll(); });

        //////////////////////////////////////////////
        // 2. Widget: Library details
        //////////////////////////////////////////////

        // Clears down the library details widget
        var clearLibraryDetails = function () {
            $('#divLibraryLinks, #divLibraryDetails, #divLibraryStatutoryDetails, #divLibraryDeprivationDetails').empty();
        };

        // Populate the select library control
        var updateLibraryDetailsSelect = function (authority) {
            clearLibraryDetails();
            $('#selLibraryDetailsLibrary').empty();
            $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", '').text('select a library'));
            $.each(PublicLibrariesNews.getLibrariesListSorted(authority), function (y, z) { $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", z.id).text(z.name)) });
        };

        // Event: On selecting a library, display that library's details.
        $('#selLibraryDetailsLibrary').change(function () {
            clearLibraryDetails();
            var lib = $('#selLibraryDetailsLibrary').find(":selected").val()

            if (lib == '') return;
            updateLibDistancesLine(null, lib);
            var library = PublicLibrariesNews.getLibraryById(lib);
            var libStyle = config.libStyles[library.type].cssClass;

            // Set up the links to email and website.
            $('#divLibraryLinks').append('<p>' +
                (library.email ? '<a href="mailto:' + library.email + '" target= "_blank" class="btn btn-secondary" title="email ' + library.name + '"> <span class="fa fa-envelope"></span> email</a > ' : '') +
                (library.url ? '<a href="' + (library.url.indexOf('http') == -1 ? 'http://' + library.url : library.url) + '" target="_blank" class="btn btn-secondary" title="go to ' + library.name + ' website"><span class="fa fa-external-link"></span>&nbsp;website</a>' : '') + '</p>'
            );

            // Set up the library details such as closed/open year, type, and notes
            $('#divLibraryDetails').append(
                (library.type ? ('<p><span class="strong text-' + libStyle + '">' + config.libStyles[library.type].type + '</span></p>') : '') +
                (library.replacement && library.replacement == 't' ? '<p><span class="strong text-muted"> replacement</span></p>' : '') +
                (library.notes ? '<p>' + library.notes + '</p>' : '') +
                (library.opened_year ? ('<p>opened in ' + library.opened_year + '</p>') : '') +
                (library.closed && library.closed_year ? ('<p>closed in ' + library.closed_year + '</p>') : '') + '</p>'
            );

            // Populate the hours and statutory details
            $('#divLibraryStatutoryDetails').append(
                '<div class="row">' +
                '<div class="col col-sm-4"><small class="text-muted">statutory&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="is this part of the local authority statutory provision?"></a></small><p class="lead text-gray-dark">' + (library.statutory2016 == 't' ? 'yes' : 'no') + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">hours&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of hours open per week"></a></small><p class="lead text-gray-dark">' + (library.hours ? library.hours : '0') + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">staff hours&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of staff hours per week"></a></small><p class="lead ' + (library.staffhours && library.staffhours != 0 ? ('text-gray-dark">' + library.staffhours) : 'text-danger">0') + '</p>' +
                '</div>'
            );

            // Populate the deprivation details.
            $('#divLibraryDeprivationDetails').append(
                (library.address ? ('<small class="text-muted">catchment population around ' + library.address + '.</small></p>') : '') +
                '<div class="row">' +
                '<div class="col col-sm-4"><small class="text-muted">population&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="total population in the library catchment"></a></small><p class="lead text-' + config.depStatStyles[library.population] + '">' + numFormat(library.population) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">adults&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of adults 16 and over"></a></small><p class="lead text-' + config.depStatStyles[library.population_adults] + '">' + numFormat(parseInt(library.sixteen_fiftynine) + parseInt(library.over_sixty)) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">children&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of children under 16"></a></small><p class="lead text-' + config.depStatStyles[library.population_children] + '">' + numFormat(library.dependent_children) + '</p></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col col-sm-4"><small class="text-muted">multiple&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="a combination of deprivation measures to give an overall indicator"></a></small><p class="lead text-' + config.depStatStyles[library.multiple] + '">' + parseFloat(library.multiple).toFixed(0) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">employment&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="employment deprivation for the area"></a></small><p class="lead text-' + config.depStatStyles[library.employment] + '">' + parseFloat(library.employment).toFixed(0) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">education&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="education deprivation for the area"></a></small><p class="lead text-' + config.depStatStyles[library.education] + '">' + parseFloat(library.education).toFixed(0) + '</p></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col col-sm-4"><small class="text-muted">adult skills&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="adult skills and training deprivation for the area"></a></small><p class="lead text-' + config.depStatStyles[library.adultskills] + '">' + parseFloat(library.adultskills).toFixed(0) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">health&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="health deprivation for the area"></a></small><p class="lead text-' + config.depStatStyles[library.health] + '">' + parseFloat(library.health).toFixed(0) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">services&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="geographical access to services deprivation for the area"></a></small><p class="lead text-' + config.depStatStyles[library.services] + '">' + parseFloat(library.services).toFixed(0) + '</p></div>' +
                '</div>'
                );
            updateTooltips();
        });

        //////////////////////////////////////////////
        // 3. Widget: Distance stats
        //////////////////////////////////////////////
        var distanceLine = new Chart($('#divLibrariesDistancesLineChart'), {
            type: 'line',
            data: {
                labels: [0, 1, 2, 3, 4, 5, 6], // Fake labels - will be overrriden
                datasets: [
                    {
                        data: [65, 59, 80, 81, 56, 55, 40], // Fake news
                        spanGaps: false,
                        backgroundColor: config.libStyles['CL'].colour,
                        borderColor: '#98978B',
                        pointRadius: 1,
                        pointHoverRadius: 4,
                        borderWidth: 1
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
                            labelString: 'distance (miles)'
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'population %'
                        }
                    }]
                }
            }
        });

        var updateLibDistancesLine = function (authority, library) {
            if (library) {
                var distances = PublicLibrariesNews.getDistancesByLibrary(library);
                var lib = PublicLibrariesNews.getLibraryById(library);
                $('#spDistanceTitle').text(lib.name + ' catchment');
                $('#hLibDistanceSubtitle').text('distance to ' + lib.name + ' within catchment area');
            } else {
                var distances = PublicLibrariesNews.getDistancesByAuthority(authority);
                $('#hLibDistanceSubtitle').text('distance to the nearest statutory library');
            }
            var totalDistance = 0, population = 0;
            $.each(distances, function (i, x) {
                totalDistance = (totalDistance + (i * x));
                population = population + x;
            });
            distanceLine.config.data.labels = $.map(distances, function (x, y) { if (y != 'undefined') return y; });
            distanceLine.config.data.datasets[0].data = $.map(distances, function (x, y) { return Math.round((x / population) * 100); });
            distanceLine.update();
            $('#divDistanceAverage p').text((totalDistance / population).toFixed(1) + ' mi.');
            $('#divDistanceLongest p').text(Object.keys(distances).sort((function (a, b) { return parseInt(b) - parseInt(a) }))[0] + ' mi.');
            var popOverOne = (($.map(Object.keys(distances), function (x, i) { if (parseInt(x) > 1) return distances[x]; })).sum() / population) * 100;
            $('#divDistancePopOverOne p').removeClass().addClass('lead text-' + (popOverOne > 20 ? 'danger' : 'gray-dark'));
            $('#divDistancePopOverOne p').text(Math.round(popOverOne) + '%');
        };

        //////////////////////////////////////////////
        // 4. Widget: Library types by authority
        //////////////////////////////////////////////
        var typeDonut = new Chart($('#divLibrariesDonutChart'), {
            data: {
                datasets: [{
                    data: [11, 16, 7, 3, 14, 11],
                    backgroundColor: $.map(Object.keys(config.libStyles), function (x, y) { return config.libStyles[x].colour; })
                }],
                labels: $.map(Object.keys(config.libStyles), function (x, y) { return config.libStyles[x].type; })
            },
            type: "polarArea",
            options: {
                elements: { arc: { borderColor: "#98978B", borderWidth: 1 } },
                legend: { position: 'bottom' },
                startAngle: (-0.3 * Math.PI)
            },
            title: { display: true, text: 'number of libraries' }
        });
        var updateLibTypesDonut = function (libAuthority) {
            typeDonut.config.data.datasets[0].data = [];
            typeDonut.config.data.datasets[0].backgroundColor = [];
            typeDonut.config.data.labels = [];
            $.each(Object.keys(config.libStyles), function (t, c) {
                var count = PublicLibrariesNews.getCountLibrariesByAuthorityType(libAuthority, c);
                if (count > 0) typeDonut.config.data.datasets[0].data.push(count);
                if (count > 0) typeDonut.config.data.datasets[0].backgroundColor.push(config.libStyles[c].colour);
                if (count > 0) typeDonut.config.data.labels.push(config.libStyles[c].type);
            });
            var stats = PublicLibrariesNews.getStatCountsByAuthority(libAuthority);
            // These stats shown at the authority selector.
            $('#divNumLibs p').text(stats.libraries);
            $('#divPopulation p').text(numFormat(stats.population));
            $('#divLibsPerPopulation p').removeClass().addClass('lead ' + (stats.peoplePerLibrary < 20000 ? 'text-gray-dark' : 'text-danger'))
            $('#divLibsPerPopulation p').text(numFormat(stats.peoplePerLibrary));
            // These stats shown at the library types widget
            $('#divTotalCount p #spLibTotal').text(stats.libraries);
            $('#divTotalCount p #spLibChange').html('<span class="badge badge' + (stats.libsChange >= 0 ? '-default">+' : '-danger">') + stats.libsChange + '</span>');
            $('#divStatutoryCount p #spStatTotal').text(stats.statutory2016);
            $('#divStatutoryCount p #spStatChange').html('<span class="badge badge' + (stats.statutoryChange >= 0 ? '-default">+' : '-danger">') + stats.statutoryChange + '</span>');
            typeDonut.update();
        };

        ///////////////////////////////////////////////////////////////////
        // 5. Find My Library
        // Provides a means to enter postcode to find the closest library.
        // Displays this on a map, and displays configurable route.
        ///////////////////////////////////////////////////////////////////

        // FUNCTION: setRouteData
        var setRouteData = function (type) {
            PublicLibrariesNews.getRouteToLibrary(fmlHomeMarker._latlng.lat, fmlHomeMarker._latlng.lng, fmlLibraryMarker._latlng.lat, fmlLibraryMarker._latlng.lng, type, function (route) {
                if (fmlRoute != null) fmlMap.removeLayer(fmlRoute);
                fmlRoute = L.polyline($.map(route.line, function (ll, i) { return L.latLng([ll[0], ll[1]]); }), { color: config.libStyles['ICL'].colour, dashArray: [5, 5], weight: 3 });
                fmlMap.addLayer(fmlRoute);
                $('#fmlRouteContent #' + type + ' #div' + type + 'Distance p').text(getMiles(route.distance).toFixed(1) + ' mi.');
                $('#fmlRouteContent #' + type + ' #div' + type + 'Time p').text(moment.duration(route.time * 1000).humanize() + ' ');
                var stepsHtml = '';
                $('#div' + type + 'Instructions').empty();
                $.each(route.steps, function (i, x) {
                    stepsHtml += x.maneuver.instruction;
                    if (x.maneuver.type == 'depart' || x.maneuver.type == 'continue') stepsHtml += ' for ' + moment.duration(x.duration, 'seconds').humanize();
                    stepsHtml += '. ';
                });
                $('#div' + type + 'Instructions').append('<p>' + stepsHtml + '</p>');
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

                // Get the library types
                var libTypes = [];
                $.each($('.chb-libtype:checked'), function (i, x) { libTypes.push($(x).val()) });

                // If there are existing markers and route lines, remove them
                if (fmlLibraryMarker != null) fmlMap.removeLayer(fmlLibraryMarker);
                if (fmlHomeMarker != null) fmlMap.removeLayer(fmlHomeMarker);
                if (fmlRoute != null) fmlMap.removeLayer(fmlRoute);

                // create marker array
                var librariesArray = $.map(PublicLibrariesNews.getLibraryLocations(), function (l, i) {
                    if (libTypes.indexOf(l.type) != -1) {
                        var marker = L.marker([l.lat, l.lng], { icon: L.AwesomeMarkers.icon({ prefix: 'fa', icon: 'book', markerColor: 'green' }) });
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
                fmlHomeMarker = L.marker([suggestion.data[1], suggestion.data[0]], { icon: L.AwesomeMarkers.icon({ prefix: 'fa', icon: 'home', markerColor: 'red' }) });

                $('#spNearestLibName').removeClass().addClass('text-success');
                $('#spNearestLibName').text(': ' + fmlLibraryMarker.name);

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

        /////////////////////////////////////////////////////////////////
        // 6. Widgets: Public Libraries News Local and changes stories
        /////////////////////////////////////////////////////////////////
        var stories = PublicLibrariesNews.getAuthoritiesWithStories();
        var storiesOrdered = Object.keys(stories).sort(function (a, b) { return stories[b].stories.length - stories[a].stories.length });
        var skipStoriesToAuthority = function (authority) {
            $('#divNewsStories').hide();
            if (storiesOrdered.indexOf(authority) != -1) {
                $('#divNewsStories').show();
                addLocation(storiesOrdered.indexOf(authority));
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
        var addLocation = function (index) {
            var it = stories[storiesOrdered[index]];
            $('#divNews').empty();
            if (it) {
                var li = '<div class="row">' +
                    '<div class="col col-sm-4"><small class="text-muted">stories&nbsp;</small><p class="lead"><strong>' + it.stories.length + '</strong></p></div>' +
                    '<div class="col col-sm-4"><small class="text-muted">changes&nbsp;</small><p class="lead"><strong>' + it.stories.length + '</strong></p></div>' +
                    '<div class="col col-sm-4"><small class="text-muted">current&nbsp;</small><p class="lead"><strong>' + it.stories.length + '</strong></p></div>' +
                    '</div>' +
                    '<p><a class="alert-link" href="http://www.publiclibrariesnews.com/' + it.stories[0].url + '" target="_blank">' + moment(it.stories[0].date).fromNow() + '</a></p>' +
                    '<p>' + $('<div />').html(it.stories[0].text.replace(storiesOrdered[index] + ' – ', '')).text() + '</p>' +
                    (it.stories.length > 1 ? '<p><a data-auth="' + index + '" data-current="0" class="alert-link" id="Location' + index + '" href="#">next story &raquo;</a>&nbsp;</p>' : '');
                $('#divNews').append(li);
                $('.list-group-item-text').shorten();
                $('#Location' + index).on('click', clickNextItem);
            }
        };

        //////////////////////////////////////////////
        // 7. Twitter
        //////////////////////////////////////////////
        var tweets = PublicLibrariesNews.getTweetsSortedByDate();
        var addTweet = function (index) {
            if (tweets && tweets[index]) {
                var tweet = tweets[index];
                var tw = '<div class="row">' +
                    '<div class="stats col-sm-4"><small class="text-muted">tweets</small><p class="lead"><strong>' + numFormat(tweet.tweets) + '</strong></p></div>' +
                    '<div class="stats col-sm-4"><small class="text-muted">followers</small><p class="lead"><strong>' + numFormat(tweet.followers) + '</strong></p></div>' +
                    '<div class="stats col-sm-4"><small class="text-muted">following</small><p class="lead"><strong>' + numFormat(tweet.following) + '</strong></p></div>' +
                    '</div>' +
                    '<p>' + moment(tweet.latestDate, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').fromNow() + ': ' + $('<div/>').html(twttr.txt.autoLink(tweet.latest)).html() + '</p>';
                $('#divTweet').append(tw);
            }
        };
        var skipTwitterToAuthority = function (authority) {
            var id = -1;
            $('#divTwitter').hide();
            $.each(tweets, function (i, t) {
                if (t.name.indexOf(authority) != -1) {
                    $('#divTweet').empty();
                    $('#divTwitter').show();
                    addTweet(i);
                }
            });
        };

        //////////////////////////////////////////////
        // 8. Widget: Area deprivation stats
        //////////////////////////////////////////////
        var typeBar = new Chart($('#divLibrariesStatsBarChart'), {
            type: 'horizontalBar',
            data: { labels: ['multiple'], datasets: [] },
            options: {
                animation: { animateScale: true },
                legend: { position: 'bottom' },
                scales: {
                    xAxes: [{ scaleLabel: { display: true, labelString: 'deprivation decile (1-10)' }, ticks: { beginAtZero: true } }],
                    yAxes: [{ scaleLabel: { display: true, labelString: 'deprivation type' } }]
                },
                title: { display: true, text: 'library catchment deprivation by library type' }
            }
        });
        var updateLibTypeStatsBar = function (authority) {
            var authDepStats = PublicLibrariesNews.getDeprivationIndicesAveragesByAuthority(authority);
            $('#divIMD p, #divEmployment p, #divEducation p, #divAdultSkills p, #divHealth p, #divServices p').removeClass();
            $('#divIMD p').text(authDepStats.multiple);
            $('#divIMD p').addClass('lead strong text-' + config.depStatStyles[authDepStats.multiple])
            $('#divEmployment p').text(authDepStats.employment);
            $('#divEmployment p').addClass('lead strong text-' + config.depStatStyles[authDepStats.employment])
            $('#divEducation p').text(authDepStats.education);
            $('#divEducation p').addClass('lead strong text-' + config.depStatStyles[authDepStats.education])
            $('#divAdultSkills p').text(authDepStats.adultskills);
            $('#divAdultSkills p').addClass('lead strong text-' + config.depStatStyles[authDepStats.adultskills])
            $('#divHealth p').text(authDepStats.health);
            $('#divHealth p').addClass('lead strong text-' + config.depStatStyles[authDepStats.health])
            $('#divServices p').text(authDepStats.services);
            $('#divServices p').addClass('lead strong text-' + config.depStatStyles[authDepStats.services])
            typeBar.config.data.datasets = $.map(Object.keys(config.libStyles), function (x, y) {
                var ind = PublicLibrariesNews.getDeprivationIndicesByAuthorityAndLibType(authority, x);
                if (ind.multiple.length > 0) {
                    return {
                        label: config.libStyles[x].type,
                        data: $.map(Object.keys(ind), function (i, y) { return ind[i] && ind[i] == 0 ? '' : ind[i]; }),
                        backgroundColor: config.libStyles[x].colour,
                        borderColor: '#98978B',
                        borderWidth: 1
                    };
                }
            });
            typeBar.update();
        };
        // ONLOAD: First thing to do is update all widgets
        updateAll();
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
    /////////////////////////////////////////////////////////
    // Helper Function: numFormat
    /////////////////////////////////////////////////////////
    var numFormat = function (num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num ? parseInt(num).toFixed(0) : null;
    };
    /////////////////////////////////////////////////////////
    // Helper Function: getMiles
    /////////////////////////////////////////////////////////
    var getMiles = function (i) { return i * 0.000621371192; };

    /////////////////////////////////////////////////////////
    // Tooltips
    /////////////////////////////////////////////////////////
    var updateTooltips = function () {
        $('[data-toggle="tooltip"]').on('click', function (e) { e.preventDefault(); }).tooltip();
    };
    updateTooltips();
});