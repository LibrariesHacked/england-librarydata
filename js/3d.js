$(function () {

    ////////////////////////////////////////////////////
    // Map - Initialise the map, set center, zoom, etc.
    ////////////////////////////////////////////////////
    mapboxgl.accessToken = 'pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A';
    var map = new mapboxgl.Map({
        container: 'threed-map',
        style: 'mapbox://styles/mapbox/light-v9',
        center: [config.mapcentre.x, config.mapcentre.y],
        zoom: 6,
        pitch: 40
    });

    /////////////////////////////////////////////////////////////
    // Initialise
    // Load the initial set of data
    /////////////////////////////////////////////////////////////
    LibrariesFuncs.loadData(3, true, true, true, true, function () {
        var authGeo = LibrariesFuncs.get3DAuthGeo();

        $.each(authGeo.features, function (i, f) {
            $('#sel-zoom-auth').append($("<option></option>").attr("value", f.properties.name).text(f.properties.name));
        });

        map.on('load', function () {
            map.addLayer({
                'id': 'auth-extrusion',
                'type': 'fill-extrusion',
                'source': {
                    'type': 'geojson',
                    'data': authGeo
                },
                'paint': {
                    'fill-extrusion-color': {
                        'property': 'librariescolour',
                        'type': 'identity'
                    },
                    'fill-extrusion-height': {
                        'property': 'librariesheight',
                        'type': 'identity'
                    },
                    'fill-extrusion-opacity': 0.5
                }
            });
			
			// Add zoom and rotation controls to the map.
			map.addControl(new mapboxgl.NavigationControl());

            map.addLayer({
                'id': 'auth-extrusion-hover',
                'type': 'fill-extrusion',
                'source': {
                    'type': 'geojson',
                    'data': authGeo
                },
                'paint': {
                    'fill-extrusion-color': {
                        'property': 'librariescolour',
                        'type': 'identity'
                    },
                    'fill-extrusion-height': {
                        'property': 'librariesheight',
                        'type': 'identity'
                    },
                    'fill-extrusion-opacity': 0.5
                },
                'filter': ['==', 'name', '']
            });

            $('#sel-height-indicator').on('change', function (e) {
                map.setPaintProperty('auth-extrusion', 'fill-extrusion-height', { 'property': e.target.value + 'height', 'type': 'identity' });
                map.setPaintProperty('auth-extrusion-hover', 'fill-extrusion-height', { 'property': e.target.value + 'height', 'type': 'identity' });
                //map.setPaintProperty('auth-extrusion', 'fill-extrusion-color', { 'property': e.target.value + 'colour', 'type': 'identity' });
            });

            $('#sel-zoom-auth').on('change', function (e) {
                $.each(authGeo.features, function (i, f) {
                    if (f.properties.name == e.target.value) map.flyTo({ center: f.geometry.coordinates[0][0], zoom: 9 });
                });
            });

            map.on('click', 'auth-extrusion', function (e) {
                var html = '<p><strong>' + e.features[0].properties.name + '</strong><p>';
                html += 'Libraries: ' + e.features[0].properties['libraries'];
                html += '<br/>Population per library: ' + e.features[0].properties['populationperlibrary'];
                html += '<br/>Area (ha) per library: ' + e.features[0].properties['areaperlibrary'];
                new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
            });

            map.on('mouseenter', 'auth-extrusion', function () {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'auth-extrusion', function () {
                map.getCanvas().style.cursor = '';
            });

            map.on('mousemove', 'auth-extrusion', function (e) {
                map.setFilter('auth-extrusion-hover', ['==', 'name', e.features[0].properties.name]);
            });

            map.on('mouseleave', 'auth-extrusion', function () {
                map.setFilter('auth-extrusion-hover', ['==', 'name', '']);
            });
        });
    });
});