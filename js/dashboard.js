$(function () {

    /////////////////////////////////////////////////
    // Variables
    // Declared variables that get set later on
    /////////////////////////////////////////////////
    var fmlMap = null, authMap = null, authBoundary = null, typeDonut = null, fmlLibraryMarker = null, fmlHomeMarker = null, fmlRoute = null;

    // Some benchmarking variable
    var avgPplPerlib = 0;

    // Global Chart options
    Chart.defaults.global.defaultFontColor = '#98978B';
    Chart.defaults.global.defaultFontFamily = '"Roboto","Helvetica Neue",Helvetica,Arial,sans-serif';
    Chart.defaults.global.responsiveAnimationDuration = 500;
    Chart.defaults.global.maintainAspectRatio = false;

    //////////////////////////////////////////////////////////////////////////
    // LOAD.  Load the data
    // 2 months of pulic libraries news.  Authority data, not authority 
    // geography, library data, twitter data.
    //////////////////////////////////////////////////////////////////////////
    LibrariesFuncs.loadData(2, true, false, true, true, function () {

        //////////////////////////////////////////////
        // 1. Widget: Select area
        //////////////////////////////////////////////

        // Populate the authorities select control
        $.each(LibrariesFuncs.getAuthorityListSorted(), function (i, x) { $('#selAuthority').append($("<option></option>").attr("value", x).text(x)); });

        // Function: updateAll
        // Run when the authority is changed to update all individual widgets
        var updateAll = function () {
            var auth = $('#selAuthority').find(":selected");
            $('.sel-auth-name').text(auth.text());
            updateLibTypesDonut(auth.val());
            updateLibTypeStatsBar(auth.val());
            updateLibDistancesLine(auth.val());
            updateLibraryDetailsSelect(auth.val());
            if (auth.val()) skipStoriesToAuthority(auth.val());
            if (auth.val()) skipTwitterToAuthority(auth.val());

            // Sentiment analysis
            (auth.text().indexOf('tersh') != -1 && (auth.text().indexOf('Le') != -1 || auth.text().indexOf('Gl') != -1) ? $('#divBetaAlert').removeClass('alert-warning').addClass('alert-danger') : $('#divBetaAlert').removeClass('alert-danger').addClass('alert-warning'));
        };

        // EVENT: Change authority
        $('#selAuthority').change(function () { updateAll(); });

        //////////////////////////////////////////////
        // 2. Twitter
        //////////////////////////////////////////////
        var tweets = LibrariesFuncs.getTweetsSortedByDate();
        var addTweet = function (index) {
            if (tweets && tweets[index]) {
                var tweet = tweets[index];
                var tw = '<div class="row">' +
                    '<div class="stats col-4"><small class="text-muted">tweets</small><p class="lead">' + LibrariesFuncs.getNumFormat(tweet.tweets) + '</p></div>' +
                    '<div class="stats col-4"><small class="text-muted">followers</small><p class="lead">' + LibrariesFuncs.getNumFormat(tweet.followers) + '</p></div>' +
                    '<div class="stats col-4"><small class="text-muted">following</small><p class="lead">' + LibrariesFuncs.getNumFormat(tweet.following) + '</p></div>' +
                    '</div>' +
                    '<p><a title="' + tweet.name + ' on twitter - ' + tweet.description + '" href="https://twitter.com/' + tweet.account + '">' + tweet.name + '</a> tweeted ' + moment(tweet.latestDate, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').fromNow() + '</p>' +
                    '<p>' + $('<div/>').html(twttr.txt.autoLink(tweet.latest)).html() + '</p>';
                $('#divTweet').append(tw);
                $('#divTweet a').addClass('alert-link');
                $('#divTweet a').attr('target', '_blank');
            }
        };

        var skipTwitterToAuthority = function (authority) {
            $('#divTwitter').hide();
            $.each(tweets, function (i, t) {
                if (t.name.indexOf(authority) != -1) {
                    $('#divTweet').empty();
                    $('#divTwitter').show();
                    addTweet(i);
                    return false;
                }
            });
        };

        //////////////////////////////////////////////
        // 3. Widget: Library details
        //////////////////////////////////////////////

        // Populate the select library control
        var updateLibraryDetailsSelect = function (authority) {
            $('#divLibraryLinks, #divLibraryDetails, #divLibraryStatutoryDetails, #divLibraryDeprivationDetails, #selLibraryDetailsLibrary').empty();
            $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", '').text('select a library'));
            $.each(LibrariesFuncs.getLibrariesListSorted(authority), function (y, z) { $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", z.id).text(z.name)) });
        };

        // Event: On selecting a library, display that library's details.
        $('#selLibraryDetailsLibrary').change(function () {
            $('#divLibraryLinks, #divLibraryDetails, #divLibraryStatutoryDetails, #divLibraryDeprivationDetails').empty();
            var lib = $('#selLibraryDetailsLibrary').find(":selected").val()

            if (lib == '') {
                var auth = $('#selAuthority').find(":selected");
                $('.sel-auth-name').text(auth.text());
                updateLibDistancesLine(auth.val());
                return;
            }

            updateLibDistancesLine(null, lib);
            var library = LibrariesFuncs.getLibraryById(lib);
            var libStyle = config.libStyles[library.type].cssClass;

            // Set up the links to email and website.
            $('#divLibraryLinks').append('<p>' +
                (library.email ? '<a href="mailto:' + library.email + '" target= "_blank" class="btn btn-secondary" title="email ' + library.name + '"> <span class="fa fa-envelope"></span> email</a > ' : '') +
                (library.url ? '<a href="' + (library.url.indexOf('http') == -1 ? 'http://' + library.url : library.url) + '" target="_blank" class="btn btn-secondary" title="go to ' + library.name + ' website"><span class="fa fa-external-link"></span>&nbsp;website</a>' : '') + '</p>'
            );

            // Set up the library details such as closed/open year, type, and notes
            var libType = (library.type ? ('<span class="strong text-' + libStyle + '">' + config.libStyles[library.type].description + '</span>') : '');
            var replacement = (library.replacement && library.replacement == 't' ? ' <span class="strong text-muted">(replacement ' + library.opened_year + ')</span>' : '');
            var closed = (library.closed && library.closed_year ? (' <span class="strong text-danger">(' + library.closed_year) + ')</span>' : '');
            var notes = (library.notes ? '<p>' + library.notes + '</p>' : '');

            $('#divLibraryDetails').append(
                '<p>' + libType + replacement + closed + '</p>' + notes
            );

            // Populate the hours and statutory details
            $('#divLibraryStatutoryDetails').append(
                '<div class="row">' +
                '<div class="col col-4"><small class="text-muted">statutory&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="is the library part of the local authority statutory provision?"></a></small><p class="lead text-gray-dark">' + (library.statutory2016 == 't' ? 'yes' : 'no') + '</p></div>' +
                '<div class="col col-4"><small class="text-muted">hours&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of hours open per week"></a></small><p class="lead text-gray-dark">' + (library.hours ? library.hours : '0') + '</p></div>' +
                '<div class="col col-4"><small class="text-muted">staffed&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of staff hours per week"></a></small><p class="lead ' + (library.staffhours && library.staffhours != 0 ? ('text-gray-dark">' + library.staffhours) : 'text-danger">0') + '</p>' +
                '</div>'
            );

            // Populate the deprivation details.
            $('#divLibraryDeprivationDetails').append(
                '<div class="row">' +
                '<div class="col col-4"><small class="text-muted">people&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="total population in the library catchment (mid-2015 estimate)"></a></small><p class="lead text-gray-dark">' + LibrariesFuncs.getNumFormat(library.population) + '</p></div>' +
                '<div class="col col-4"><small class="text-muted">adults&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of adults 16 and over"></a></small><p class="lead text-gray-dark">' + LibrariesFuncs.getNumFormat(parseInt(library.sixteen_fiftynine) + parseInt(library.over_sixty)) + '</p></div>' +
                '<div class="col col-4"><small class="text-muted">children&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of children under 16"></a></small><p class="lead text-gray-dark">' + LibrariesFuncs.getNumFormat(library.dependent_children) + '</p></div>' +
                '</div>' +
                '<small class="text-muted">catchment area, lower (1-10) means more deprived:</small></p>' +
                '<div class="row">' +
                '<div class="col col-4"><small class="text-muted">multiple&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="a combination of deprivation measures to give an overall deprivation index"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.multiple).toFixed(0)] + '">' + parseFloat(library.multiple).toFixed(0) + '</p></div>' +
                '<div class="col col-4"><small class="text-muted">work&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="employment deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.employment).toFixed(0)] + '">' + parseFloat(library.employment).toFixed(0) + '</p></div>' +
                '<div class="col col-4"><small class="text-muted">education&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="education deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.education).toFixed(0)] + '">' + parseFloat(library.education).toFixed(0) + '</p></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col col-4"><small class="text-muted">skills&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="adult skills and training deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.adultskills).toFixed(0)] + '">' + parseFloat(library.adultskills).toFixed(0) + '</p></div>' +
                '<div class="col col-4"><small class="text-muted">health&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="health deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.health).toFixed(0)] + '">' + parseFloat(library.health).toFixed(0) + '</p></div>' +
                '<div class="col col-4"><small class="text-muted">services&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="geographical access to services deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.services).toFixed(0)] + '">' + parseFloat(library.services).toFixed(0) + '</p></div>' +
                '</div>');
            updateTooltips();
        });

        //////////////////////////////////////////////
        // 4. Widget: Library types by authority
        //////////////////////////////////////////////
        var typeDonut = new Chart($('#divLibrariesDonutChart'), {
            data: {
                datasets: [{
                    data: [11, 16, 7, 3, 14],
                    backgroundColor: $.map(Object.keys(config.libStyles), function (x, y) { if (x != 'XL' && x != 'XLR' && x != 'XLT') return config.libStyles[x].colour; })
                }],
                labels: $.map(Object.keys(config.libStyles), function (x, y) { if (x != 'XL' && x != 'XLR' && x != 'XLT') return config.libStyles[x].type; })
            },
            type: "polarArea",
            options: {
                elements: { arc: { borderColor: "#98978B", borderWidth: 1 } },
                legend: {},
                startAngle: (-0.3 * Math.PI)
            },
            title: { display: true, text: 'number of libraries' }
        });
        var updateLibTypesDonut = function (libAuthority) {
            typeDonut.config.data.datasets[0].data = [];
            typeDonut.config.data.datasets[0].backgroundColor = [];
            typeDonut.config.data.labels = [];
            var counts = LibrariesFuncs.getCountLibraryTypesByAuthority(libAuthority);
            $.each(Object.keys(counts), function (t, c) {
                typeDonut.config.data.datasets[0].data.push(counts[c]);
                typeDonut.config.data.datasets[0].backgroundColor.push(config.libStyles[c].colour);
                typeDonut.config.data.labels.push(config.libStyles[c].type);
            });
            var stats = LibrariesFuncs.getStatCountsByAuthority(libAuthority);
            if (!libAuthority) avgPplPerlib = stats.peoplePerLibrary;
            // These stats shown at the authority selector.
            $('#divNumLibs p').text(stats.libraries);
            $('#divPopulation p').text(LibrariesFuncs.getNumFormat(stats.population));
            $('#divLibsPerPopulation p').removeClass().addClass('lead ' + (stats.peoplePerLibrary <= avgPplPerlib ? 'text-gray-dark' : 'text-danger'))
            $('#divLibsPerPopulation p').text(LibrariesFuncs.getNumFormat(stats.peoplePerLibrary));
            // These stats shown at the library types widget
            $('#divTotalCount p #spLibTotal').text(stats.libraries);
            $('#divTotalCount p #spLibChange').html('<span class="badge badge' + (stats.libsChange >= 0 ? '-default">+' : '-danger">') + stats.libsChange + '</span>');
            $('#divStatutoryCount p #spStatTotal').text(stats.statutory2016);
            $('#divStatutoryCount p #spStatChange').html('<span class="badge badge' + (stats.statutoryChange >= 0 ? '-default">+' : '-danger">') + stats.statutoryChange + '</span>');
            typeDonut.update();
        };

        //////////////////////////////////////////////
        // 5. Widget: Distance stats
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
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        borderWidth: 1
                    }
                ],
                scales: {
                    xAxes: [{
                        type: 'logarithmic'
                    }]
                }
            },
            options: {
                animation: { animateScale: true },
                legend: {
                    display: false
                },
                tooltips: {
                    callbacks: {
                        title: function (tooltipItem, data) {
                            return tooltipItem[0].xLabel + ' miles';
                        },
                        label: function (tooltipItem, data) {
                            return tooltipItem.yLabel + '%';
                        }
                    }
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

        // Function: updateLibDistancesLine
        // The library distances line chart works either on an authority or library basis.
        var updateLibDistancesLine = function (authority, library) {
            if (library) {
                var distances = LibrariesFuncs.getDistancesByLibrary(library);
                var lib = LibrariesFuncs.getLibraryById(library);
                $('#spDistanceTitle').text(lib.name + ' catchment');
                $('#hLibDistanceSubtitle').text('distance to ' + lib.name + ' library for population within the catchment area');
            } else {
                var distances = LibrariesFuncs.getDistancesByAuthority(authority);
                $('#hLibDistanceSubtitle').text('distance for population to the nearest statutory library');
            }
            var totalDistance = 0, population = 0;
            $.each(distances, function (i, x) {
                totalDistance = (totalDistance + (parseFloat(i) * x));
                population = population + x;
            });
            var labels = [], dataset = [];
            var distArray = $.map(distances, function (x, y) { if (y != 'undefined') return { dist: parseFloat(y), pop: x }; }).sort(function (a, b) { return a.dist - b.dist; });
            $.each(distArray, function (i, x) { labels.push(x.dist); dataset.push(Math.round((x.pop / population) * 100)) });
            distanceLine.config.data.labels = labels;
            distanceLine.config.data.datasets[0].data = dataset;
            distanceLine.update();
            $('#divDistanceAverage p').text((totalDistance / population).toFixed(1) + 'mi');
            $('#divDistanceLongest p').text(Object.keys(distances).sort((function (a, b) { return parseFloat(b) - parseFloat(a) }))[0] + 'mi');
            var popOverOne = (($.map(Object.keys(distances), function (x, i) { if (parseInt(x) > 1) return distances[x]; })).sum() / population) * 100;
            $('#divDistancePopOverOne p').removeClass().addClass('lead text-' + (popOverOne > 20 ? 'danger' : 'gray-dark'));
            $('#divDistancePopOverOne p').text(Math.round(popOverOne) + '%');
        };

        /////////////////////////////////////////////////////////////////
        // 6. Widgets: Public Libraries News Local and changes stories
        /////////////////////////////////////////////////////////////////
        var stories = LibrariesFuncs.getAuthoritiesWithStories();
        var storiesOrdered = Object.keys(stories).sort(function (a, b) { return stories[b].stories.length - stories[a].stories.length });
        var skipStoriesToAuthority = function (authority) {
            $('#divNewsStories').hide();
            if (storiesOrdered.indexOf(authority) != -1) {
                $('#divNewsStories').show();
                addLocation(storiesOrdered.indexOf(authority));
            }
        };
        var setItemDetails = function (auth, index) {
            var authSt = stories[auth].stories;
            $('#pCntCurrent').text((index + 1));
            $('#pNewsStory').shorten('destroy');
            $('#pNewsStory').html(authSt[index].text.replace(auth + ' – ', ''));
            $('#sp-news-date').text(moment(authSt[index].date).fromNow());
            $('#aPlnLink').attr('href', 'http://www.publiclibrariesnews.com/' + authSt[index].url);
            $('#pNewsStory').shorten();
        };
        var clickNextItem = function (e) {
            e.preventDefault();
            var item = $(e.currentTarget);
            var index = $(item).data('current') + 1;
            var authSt = stories[$(item).data('auth')].stories;
            if (index == authSt.length) index = 0;
            $(item).data('current', index);
            setItemDetails($(item).data('auth'), index);
        };
        var addLocation = function (index) {
            var it = stories[storiesOrdered[index]];
            $('#divNews').empty();
            if (it) {
                var li = '<div class="row">' +
                    '<div class="col col-4"><small class="text-muted">stories&nbsp;</small><p class="lead" id="pCntStories">' + $.map(it.stories, function (x, i) { if (x.type == 'local') return 1; }).length + '</p></div>' +
                    '<div class="col col-4"><small class="text-muted">changes&nbsp;</small><p class="lead" id="pCntChanges">' + $.map(it.stories, function (x, i) { if (x.type == 'changes') return 1; }).length + '</p></div>' +
                    '<div class="col col-4"><small class="text-muted">viewing&nbsp;</small><p class="lead" id="pCntCurrent">1</p></div>' +
                    '</div>' +
                    '<p><a class="alert-link" id="aPlnLink" href="http://www.publiclibrariesnews.com/' + it.stories[0].url + '" target="_blank">Public Libraries News</a> <span id="sp-news-date">' + moment(it.stories[0].date).fromNow() + '</span></p>' +
                    '<p id="pNewsStory">' + $('<div />').html(it.stories[0].text.replace(storiesOrdered[index] + ' – ', '')).text() + '</p>' +
                    (it.stories.length > 1 ? '<p><a data-auth="' + storiesOrdered[index] + '" data-current="0" class="alert-link" id="Location' + index + '" href="#">next story &raquo;</a>&nbsp;</p>' : '');
                $('#divNews').append(li);
                $('#pNewsStory').shorten();
                $('#Location' + index).on('click', clickNextItem);
            }
        };

        //////////////////////////////////////////////
        // 7. Widget: Area deprivation stats
        //////////////////////////////////////////////
        var typeBar = new Chart($('#divLibrariesStatsBarChart'), {
            type: 'horizontalBar',
            data: {
                labels: ['closed', 'replaced', 'local authority'],
                datasets: [
                    {
                        data: [1, 2, 3],
                        backgroundColor: config.libStyles['XLR'].colour,
                        borderColor: '#98978B',
                        borderWidth: 1
                    }]
            },
            options: {
                animation: { animateScale: true },
                legend: { display: false },
                scales: {
                    xAxes: [{ scaleLabel: { display: true, labelString: 'deprivation decile (1-10)' }, ticks: { beginAtZero: true } }],
                    yAxes: [{ scaleLabel: { display: true, labelString: 'library type' } }]
                },
                title: { display: true, text: 'multiple deprivation index by library type' }
            }
        });
        var updateLibTypeStatsBar = function (authority) {
            var authDepStats = LibrariesFuncs.getDeprivationIndicesAveragesByAuthority(authority);
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
            typeBar.config.data.datasets[0].data = [];
            typeBar.config.data.datasets[0].backgroundColor = [];
            typeBar.config.data.labels = [];
            var height = 100;
            var libDepIndices = LibrariesFuncs.getDeprivationIndicesByAuthority(authority);
            $.each(Object.keys(libDepIndices), function (i, x) {
                height = height + 25;
                typeBar.config.data.labels.push(config.libStyles[x].type);
                typeBar.config.data.datasets[0].data.push(libDepIndices[x].multiple);
                if (parseFloat(libDepIndices[x].multiple) < 4) {
                    typeBar.config.data.datasets[0].backgroundColor.push(config.libStyles['XL'].colour);
                } else {
                    typeBar.config.data.datasets[0].backgroundColor.push(config.libStyles['CRL'].colour);
                }
            });
            $('#divWrapperLibrariesStatsBarChart').css('height', height + 'px');
            typeBar.update();
        };
        // ONLOAD: First thing to do is update all widgets
        updateAll();
        $('.div-loading').hide();
    });

    ///////////////////////////////////////////////////////////////////
    // 8. Find My Library
    // Provides a means to enter postcode to find the closest library.
    // Displays this on a map, and displays configurable route.
    ///////////////////////////////////////////////////////////////////

    // FUNCTION: setRouteData
    var setRouteData = function (type) {
        LibrariesFuncs.getRouteToLibrary(fmlHomeMarker._latlng.lat, fmlHomeMarker._latlng.lng, fmlLibraryMarker._latlng.lat, fmlLibraryMarker._latlng.lng, type, function (route) {
            if (fmlRoute != null) fmlMap.removeLayer(fmlRoute);
            fmlRoute = L.polyline($.map(route.line, function (ll, i) { return L.latLng([ll[0], ll[1]]); }), { color: config.libStyles['ICL'].colour, dashArray: [5, 5], weight: 3 });
            fmlMap.addLayer(fmlRoute);
            $('#fmlRouteContent #' + type + ' #div' + type + 'Distance p').text(getMiles(route.distance).toFixed(1) + 'mi');
            $('#fmlRouteContent #' + type + ' #div' + type + 'Time p').text(moment.duration(route.time * 1000).humanize() + ' ');
            var stepsHtml = '';
            $('#div' + type + 'Instructions').empty();
            $.each(route.steps, function (i, x) {
                stepsHtml += x.maneuver.instruction;
                if (x.maneuver.type == 'depart' || x.maneuver.type == 'continue') stepsHtml += ' for ' + moment.duration(x.duration, 'seconds').humanize();
                stepsHtml += '. ';
            });
            $('#div' + type + 'Instructions').append('<p>' + stepsHtml + '</p>');
            $('#div' + type + 'Instructions p').shorten({ chars: 30 });
        });
    };

    // EVENT: Route type change
    $('#divFmlContent a[data-toggle="tab"]').on('shown.bs.tab', function (e) { setRouteData($(e.target).attr("href").replace('#', '')) });

    // EVENT: Address autocomplete
    $('#txtAddress').autocomplete({
        lookup: function (query, done) {
            LibrariesFuncs.getAddressCoordinates(query, function (data) { done({ suggestions: data }) });
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
            var librariesArray = $.map(LibrariesFuncs.getLibraryLocations(), function (l, i) {
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