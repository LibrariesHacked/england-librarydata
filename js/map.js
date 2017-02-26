$(function () {
    jQuery.fn.reverse = [].reverse;
    /////////////////////////////////////////////////
    // Map - Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var authBoundaries = null;
    var markerArray = L.layerGroup([]);
    var selectedAuth = '';
    var mapType = 1;
    var map = L.map('map').setView([52.55, -2.72], 7);
    L.tileLayer(config.mapTilesLight, { attribution: config.mapAttribution }).addTo(map);
    var sidebar = L.control.sidebar('sidebar', { position: 'right' }).addTo(map);
    map.addControl(sidebar);
    var legend = null;

    /////////////////////////////////////////////////////////
    // Helper Functions
    /////////////////////////////////////////////////////////

    // Function: numFormat
    var numFormat = function (num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num;
    };

    // Function: hexToRgb
    var hexToRgb = function (hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
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
        authBoundaries.setStyle(function (feature) {
            var style = config.boundaryLines.normal;
            if (selectedAuth != '' && feature.properties['authority_id'] != selectedAuth) return config.boundaryLines.nonselected;
            if (feature.properties['authority_id'] == selectedAuth && feature.properties['authority_id'] == 45) return config.boundaryLines.gl;
            if (feature.properties['authority_id'] == selectedAuth && feature.properties['authority_id'] == 71) return config.boundaryLines.le;
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

        if (legend != null) legend.remove();
        if (selectedAuth == '') {
            map.flyToBounds(authBoundaries.getBounds(), { paddingTopLeft: L.point(-150, 0) });
            legend = L.control({ position: 'bottomleft' });
            legend.onAdd = function (map) {
                var c = hexToRgb(config.fillColours[mapType]);
                var div = L.DomUtil.create('div', 'info legend');
                // loop through our density intervals and generate a label with a colored square for each interval
                div.innerHTML += '<p class="text-muted strong">' + $('#style-changer li a[data-style=' + mapType + ']').text() + '</p>';
                for (var i = 0; i <= 1; i = i + 0.2) div.innerHTML += '<i style="background: rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + i + ')"></i>' + (i == 0 ? 'fewer' : '') + (i == 1 ? 'lots' : '') + '<br/>';
                return div;
            };
            legend.addTo(map);
        }
    };

    /////////////////////////////////////////////////////////
    // Function: addLibrariesToMap
    /////////////////////////////////////////////////////////
    var addLibrariesToMap = function (libraries) {
        map.removeLayer(markerArray);
        markerArray.clearLayers();
        $.each(Object.keys(libraries), function (i, t) {
            var style = { radius: 5, stroke: true, color: config.libStyles[t].colour, fill: config.libStyles[t].colour };
            $.each(libraries[t].libs, function (x, lib) {
                if (lib.lat && lib.lng) {
                    var m = L.circleMarker([lib.lat, lib.lng], style);
                    m.on('click', function (e) { clickLibrary(lib); });
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
    var clickLibrary = function (library) {
        sidebar.close();
        var lib = LibrariesFuncs.getLibraryById(library.id);
        var displayLib = function () {
            map.off('moveend', displayLib);
            $('#liLibrary').removeClass('disabled');
            $('#sidebar-librarycontent').empty();
            $('#sidebar-librarycontent').append('<h3 class="text-' + config.libStyles[library.type].cssClass + '">' + library.name + '</h3>');
            // Display latest tweet
            var tweet = LibrariesFuncs.getLatestLibraryTweet(library.name);
            if (tweet) $('#sidebar-librarycontent').append('<div class="alert alert-dismissible alert-info"><strong>' + tweet[12] + '</strong> ' + tweet[11] + '</div>');

            $('#sidebar-librarycontent').append('<p>' +
                (library.type ? ('<span class="strong text-' + config.libStyles[library.type].cssClass + '">' + config.libStyles[library.type].type + '.</span> ') : '') +
                (library.replacement && library.replacement == 't' ? '<span class="strong text-muted"> replacement.</span> ' : '') +
                (library.address ? (' ' + library.address.toLowerCase() + '. ') : '') +
                (library.notes ? (' ' + library.notes.toLowerCase() + '. ') : '') +
                (library.opened_year ? ('opened in ' + library.opened_year + '. ') : '') +
                (library.closed ? ('closed in ' + library.closed_year + '. ') : '') +
                '</p>');
            if (library.email) $('#sidebar-librarycontent').append('<a href="mailto:' + library.email + '" target="_blank" class="btn btn-outline-info btn-sm"><span class="fa fa-envelope"></span>&nbsp;email</a> ');
            if (library.url) $('#sidebar-librarycontent').append('<a href="' + (library.url.indexOf('http') == -1 ? 'http://' + library.url : library.url) + '" target="_blank" class="btn btn-outline-info btn-sm"><span class="fa fa-external-link"></span>&nbsp;website</a>');
            // Populate the hours and statutory details
            $('#sidebar-librarycontent').append('<div class="row">' +
                '<div class="col col-xs-4"><small class="text-muted">statutory</small><p class="lead text-gray-dark">' + (library.statutory2016 == 't' ? 'yes' : 'no') + '</p></div>' +
                '<div class="col col-xs-4"><small class="text-muted">hours</small><p class="lead text-gray-dark">' + library.hours + '</p></div>' +
                '<div class="col col-xs-4"><small class="text-muted">staff hours</small><p class="lead text-gray-dark">' + library.staffhours + '</p></div>');
            // Populate the deprivation details.
            $('#sidebar-librarycontent').append('<div class="row">' +
                '<div class="col col-xs-4"><small class="text-muted">multiple</small><p class="lead text-gray-dark">' + library.multiple + '</p></div>' +
                '<div class="col col-xs-4"><small class="text-muted">employment</small><p class="lead text-gray-dark">' + library.employment + '</p></div>' +
                '<div class="col col-xs-4"><small class="text-muted">education</small><p class="lead text-gray-dark">' + library.education + '</p></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col col-xs-3"><small class="text-muted">adult skills</small><p class="lead text-gray-dark">' + library.adultskills + '</p></div>' +
                '<div class="col col-xs-3"><small class="text-muted">health</small><p class="lead text-gray-dark">' + library.health + '</p></div>' +
                '<div class="col col-xs-3"><small class="text-muted">services</small><p class="lead text-gray-dark">' + library.services + '</p></div></div>' +
                '<p><small class="text-muted strong">these are deprivation deciles (1-10) for the library location.  lower represents greater deprivation.</small></p>');
            sidebar.open('library');
        };
        map.on('moveend', displayLib);
        map.flyTo(L.latLng(library.lat, library.lng), 13);
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
            $('#authority .sidebar-title').text(feature.properties.name);
            $('#sidebar-authoritycontent').append('<div class="row"><div class="col-md-4"><small class="text-muted">population</small><p class="lead text-gray-dark">' + numFormat(feature.properties.population) + '</p></div><div class="col-md-4"><small class="text-muted">area (hectares)</small><p class="lead text-gray-dark">' + numFormat(feature.properties.hectares) + '</p></div><div class="col-md-4"><small class="text-muted">libraries</small><p class="lead text-gray-dark">' + numFormat(feature.properties.libraryCount) + '</p></div><//div>');

            // Display latest tweet
            var tweet = LibrariesFuncs.getLatestAuthorityTweet(feature.properties.name);
            if (tweet) $('#sidebar-authoritycontent').append('<div class="alert alert-dismissible alert-info"><a class="close" href="https://twitter.com/' + tweet[1] + '" target="_blank"><span class="fa fa-twitter"></span></a><strong>' + moment(tweet[12], 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').fromNow() + '</strong> ' + tweet[11] + '</div>');

            // Show libraries group by type
            $.each(Object.keys(feature.properties.libraries), function (i, k) {
                var type = $('<div>');
                var hd = $('<h5>', {
                    text: config.libStyles[k].type
                }).appendTo(type);
                var pa = $('<p>').appendTo(type);
                var sm = $('<small>').appendTo(pa);
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
            displayPLNStories('changes', feature.properties, 'changes');
            displayPLNStories('local', feature.properties, 'local news');
            sidebar.open('authority');
            setMapStyles();
        };
        map.on('moveend', displayAuthority);
        map.flyToBounds(layer.getBounds(), { paddingTopLeft: L.point(-150, 0) });
    };

    /////////////////////////////////////////////////////////////
    // INIT
    // Load the initial set of data
    /////////////////////////////////////////////////////////////
    LibrariesFuncs.loadData(3, true, true, true, true, function () {
        var authGeo = LibrariesFuncs.getAuthGeoWithStoriesAndLibraries();
        var onEachFeature = function (feature, layer) {
            layer.on('click', function (e) { clickAuth(e, feature, layer) });
        };
        // Now load in the authority boundaries 
        authBoundaries = new L.geoJson(null, { onEachFeature: onEachFeature });
        authBoundaries.bindTooltip(function (layer) { return layer.feature.properties.name; }).addTo(map);
        $(authGeo.features).each(function (key, data) { authBoundaries.addData(data); });
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
            sidebar.open('home');
            $('#style-changer li a:first').trigger('click');
        });

        /////////////////////////////////////////////////////////////
        // EVENT: Zoom out
        // On zooming out of the map at a certain level remove markers
        // and return to full UK state.
        /////////////////////////////////////////////////////////////
        map.on('zoomend', function () {
            if (markerArray.getLayers().length > 0 && map.getZoom() >= 9) map.addLayer(markerArray);
            if (markerArray.getLayers().length > 0 && map.getZoom() < 9) map.removeLayer(markerArray);
        });

        /////////////////////////////////////////////////////////////
        // EVENT: Change map style
        /////////////////////////////////////////////////////////////
        $('#style-changer li a').on('click', function (e) {
            e.preventDefault();
            $('#style-changer li a').removeClass('active');
            selectedAuth = '';
            $(e.target).addClass('active');
            mapType = e.target.dataset.style;
            setMapStyles();
        });
    });
});