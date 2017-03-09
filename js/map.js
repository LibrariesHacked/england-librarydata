﻿$(function () {

    ////////////////////////////////////////////////////
    // Map - Initialise the map, set center, zoom, etc.
    ////////////////////////////////////////////////////
    var markerArray = L.layerGroup([]);
    var authBoundaries = null;
    var selectedAuth = '';
    var map = L.map('map').setView([52.55, -2.72], 7);
    L.tileLayer(config.mapTilesLight, { attribution: config.mapAttribution }).addTo(map);
    var sidebar = L.control.sidebar('sidebar', { position: 'right' }).addTo(map);
    map.addControl(sidebar);
    var legend = null;
    var mapType = 1;

    /////////////////////////////////////////////////////////
    // Helper Functions
    /////////////////////////////////////////////////////////

    // Function: reverse
    // Additional reverse function for arrays
    jQuery.fn.reverse = [].reverse;

    // Function: hexToRgb
    // Converts a hex colour (e.g. 6699FF) to an RGB object.
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
            var style = { radius: 4, stroke: true, weight: 2, color: config.libStyles[t].colour, fill: true, fillColor: config.libStyles[t].colour };
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
                $('#sidebar-newscontent').append('<small><a href="http://www.publiclibrariesnews.com/' + this.url + '" target="_blank">Public Libraries News</a> ' + moment(this.date).fromNow() + '</small><p>' + this.text.replace(properties.name + ' – ', '') + '</p>');
            });
        }
    };

    /////////////////////////////////////////////////////////
    // Function: clickLibrary
    /////////////////////////////////////////////////////////
    var clickLibrary = function (library) {
        sidebar.close();
        //var lib = LibrariesFuncs.getLibraryById(library.id);
        var displayLib = function () {
            map.off('moveend', displayLib);
            $('#liLibrary').removeClass('disabled');
            $('#sidebar-librarycontent').empty();
            $('#library .sidebar-title').text(library.name);

            // Display latest tweet
            var tweet = LibrariesFuncs.getLatestLibraryTweet(library.name);
            if (tweet) $('#sidebar-librarycontent').append('<div id="divTweet" class="alert alert-dismissible alert-info"><strong>' + tweet[12] + '</strong> ' + tweet[11] + '</div>');
            $('#divTweet a').addClass('alert-link');
            $('#divTweet a').attr('target', '_blank');

            var libStyle = config.libStyles[library.type].cssClass;

            // Set up the library details such as closed/open year, type, and notes
            var libType = (library.type ? ('<span class="strong text-' + libStyle + '">' + config.libStyles[library.type].type + '</span>') : '');
            var replacement = (library.replacement && library.replacement == 't' ? ' <span class="strong text-muted">(replacement ' + library.opened_year + ')</span>' : '');
            var closed = (library.closed && library.closed_year ? (' <span class="strong text-danger">(' + library.closed_year) + ')</span>' : '');
            var notes = (library.notes ? '<p>' + library.notes + '</p>' : '');

            $('#sidebar-librarycontent').append('<p>' + libType + replacement + closed + '</p>' + notes);

            // Set up the links to email and website.
            $('#divLibraryLinks').append('<p>' +
                (library.email ? '<a href="mailto:' + library.email + '" target= "_blank" class="btn btn-secondary" title="email ' + library.name + '"> <span class="fa fa-envelope"></span> email</a > ' : '') +
                (library.url ? '<a href="' + (library.url.indexOf('http') == -1 ? 'http://' + library.url : library.url) + '" target="_blank" class="btn btn-secondary" title="go to ' + library.name + ' website"><span class="fa fa-external-link"></span>&nbsp;website</a>' : '') + '</p>'
            );

            // Populate the hours and statutory details
            $('#sidebar-librarycontent').append(
                '<div class="row">' +
                '<div class="col col-sm-4"><small class="text-muted">statutory&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="is the library part of the local authority statutory provision?"></a></small><p class="lead text-gray-dark">' + (library.statutory2016 == 't' ? 'yes' : 'no') + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">hours&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of hours open per week"></a></small><p class="lead text-gray-dark">' + (library.hours ? library.hours : '0') + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">staff hours&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of staff hours per week"></a></small><p class="lead ' + (library.staffhours && library.staffhours != 0 ? ('text-gray-dark">' + library.staffhours) : 'text-danger">0') + '</p>' +
                '</div>');

            // Populate the deprivation details.
            $('#sidebar-librarycontent').append(
                (library.address ? ('<small class="text-muted">catchment population and deprivation around ' + library.address + ' ' + library.postcode + '</small></p>') : '') +
                '<div class="row">' +
                '<div class="col col-sm-4"><small class="text-muted">population&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="total population in the library catchment (mid-2015 estimate)"></a></small><p class="lead text-' + config.depStatStyles[library.population] + '">' + LibrariesFuncs.getNumFormat(library.population) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">adults&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of adults 16 and over"></a></small><p class="lead text-' + config.depStatStyles[library.population_adults] + '">' + LibrariesFuncs.getNumFormat(parseInt(library.sixteen_fiftynine) + parseInt(library.over_sixty)) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">children&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="number of children under 16"></a></small><p class="lead text-' + config.depStatStyles[library.population_children] + '">' + LibrariesFuncs.getNumFormat(library.dependent_children) + '</p></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col col-sm-4"><small class="text-muted">multiple&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="a combination of deprivation measures to give an overall deprivation index"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.multiple).toFixed(0)] + '">' + parseFloat(library.multiple).toFixed(0) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">employmnt&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="employment deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.employment).toFixed(0)] + '">' + parseFloat(library.employment).toFixed(0) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">education&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="education deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.education).toFixed(0)] + '">' + parseFloat(library.education).toFixed(0) + '</p></div>' +
                '</div>' +
                '<div class="row">' +
                '<div class="col col-sm-4"><small class="text-muted">adult skills&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="adult skills and training deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.adultskills).toFixed(0)] + '">' + parseFloat(library.adultskills).toFixed(0) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">health&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="health deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.health).toFixed(0)] + '">' + parseFloat(library.health).toFixed(0) + '</p></div>' +
                '<div class="col col-sm-4"><small class="text-muted">services&nbsp;<a href="#" class="fa fa-info" data-toggle="tooltip" data-animation="false" title="geographical access to services deprivation for the library catchment"></a></small><p class="lead text-' + config.depStatStyles[parseFloat(library.services).toFixed(0)] + '">' + parseFloat(library.services).toFixed(0) + '</p></div>' +
                '</div>' +
                '<p><small class="text-muted">lower represents greater deprivation (1-10).</small></p>');
            sidebar.open('library');
        };
        map.on('moveend', displayLib);
        map.flyTo(L.latLng(library.lat, library.lng), 15);
    };

    /////////////////////////////////////////////////////////
    // Function: clickAuth
    /////////////////////////////////////////////////////////
    var clickAuth = function (e, feature, layer) {
        sidebar.close();
        var displayAuthority = function () {

            var auth = LibrariesFuncs.getAuthorityByName(feature.properties.name);

            map.off('moveend', displayAuthority);
            selectedAuth = feature.properties['authority_id'];
            $('#liAuthority').removeClass('disabled');
            $('#sidebar-authoritycontent').empty();

            // Show authority details
            $('#authority .sidebar-title').text(feature.properties.name);
            $('#sidebar-authoritycontent').append(
                '<div class="row">' +
                '<div class="col-md-4"><small class="text-muted">population</small><p class="lead text-gray-dark">' + LibrariesFuncs.getNumFormat(auth.population) + '</p></div>' +
                '<div class="col-md-4"><small class="text-muted">area (hectares)</small><p class="lead text-gray-dark">' + LibrariesFuncs.getNumFormat(auth.hectares) + '</p></div>' +
                '<div class="col-md-4"><small class="text-muted">libraries</small><p class="lead text-gray-dark">' + LibrariesFuncs.getNumFormat(feature.properties.libraryCount) + '</p></div>' +
                '<//div>');

            // Display latest tweet
            var tweet = LibrariesFuncs.getLatestAuthorityTweet(feature.properties.name);
            if (tweet) {
                var tw = '<div id="divTweet" class="alert alert-info mb-3"><div class="row">' +
                '<div class="stats col-sm-4"><small class="text-muted">tweets</small><p class="lead"><strong>' + LibrariesFuncs.getNumFormat(tweet.tweets) + '</strong></p></div>' +
                '<div class="stats col-sm-4"><small class="text-muted">followers</small><p class="lead"><strong>' + LibrariesFuncs.getNumFormat(tweet.followers) + '</strong></p></div>' +
                '<div class="stats col-sm-4"><small class="text-muted">following</small><p class="lead"><strong>' + LibrariesFuncs.getNumFormat(tweet.following) + '</strong></p></div>' +
                '</div>' +
                '<p>' + moment(tweet.latestDate, 'dd MMM DD HH:mm:ss ZZ YYYY', 'en').fromNow() + ': ' + $('<div/>').html(twttr.txt.autoLink(tweet.latest)).html() + '</p></div>';
                $('#sidebar-authoritycontent').append(tw);
                $('#divTweet a').addClass('alert-link');
            }

            // Show libraries group by type
            $.each(Object.keys(config.libStyles), function (i, k) {
                if (feature.properties.libraries[k]) {
                    var type = $('<div>');
                    var hd = $('<h5>', { text: config.libStyles[k].type }).appendTo(type);
                    var pa = $('<p>').appendTo(type);
                    var sm = $('<small>').appendTo(pa);
                    $.each(feature.properties.libraries[k].libs, function (x, l) {
                        $(sm).append((x + 1) + '. ');
                        $('<a>', {
                            text: l.name,
                            title: l.name,
                            href: '#',
                            class: 'text-' + config.libStyles[l.type].cssClass,
                            click: function () { clickLibrary(l); return false; }
                        }).appendTo(sm);
                        $(sm).append(' ');
                    });
                    $('#sidebar-authoritycontent').append(type);
                }
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