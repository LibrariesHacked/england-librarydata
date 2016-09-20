$(function () {
    /////////////////////////////////////////////////
    // Map.  Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var map = L.map('divMiniMap', { zoomControl: false }).setView([52.6, -2.5], 6);
    var fmlMap = null;
    var plnData = null;
    var libraries = null;
    var authLibs = null;
    var typeDonut = null;
    var shuffle = null;
    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A', {
        attribution: '&copy; <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Load the initial set of data - for the dashboard start with 1 month
    PublicLibrariesNews.loadData(2, false, true, true, true, function () {
        plnData = { 'local': PublicLibrariesNews.getStoriesGroupedByLocation('local'), 'changes': PublicLibrariesNews.getStoriesGroupedByLocation('changes') }
        authLibs = PublicLibrariesNews.getAuthoritiesWithLibraries();

        //////////////////////////////////////////////
        // 1. Library types by authority
        //////////////////////////////////////////////
        var typeDonut = new Chart($('#divLibrariesDonutChart'), {
            type: 'doughnut',
            data: {
                labels: [''],
                datasets: [
                    {
                        data: [1],
                        backgroundColor: [],
                        hoverBackgroundColor: []
                    }
                ]
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
        var updateLibTypesDonut = function (libAuthority) {
            var libTypes = { LAL: 0, CRL: 0, ICL: 0, CL: 0, XL: 0 };
            var chartData = {
                labels: [],
                datasets: {
                    data: [],
                    backgroundColor: $.map(Object.keys(config.libStyles), function (x, y) {
                        return config.libStyles[x].colour;
                    }),
                    hoverBackgroundColor: $.map(Object.keys(config.libStyles), function (x, y) {
                        return config.libStyles[x].colour;
                    })
                }
            };
            $.each(Object.keys(authLibs).sort(), function (i, x) {
                if (x == libAuthority | !libAuthority) {
                    $.each(authLibs[x].libraries, function (y, z) {
                        libTypes[z.type] = libTypes[z.type] + 1;
                    });
                }
            });
            $.each(libTypes, function (t, c) {
                chartData.labels.push((config.libStyles[t] ? config.libStyles[t].type : 'Unknown'));
                chartData.datasets.data.push(c);
            });
            typeDonut.config.data.datasets[0] = chartData.datasets;
            typeDonut.config.data.labels = chartData.labels;
            typeDonut.update();
        };

        // Initially populate the library authorities select control.
        $.each(Object.keys(authLibs).sort(), function (i, x) {
            $('#selLibraryTypeAuthority').append($("<option></option>").attr("value", x).text(x));
        });

        // Event: On changing the library authority, update the donut chart.
        $('#selLibraryTypeAuthority').change(function () {
            updateLibTypesDonut($('#selLibraryTypeAuthority').find(":selected").val());
        });

        // Initially set the library types donut chart.
        updateLibTypesDonut();


        //////////////////////////////////////////////
        // 2. Widget: Library details by authority
        //////////////////////////////////////////////

        // Populate the authority control
        $.each(Object.keys(authLibs).sort(), function (i, x) {
            $('#selLibraryDetailsAuthority').append($("<option></option>").attr("value", x).text(x));
        });

        // Populate the select library control
        var updateLibraryDetailsSelect = function (authority) {
            var allLibs = [];
            $('#selLibraryDetailsLibrary').empty();
            $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", '').text('Select a library'));
            $.each(Object.keys(authLibs).sort(), function (i, x) {
                if (authLibs[x] && authLibs[x].libraries && (x == authority)) allLibs = allLibs.concat(authLibs[x].libraries);
            });
            allLibs.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });
            $.each(allLibs, function (y, z) { $('#selLibraryDetailsLibrary').append($("<option></option>").attr("value", z.name).text(z.name)) });
        };

        // Initially set the library select for all libraries.
        updateLibraryDetailsSelect();

        // Event: On changing the library authority, update the library select chart.
        $('#selLibraryDetailsAuthority').change(function () {
            updateLibraryDetailsSelect($('#selLibraryDetailsAuthority').find(":selected").val());
        });

        // Event: On selecting a library, display that library's details.
        $('#selLibraryDetailsLibrary').change(function () {
            if ($('#selLibraryDetailsLibrary').find(":selected").val() == '') return;
            var libAuth = [$('#selLibraryDetailsLibrary').find(":selected").val(), $('#selLibraryDetailsAuthority').find(":selected").val()];
            var library = null;
            $.each(authLibs[libAuth[1]].libraries, function (i, x) { if (x.name == libAuth[0]) library = x; });
            $('#divLibraryDetails').empty();
            $('#divLibraryDetails').append('<h4>' + library.name + '</h4>');
            $('#divLibraryDetails').append('<small>' + (library.type ? config.libStyles[library.type].type : '') + '</small>');
            $('#divLibraryDetails').append('<p>' + (library.address ? '' : '') + '</p>');
            $('#divLibraryDetails').append('<p>' + (library.notes ? library.notes : '') +  '</p>');
            shuffle.update();
        });

        /////////////////////////////////////////////////////////////////
        // 3. Widgets: Public Libraries News Local and changes stories
        /////////////////////////////////////////////////////////////////
        var locs = { changes: PublicLibrariesNews.locationsSortedByCount('changes'), local: PublicLibrariesNews.locationsSortedByCount('local') };
        var currentlyShowing = { changes: [0, 2], local: [0, 0] };
        var clickNextItem = function (e) {
            e.preventDefault();
            var type = e.currentTarget.id.substring(0, e.currentTarget.id.indexOf('Location'));
            var item = $(e.currentTarget.parentNode.parentNode);
            var authSt = plnData[type][$(item).data('auth')].stories;
            var index = $(item).data('current') + 1;
            if (index == authSt.length) index = 0;
            $(item).data('current', index);
            $(item).find('span').text((index + 1) + '/' + authSt.length);
            $(item).find('.list-group-item-text').html(authSt[index].text.replace($(item).data('auth') + ' – ', ''));
            shuffle.update();
        };
        var addLocation = function (type, index, position) {
            var it = plnData[type][locs[type][index]];
            var li = '<div href="#" class="list-group-item ' + type + '-list" data-current="0" data-auth="' + locs[type][index] + '">' +
                '<span class="badge">1/' + it.stories.length + '</span>' +
                '<h4 class="list-group-item-heading">' + locs[type][index] + '</h4>' +
                '<p class="list-group-item-text">' + $('<div/>').html(it.stories[0].text.replace(locs[type][index] + ' – ', '')).text() + '</p>' +
                (it.stories.length > 1 ? '<p class="pull-right"><a id="' + type + 'Location' + index + '" href="#">next item &raquo;</a></p>' : '') +
                '<p><a href="http://www.publiclibrariesnews.com/' + it.stories[0].url + '" target="_blank">' + moment(it.stories[0].date).fromNow() + '</a></p></div>';

            position == 'first' ? $('#' + type + 'Counts').prepend(li) : $('#' + type + 'Counts').append(li);
            $('#' + type + 'Location' + index).on('click', clickNextItem);
        };
        var removeLocation = function (type, position) {
            $('#' + type + 'Counts div:' + position).remove();
        };
        var updateSwitchChevrons = function (type) {
            $('#' + type + 'Switch li').attr('class', '');
            if (currentlyShowing[type][0] != 0) {
                $('#' + type + 'Switch li a').first().html('&laquo; ' + locs[type][currentlyShowing[type][0] - 1]);
            } else {
                $('#' + type + 'Switch li a').first().html('&laquo;');
                $('#' + type + 'Switch li').first().attr('class', 'disabled');
            }
            if (currentlyShowing[type][1] != locs.length - 1) {
                $('#' + type + 'Switch li a').last().html(locs[type][currentlyShowing[type][1] + 1] + ' &raquo;');
            } else {
                $('#' + type + 'Switch li a').last().html('&raquo;');
                $('#' + type + 'Switch li').last().attr('class', 'disabled');
            }
        };
        var clickShiftChangeItems = function (e) {
            e.preventDefault();
            var id = e.currentTarget.parentNode.parentNode.id;
            var type = id.substring(0, id.indexOf('Switch'));
            var incr = $(e.target).data('direction');
            if ((currentlyShowing[type][1] == locs[type].length - 1) || (currentlyShowing[type][0] == 0 && incr == -1)) return false;
            currentlyShowing[type][0] = currentlyShowing[type][0] + incr;
            currentlyShowing[type][1] = currentlyShowing[type][1] + incr;
            updateSwitchChevrons(type);
            removeLocation(type, (incr == 1 ? 'first' : 'last'));
            addLocation(type, incr == 1 ? currentlyShowing[type][1] : currentlyShowing[type][0], (incr == 1 ? 'last' : 'first'));
            shuffle.update();
        };
        $('ul.page-story-list li a').on('click', clickShiftChangeItems);
        // Initial setup: 3 items for changes, 1 for local news (generally longer)
        updateSwitchChevrons('local');
        updateSwitchChevrons('changes');
        for (x = 0 ; x < 1; x++) addLocation('local', x, 'last');
        for (x = 0 ; x < 3; x++) addLocation('changes', x, 'last');

        //////////////////////////////////////////////
        // 3. Populate the mini map
        //////////////////////////////////////////////
        var miniMapCurrent = 'local';
        var mapLayers = { 'local': '', 'changes': '' };
        var currentLayer = '';
        var addMiniMapPoints = function (type) {
            if (currentLayer != '') map.removeLayer(currentLayer);
            miniMapCurrent = type;
            $('#ulMapPointType li').attr('class', '');
            $('#ulMapPointType li#' + type).attr('class', 'active');
            if (mapLayers[type] == '') {
                var markerArray = [];
                $.each(plnData[type], function (i, o) {
                    var size = ['small', 20];
                    if (o.stories.length >= 5) size = ['medium', 30];
                    if (o.stories.length >= 10) size = ['large', 40];
                    var newsIcon = L.divIcon({ html: '<div><span>' + o.stories.length + '</span></div>', className: "marker-cluster marker-cluster-" + size[0], iconSize: new L.Point(size[1], size[1]) });
                    var marker = L.marker([o.lat, o.lng], { icon: newsIcon });
                    marker.stories = o.stories;
                    marker.title = i;
                    var markerClick = function (e) {
                    };
                    marker.on('click', markerClick);
                    markerArray.push(marker);
                });
                mapLayers[type] = L.layerGroup(markerArray);
            }
            currentLayer = mapLayers[type];
            currentLayer.addTo(map);
        };
        $('#ulMapPointType li span').first().text(PublicLibrariesNews.storyCount('local'));
        $('#ulMapPointType li span').last().text(PublicLibrariesNews.storyCount('changes'));
        $('#ulMapPointType li a').click(function (e) {
            e.preventDefault();
            var type = $(e.target).closest('li').attr('id');
            if (miniMapCurrent == type) return false;
            addMiniMapPoints(type);
        });
        addMiniMapPoints('local');




        //////////////////////////////////////////////
        // 4. Twitter
        //////////////////////////////////////////////








        //////////////////////////////////////////////
        // 4. 
        //////////////////////////////////////////////
        var typeBar = new Chart($('#divLibrariesStatsBarChart'), {
            type: 'horizontalBar',
            data: {
                labels: [''],
                datasets: [
                    {
                        data: [1],
                        backgroundColor: [],
                        hoverBackgroundColor: []
                    }]
            },
            options: {
                animation: {
                    animateScale: true
                }
            }
        });
        var updateLibTypeStatsBar = function (type) {
            var indices = {
                multiple: { title: 'Multiple', count: 0, value: 0 },
                income: { title: 'Income', count: 0, value: 0 },
                education: { title: 'Education', count: 0, value: 0 },
                health: { title: 'Health', count: 0, value: 0 },
                crime: { title: 'Crime', count: 0, value: 0 },
                environment: { title: 'Environment', count: 0, value: 0 }
            };
            var chartData = {
                labels: [],
                datasets: {
                    data: [],
                    backgroundColor: $.map(Object.keys(config.libStyles), function (x, y) {
                        return config.libStyles[x].colour;
                    }),
                    hoverBackgroundColor: $.map(Object.keys(config.libStyles), function (x, y) {
                        return config.libStyles[x].colour;
                    })
                }
            };
            $.each(Object.keys(authLibs).sort(), function (i, x) {
                $.each(authLibs[x].libraries, function (y, z) {
                    if (z.type == type || !type) {
                        indices.multiple = { title: indices.multiple.title, count: indices.multiple.count + 1, value: indices.multiple.value + parseInt(z['imd_decile']) };
                        indices.income = { title: indices.income.title, count: indices.income.count + 1, value: indices.income.value + parseInt(z['income_decile']) };
                        indices.education = { title: indices.education.title, count: indices.education.count + 1, value: indices.education.value + parseInt(z['education_decile']) };
                        indices.health = { title: indices.health.title, count: indices.health.count + 1, value: indices.health.value + parseInt(z['health_decile']) };
                        indices.crime = { title: indices.crime.title, count: indices.crime.count + 1, value: indices.crime.value + parseInt(z['crime_decile']) };
                        indices.environment = { title: indices.environment.title, count: indices.environment.count + 1, value: indices.environment.value + parseInt(z['environment_decile']) };
                    }
                });
            });
            $.each(Object.keys(indices), function (t, c) {
                chartData.labels.push(indices[c].title);
                chartData.datasets.data.push((indices[c].value / indices[c].count).toFixed(1));
            });
            typeBar.config.data.datasets[0] = chartData.datasets;
            typeBar.config.data.labels = chartData.labels;
            typeBar.update();
        };
        $.each(Object.keys(config.libStyles), function (i, x) {
            $('#selLibraryType').append($("<option></option>").attr("value", x).text(config.libStyles[x].type));
        });
        $('#selLibraryType').change(function () {
            updateLibTypeStatsBar($('#selLibraryType').find(":selected").val());
        });
        updateLibTypeStatsBar();


        /////////////////////////////////////////
        // 5. Find My Library
        ////////////////////////////////////////

        // EVENT: Postcode search
        $('#btnPostcodeSearch').on('click', function (e) {
            var pattern = new RegExp('^(([gG][iI][rR] {0,}0[aA]{2})|((([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y]?[0-9][0-9]?)|(([a-pr-uwyzA-PR-UWYZ][0-9][a-hjkstuwA-HJKSTUW])|([a-pr-uwyzA-PR-UWYZ][a-hk-yA-HK-Y][0-9][abehmnprv-yABEHMNPRV-Y]))) {0,}[0-9][abd-hjlnp-uw-zABD-HJLNP-UW-Z]{2}))$');
            var valid = pattern.test($('#txtPostcode').val());

            PublicLibrariesNews.searchByPostcode($('#txtPostcode').val(), function (data) {
                if (fmlMap == null) {
                    fmlMap = L.map('divFmlMap', { zoomControl: false }).setView([52.6, -2.5], 7);
                    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A', {
                        attribution: '&copy; <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    }).addTo(fmlMap);
                }

                // Get closest
                var closest = L.GeometryUtil.closest(fmlMap, PublicLibrariesNews.getLibraryLocations(), L.latLng(data.lat, data.lng), false);

                // Zoom to user location
                fmlMap.flyTo(L.latLng(data.lat, data.lng), 13);

                // Disable keyboard shortcuts when on the postcode text box.
                var disableKeyboard = function () { fmlMap.keyboard.disable(); };
                var enableKeyboard = function () { fmlMap.keyboard.enable(); };
                $('#txtPostcode').on('focus', disableKeyboard);
                $('#txtPostcode').off('focus', enableKeyboard);
            });
        });

        ////////////////////////////////////////////
        // ON LOAD: SHUFFLE
        ////////////////////////////////////////////
        setTimeout(function () {
            var Shuffle = window.shuffle;
            var element = document.getElementById('divGrid');
            shuffle = new Shuffle(element, { itemSelector: '.col' });
        }, 250);
    });
});