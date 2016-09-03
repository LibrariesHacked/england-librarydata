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
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors.  Contains OS data &copy; Crown copyright and database right 2016.  Contains Royal Mail data &copy; Royal Mail copyright and Database right 2016.  Contains National Statistics data &copy; Crown copyright and database right 2016.'
    }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    var sidebar = L.control.sidebar('sidebar', {
        position: 'left'
    });
    map.addControl(sidebar);

    // Load the initial set of data
    PublicLibrariesNews.loadData(3, true, false, true, function () {
        var local = PublicLibrariesNews.getStoriesGroupedByLocation('local');
        var changes = PublicLibrariesNews.getStoriesGroupedByLocation('changes');
        var authGeo = PublicLibrariesNews.getAuthGeoWithStories();
        var libraries = PublicLibrariesNews.getLibrariesByAuthority();
        var onEachFeature = function (feature, layer) {
            layer.on('click', function (e) {
                $('#sidebar').empty();

                // Show authority details
                $('#sidebar').append('<h3>' + feature.properties.name + '</h3>');
                $('#sidebar').append('<small>' + feature.properties.type + '.  Population: .  Area: ' + feature.properties.hectares + '</small>');
                $('#sidebar').append('<hr>');
                // Show libraries
                $('#sidebar').append('<h4>Libraries</h4><table>');
                $.each(libraries[feature.properties['authority_id']], function (i, lib) {
                    $('#sidebar').append('<tr><td>' + lib.name + '</td></tr>');
                });
                $('#sidebar').append('</table>');

                $('#sidebar').append('<hr>');
                // Show changes
                if (e.target.feature.properties.changes) {
                    $('#sidebar').append('<h4>Changes</h4>');
                    var changes = e.target.feature.properties.changes.stories;
                    $.each(changes.reverse(), function () {
                        $('#sidebar').append('<small>' + moment(this.date).fromNow() + '</small><p>' + this.text + '</p>');
                    });
                    $('#sidebar').append('<hr>');
                }
                // Show local
                if (e.target.feature.properties.local) {
                    var loc = e.target.feature.properties.local.stories;
                    $('#sidebar').append('<h4>Local news</h4>');
                    $.each(loc.reverse(), function () {
                        $('#sidebar').append('<small>' + moment(this.date).fromNow() + '</small><p>' + this.text + '</p>');
                    });
                }
                sidebar.show();
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