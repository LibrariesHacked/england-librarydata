﻿$(function () {
    jQuery.fn.reverse = [].reverse;
    /////////////////////////////////////////////////
    // Map - Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var authBoundaries = null;
    var markerArray = L.layerGroup([]);
    var selectedAuth = '';
    var mapType = 1;
    var map = L.map('map').setView([52.55, -2.72], 7);
    L.tileLayer(config.mapTilesLight, {
        attribution: config.mapAttribution
    }).addTo(map);
    var sidebar = L.control.sidebar('sidebar', { position: 'right' }).addTo(map);
    map.addControl(sidebar);
    L.control.locate().addTo(map);

    /////////////////////////////////////////////////////////
    // Helper Function: numFormat
    /////////////////////////////////////////////////////////
    var numFormat = function (num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num;
    };

    /////////////////////////////////////////////////////////
    // Function setMapStyles
    // Sets the styles of the map.
    // Map shading options
    // 1. Number of libraries
    // 2. Libraries per population
    // 3. Libraries per area
    // 4. Closed libraries
    // 5. Local news stories (PLN)
    // 6. Changes (PLN)
    /////////////////////////////////////////////////////////
    var setMapStyles = function () {
        if (selectedAuth == '') map.flyToBounds(authBoundaries.getBounds(), { paddingTopLeft: L.point(-350, 0) });
        authBoundaries.setStyle(function (feature) {
            var style = config.boundaryLines.normal;
            if (selectedAuth != '' && feature.properties['authority_id'] != selectedAuth) return config.boundaryLines.nonselected;
            if (feature.properties['authority_id'] == selectedAuth && feature.properties['authority_id'] == 71) return config.boundaryLines.le;
            if (feature.properties['authority_id'] == selectedAuth && feature.properties['authority_id'] == 45) return config.boundaryLines.gl;
            if (feature.properties['authority_id'] == selectedAuth) return config.boundaryLines.selected;
            style.fillColor = config.fillColours[mapType];
            if (mapType == 1) style.fillOpacity = feature.properties['pcLibraries'].toFixed(1);
            if (mapType == 2) style.fillOpacity = feature.properties['pcLibrariesPerPopulation'].toFixed(1);
            if (mapType == 3) style.fillOpacity = feature.properties['pcLibrariesPerArea'].toFixed(1);
            if (mapType == 4) style.fillOpacity = feature.properties['pcLalLibraries'].toFixed(1);
            if (mapType == 5) style.fillOpacity = feature.properties['pcClosedLibraries'].toFixed(1);
            if (mapType == 6) style.fillOpacity = feature.properties['pcLocalNews'].toFixed(1);
            if (mapType == 7) style.fillOpacity = feature.properties['pcChanges'].toFixed(1);
            return style;
        });
    };

    /////////////////////////////////////////////////////////
    // Function: addLibrariesToMap
    /////////////////////////////////////////////////////////
    var addLibrariesToMap = function (libraries) {
        map.removeLayer(markerArray);
        markerArray.clearLayers();
        $.each(Object.keys(libraries), function (i, t) {
            var style = { radius: 4, stroke: true, color: config.libStyles[t].colour };
            $.each(libraries[t].libs, function (x, lib) {
                if (lib.lat && lib.lng) {
                    var m = L.circleMarker([lib.lat, lib.lng], style);
                    m.on('click', function (e) {
                        clickLibrary(lib);
                    });
                    m.bindTooltip(lib.name, {});
                    markerArray.addLayer(m);
                }
            });
        });
        map.addLayer(markerArray);
    };

    /////////////////////////////////////////////////////////
    // Function: displayPLNStories
    // For a feature (authority) - displays the PLN stories
    // into the sidebar.
    /////////////////////////////////////////////////////////
    var displayPLNStories = function (type, properties, header) {
        if (properties[type]) {
            $('#liNews').removeClass('disabled');
            $('#sidebar-newscontent').append('<hr>');
            var st = properties[type].stories.slice();
            $('#sidebar-newscontent').append('<h4>' + header + '</h4>');
            $.each(st.reverse(), function () {
                $('#sidebar-newscontent').append('<small>' + moment(this.date).fromNow() + '</small><p>' + this.text.replace(properties.name + ' – ', '') + '</p>');
            });
        }
    };

    /////////////////////////////////////////////////////////
    // Function: clickLibrary
    /////////////////////////////////////////////////////////
    var clickLibrary = function (lib) {
        sidebar.close();

        var displayLib = function () {
            map.off('moveend', displayLib);
            $('#liLibrary').removeClass('disabled');
            $('#sidebar-librarycontent').empty();
            $('#sidebar-librarycontent').append('<h3 class="text-' + config.libStyles[lib.type].cssClass + '">' + lib.name + '</h3>');

            // Display latest tweet
            var tweet = PublicLibrariesNews.getLatestLibraryTweet(lib.name);
            if (tweet) {
                $('#sidebar-librarycontent').append('<div class="alert alert-dismissible alert-info"><strong>' + tweet[12] + '</strong> ' + twitter[11] + '</div>');
            }

            $('#sidebar-librarycontent').append('<p>' + config.libStyles[lib.type].type + '<br/>Address' + lib.postcode + '<br/></p>');
            if (lib.closed == 't') $('#sidebar-librarycontent').append('<p class="text-danger">Library closed ' + lib.closed_year + '</p>');

            sidebar.open('library');
        };
        map.on('moveend', displayLib);
        map.flyTo(L.latLng(lib.lat, lib.lng), 13);
    };

    /////////////////////////////////////////////////////////
    // Function: clickAuth
    /////////////////////////////////////////////////////////
    var clickAuth = function (e, feature, layer) {
        sidebar.close();
        var displayAuthority = function () {
            map.off('moveend', displayAuthority);
            selectedAuth = feature.properties['authority_id'];
            $('#liAuthority').removeClass('disabled');
            $('#sidebar-authoritycontent').empty();

            // Show authority details
            $('#sidebar-authoritycontent').append('<h4>' + feature.properties.name + '</h4>');
            $('#sidebar-authoritycontent').append('<div class="row"><div class="col col-md-4"><p class="lead text-info strong">' + numFormat(feature.properties.population) + ' people</p></div><div class="col col-md-4"><p class="lead text-warning strong">' + numFormat(feature.properties.hectares) + ' hectares</p></div><div class="col col-md-4"><p class="lead text-success strong">' + numFormat(feature.properties.libraryCount) + ' libraries</p></div><//div>');

            // Display latest tweet
            var tweet = PublicLibrariesNews.getLatestAuthorityTweet(feature.properties.name);
            if (tweet) {
                $('#sidebar-authoritycontent').append('<div class="alert alert-dismissible alert-info"><a class="close" href="' + '' + '" target="_blank"><span class="fa fa-twitter"></span></a><strong>' + moment(tweet[12], 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').fromNow() + '</strong> ' + tweet[11] + '</div>');
            }

            // Show libraries group by type
            $.each(Object.keys(feature.properties.libraries), function (i, k) {
                var type = $('<div>');
                var hd = $('<h6>', {
                    text: config.libStyles[k].type
                }).appendTo(type);
                var sm = $('<small>').appendTo(type);
                $.each(feature.properties.libraries[k].libs, function (x, l) {
                    $(sm).append((x + 1) + '. ');
                    $('<a>', {
                        text: l.name,
                        title: l.name,
                        href: '#',
                        'class': 'text-' + config.libStyles[l.type].cssClass,
                        click: function () {
                            clickLibrary(l);
                            return false;
                        }
                    }).appendTo(sm);
                    $(sm).append(' ');
                });
                $('#sidebar-authoritycontent').append(type);
            });
            addLibrariesToMap(feature.properties.libraries);
            $('#sidebar-newscontent').empty();
            $('#liNews').addClass('disabled');
            displayPLNStories('changes', feature.properties, 'Changes');
            displayPLNStories('local', feature.properties, 'Local news');
            sidebar.open('authority');
            setMapStyles();
        };

        map.on('moveend', displayAuthority);
        map.flyToBounds(layer.getBounds(), { paddingTopLeft: L.point(-350, 0) });
    };

    /////////////////////////////////////////////////////////////
    // INIT
    // Load the initial set of data
    /////////////////////////////////////////////////////////////
    PublicLibrariesNews.loadData(3, true, false, true, true, function () {
        var authGeo = PublicLibrariesNews.getAuthGeoWithStoriesAndLibraries();
        var onEachFeature = function (feature, layer) {
            layer.on('click', function (e) {
                clickAuth(e, feature, layer)
            });
        };
        // Now load in the authority boundaries 
        authBoundaries = new L.geoJson(null, {
            onEachFeature: onEachFeature
        });
        authBoundaries.addTo(map);
        $(authGeo.features).each(function (key, data) {
            authBoundaries.addData(data);
        });
        setMapStyles();

        sidebar.open('home');

        /////////////////////////////////////////////////////////////
        // EVENT: Home
        // Go to home page
        /////////////////////////////////////////////////////////////
        $('#liHome').on('click', function (e) {
            e.preventDefault();
            window.location.href = '/';
        });

        /////////////////////////////////////////////////////////////
        // EVENT: Reset map
        // Reset the map
        /////////////////////////////////////////////////////////////
        $('#liReset').on('click', function (e) {
            e.preventDefault();
            $('#style-changer li a:first').trigger('click');
            sidebar.open('home');
        });

        /////////////////////////////////////////////////////////////
        // EVENT: Zoom out
        // On zooming out of the map at a certain level remove markers
        // and return to full UK state.
        /////////////////////////////////////////////////////////////
        map.on('zoomend', function () {
            if (markerArray.getLayers().length > 0 && map.getZoom() < 9) {
                map.removeLayer(markerArray);
            }
            if (markerArray.getLayers().length > 0 && map.getZoom() >= 9) {
                map.addLayer(markerArray);
            }
        });

        /////////////////////////////////////////////////////////////
        // EVENT: 
        // 
        /////////////////////////////////////////////////////////////
        $('#style-changer li a').on('click', function (e) {
            selectedAuth = '';
            $('#style-changer li').removeClass('active');
            $(e.target.parentElement).addClass('active')
            e.preventDefault();
            mapType = e.target.dataset.style;
            setMapStyles();
        });
    });
});