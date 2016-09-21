$(function () {
    /////////////////////////////////////////////////
    // Map.  Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var map = L.map('divMiniMap', { zoomControl: false }).setView([52.6, -2.5], 6);
    var fmlMap = null;
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

        //////////////////////////////////////////////
        // 1. Library types by authority
        // 
        //////////////////////////////////////////////
        var typeDonut = new Chart($('#divLibrariesDonutChart'), {
            type: 'doughnut',
            data: {
                labels: $.map(Object.keys(config.libStyles), function (x, y) {
                    return config.libStyles[x].type;
                }),
                datasets: [
                    {
                        data: [],
                        backgroundColor: $.map(Object.keys(config.libStyles), function (x, y) {
                            return config.libStyles[x].colour;
                        }),
                        hoverBackgroundColor: $.map(Object.keys(config.libStyles), function (x, y) {
                            return config.libStyles[x].colour;
                        })
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
            typeDonut.config.data.datasets[0].data = [];
            $.each(Object.keys(config.libStyles), function (t, c) {
                typeDonut.config.data.datasets[0].data.push(PublicLibrariesNews.getCountLibrariesByAuthorityType(libAuthority, c));
            });
            typeDonut.update();
        };

        // Initially populate the library authorities select control.
        $.each(PublicLibrariesNews.getAuthorityListSorted(), function (i, x) { $('#selLibraryTypeAuthority').append($("<option></option>").attr("value", x).text(x)); });

        // Event: On changing the library authority, update the donut chart.
        $('#selLibraryTypeAuthority').change(function () { updateLibTypesDonut($('#selLibraryTypeAuthority').find(":selected").val()); });

        // Initially set the library types donut chart.
        updateLibTypesDonut();

        //////////////////////////////////////////////
        // 2. Widget: Library details by authority
        // 
        //////////////////////////////////////////////

        // Populate the authority control
        $.each(PublicLibrariesNews.getAuthorityListSorted(), function (i, x) { $('#selLibraryDetailsAuthority').append($("<option></option>").attr("value", x).text(x)); });

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

        // Event: On changing the library authority, update the library select chart.
        $('#selLibraryDetailsAuthority').change(function () {
            updateLibraryDetailsSelect($('#selLibraryDetailsAuthority').find(":selected").val());
        });

        // Event: On selecting a library, display that library's details.
        $('#selLibraryDetailsLibrary').change(function () {
            var libAuth = [$('#selLibraryDetailsLibrary').find(":selected").val(), $('#selLibraryDetailsAuthority').find(":selected").val()];
            if (libAuth[0] == '') return;
            var library = PublicLibrariesNews.getLibraryByAuthorityNameAndLibName(libAuth[1], libAuth[0]);
            $('#divLibraryDetails').empty();
            $('#divLibraryDetails').append('<h4>' + library.name + '</h4>');
            $('#divLibraryDetails').append('<small>' + (library.type ? config.libStyles[library.type].type : '') + '</small>');
            $('#divLibraryDetails').append('<p>' + (library.address ? '' : '') + '</p>');
            $('#divLibraryDetails').append('<p>' + (library.notes ? library.notes : '') + '</p>');
            shuffle.update();
        });

        /////////////////////////////////////////////////////////////////
        // 3/5. Widgets: Public Libraries News Local and changes stories
        // 
        /////////////////////////////////////////////////////////////////
        var locs = { changes: PublicLibrariesNews.locationsSortedByCount('changes'), local: PublicLibrariesNews.locationsSortedByCount('local') };
        var currentlyShowing = { changes: [0, 2], local: [0, 0] };
        var clickNextItem = function (e) {
            e.preventDefault();
            var type = e.currentTarget.id.substring(0, e.currentTarget.id.indexOf('Location'));
            var item = $(e.currentTarget.parentNode.parentNode);
            var authSt = PublicLibrariesNews.getStoriesGroupedByLocation(type)[$(item).data('auth')].stories;
            var index = $(item).data('current') + 1;
            if (index == authSt.length) index = 0;
            $(item).data('current', index);
            $(item).find('span').text((index + 1) + '/' + authSt.length);
            $(item).find('.list-group-item-text').html(authSt[index].text.replace($(item).data('auth') + ' – ', ''));
            shuffle.update();
        };
        var addLocation = function (type, index, position) {
            var it = PublicLibrariesNews.getStoriesGroupedByLocation(type)[locs[type][index]];
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
        // 4. Populate the mini map
        // 
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
                $.each(PublicLibrariesNews.getStoriesGroupedByLocation(type), function (i, o) {
                    var size = ['small', 20];
                    if (o.stories.length >= 5) size = ['medium', 30];
                    if (o.stories.length >= 10) size = ['large', 40];
                    var newsIcon = L.divIcon({ html: '<div><span>' + o.stories.length + '</span></div>', className: "marker-cluster marker-cluster-" + size[0], iconSize: new L.Point(size[1], size[1]) });

                    var popup = L.popup({ maxWidth: 160, maxHeight: 140, closeButton: false })
                        .setContent('<h5>' + i + '</h5>' + $.map(o.stories, function (s, i) { return s.text.replace(i + ' – ', '') }).join('<hr>'));
                    var marker = L.marker([o.lat, o.lng], { icon: newsIcon }).bindPopup(popup);
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
        // 6. Twitter
        // 
        //////////////////////////////////////////////




        /////////////////////////////////////////
        // 7. Find My Library
        ////////////////////////////////////////

        // EVENT: Postcode search
        $('#btnPostcodeSearch').on('click', function (e) {

            // Show spinner
            $('#spFmlSpinner').removeClass('fa-home');
            $('#spFmlSpinner').addClass('fa-spinner');

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

                $('#spFmlSpinner').removeClass('fa-spinner');
                $('#spFmlSpinner').addClass('fa-home');
            });
        });

        //////////////////////////////////////////////
        // 8.
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
            typeBar.config.data.datasets = $.map(Object.keys(config.libStyles), function (x, y) {
                var ind = PublicLibrariesNews.getDeprivationIndicesByAuthorityAndLibType(authority, x);
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
            });
            typeBar.update();
        };
        $.each(PublicLibrariesNews.getAuthorityListSorted(), function (i, x) { $('#selAreaStatsAuthority').append($("<option></option>").attr("value", x).text(x)); });
        $('#selAreaStatsAuthority').change(function () {
            updateLibTypeStatsBar($('#selAreaStatsAuthority').find(":selected").val());
        });
        updateLibTypeStatsBar();




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