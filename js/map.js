$(function () {
    jQuery.fn.reverse = [].reverse;
    /////////////////////////////////////////////////
    // Map - Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var authBoundaries = null;
    var libraries = null;
    var markerArray = L.layerGroup([]);
    var selectedAuth = '';
    var style = 1;
    var map = L.map('map', { zoomControl: false }).setView([52.55, -2.72], 7);
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/librarieshacked.jefmk67b/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors.  Contains OS data &copy; Crown copyright and database right 2016.  Contains Royal Mail data &copy; Royal Mail copyright and Database right 2016.  Contains National Statistics data &copy; Crown copyright and database right 2016.'
    }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    var sidebar = L.control.sidebar('sidebar', {
        position: 'left'
    });
    map.addControl(sidebar);

    /////////////////////////////////////////////////////////
    // Function setMapStyles
    // Sets the styles of the map.
    // Map shading options
    // 1. All Libraries per population
    // 2. All libraries
    // 3. Local news stories (PLN)
    // 4. Changes (PLN)
    /////////////////////////////////////////////////////////
    var setMapStyles = function () {
        authBoundaries.setStyle(function (feature) {
            if (feature.properties['authority_id'] == selectedAuth) return { color: "#ccc", fillColor: '#fff', weight: 3, opacity: 1  };
            var style = { fillColor: "#ccc", color: "#ccc", weight: 1, opacity: 0.5, fillOpacity: 0.1 };
            var libKeys = Object.keys(libraries);
            libKeys.sort(function (a, b) {
                return libraries[a].length - libraries[b].length;
            });
            var position = libKeys.indexOf(String(feature.properties['authority_id']));
            var med = (position / libKeys.length) / 2;
            style.fillOpacity = med.toFixed(1);
            return style;
        });
    };

    /////////////////////////////////////////////////////////
    // Function: addLibrariesToMap
    /////////////////////////////////////////////////////////
    var addLibrariesToMap = function (libraries) {
        map.removeLayer(markerArray);
        markerArray.clearLayers();
        $.each(libraries, function (x, lib) {
            var style = { radius: 4, stroke: true, color: '#6699FF' };
            if (lib.closed == 't') style.color = 'red';

            markerArray.addLayer(L.circleMarker([lib.lat, lib.lng], style).on('click', function (e) {
                clickLibrary(lib);
            }));
        });
        map.addLayer(markerArray);
    };

    /////////////////////////////////////////////////////////
    // Function: clickLibrary
    /////////////////////////////////////////////////////////
    var clickLibrary = function (lib) {
        map.flyTo(L.latLng(lib.lat, lib.lng), 17);
    };

    /////////////////////////////////////////////////////////
    // Function: displayPLNStories
    // For a feature (authority) - displays the PLN stories
    // into the sidebar.
    /////////////////////////////////////////////////////////
    var displayPLNStories = function (type, properties, header) {
        if (properties[type]) {
            $('#sidebar').append('<hr>');
            var st = properties[type].stories;
            $('#sidebar').append('<h4>' + header + '</h4>');
            $.each(st.reverse(), function () {
                $('#sidebar').append('<small>' + moment(this.date).fromNow() + '</small><p>' + this.text + '</p>');
            });
        }
    };

    /////////////////////////////////////////////////////////
    // Function: clickAuth
    /////////////////////////////////////////////////////////
    var clickAuth = function (e, feature, layer) {
        map.flyToBounds(layer.getBounds(), { paddingTopLeft: L.point(400, 0) });
        selectedAuth = feature.properties['authority_id'];
        $('#sidebar').empty();
        // Show authority details
        $('#sidebar').append('<h3>' + feature.properties.name + '</h3>');
        $('#sidebar').append('<small>' + feature.properties.type + '.  Population: .  Area: ' + feature.properties.hectares + '</small>');
        $('#sidebar').append('<hr>');
        // Show libraries group by type
        $('#sidebar').append('<h4>Libraries</h4>');
        var libs = {
            'LAL': { libs: [], type: 'Local authority run', description: '' },
            'CRL': { libs: [], type: 'Community run', description: '' },
            'ICL': { libs: [], type: 'Independent community', description: '' },
            'CL': { libs: [], type: 'Commissioned', description: '' },
            '': { libs: [], type: 'Closed', description: '' }
        };
        $.each(libraries[feature.properties['authority_id']], function (i, lib) {
            libs[lib.type].libs.push(lib);
        });
        $.each(Object.keys(libs), function (i, k) {
            if (libs[k].libs.length > 0) {
                var type = $('<div>');
                var hd = $('<h5>', {
                    text: libs[k].type
                }).appendTo(type);

                $.each(libs[k].libs, function (x, l) {
                    var cssClass = 'success';
                    if (l.type == 'CL') cssClass = 'primary';
                    if (l.type == 'CRL') cssClass = 'warning';
                    if (l.type == 'ICL') cssClass = 'default';
                    if (l.closed == 't') cssClass = 'danger';
                    $('<a>', {
                        text: l.name,
                        title: l.name,
                        href: '#',
                        'class': 'btn btn-xs btn-' + cssClass + ' btn-libs',
                        click: function () {
                            clickLibrary(l);
                            return false;
                        }
                    }).appendTo(type);
                });
                $('#sidebar').append(type);
            }
        });
        addLibrariesToMap(libraries[feature.properties['authority_id']]);
        displayPLNStories('changes', feature.properties, 'Changes');
        displayPLNStories('local', feature.properties, 'Local news');
        sidebar.show();
        setMapStyles();
    };

    /////////////////////////////////////////////////////////////
    // INIT
    // Load the initial set of data
    /////////////////////////////////////////////////////////////
    PublicLibrariesNews.loadData(3, true, false, true, function () {
        var authGeo = PublicLibrariesNews.getAuthGeoWithStories();
        libraries = PublicLibrariesNews.getLibrariesByAuthority();
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
    });
});