$(function () {
    jQuery.fn.reverse = [].reverse;
    /////////////////////////////////////////////////
    // Map
    // Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var changesMarkers = [];
    var newsMarkers = [];
    var map = L.map('map', { zoomControl: false }).setView([52.55, -2.72], 7);
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/librarieshacked.jefmk67b/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    var sidebar = L.control.sidebar('sidebar').addTo(map);

    // Load the initial set of data
    PublicLibrariesNews.loadData(3, true, false, false, function () {
        var local = PublicLibrariesNews.getStoriesGroupedByLocation('local');
        var changes = PublicLibrariesNews.getStoriesGroupedByLocation('changes');
        var authGeo = PublicLibrariesNews.getAuthGeoWithStories();

        var onEachFeature = function (feature, layer) {
            layer.on('click', function (e) {
                $('#lstStories').empty();
                $('#h1Location').text(e.target.feature.properties.name);
                if (e.target.feature.properties.local) {
                    $.each(e.target.feature.properties.local.stories.reverse(), function () {
                        $('#lstStories').append('<h4>' + moment(this.date).fromNow() + '</h4><p>' + this.text + '</p>');
                    });
                }
                sidebar.open('stories');
            });
        };
        // Now load in the authority boundaries 
        var authBoundaries = new L.geoJson(null, {
            style: function (feature) {
                var style = { fillColor: "#ccc", color: "#ccc", weight: 1, opacity: 0.5, fillOpacity: 0.1 };
                if (feature.properties.local) {
                    if (feature.properties.local.stories.length > 2) style.fillOpacity = 0.2;
                    if (feature.properties.local.stories.length > 3) style.fillOpacity = 0.3;
                    if (feature.properties.local.stories.length > 4) style.fillOpacity = 0.4;
                    if (feature.properties.local.stories.length > 5) style.fillOpacity = 0.5;
                }
                return style;
            },
            onEachFeature: onEachFeature
        });
        authBoundaries.addTo(map);
        $(authGeo.features).each(function (key, data) {
            authBoundaries.addData(data);
        });
    });
});