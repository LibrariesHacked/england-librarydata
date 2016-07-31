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




    $('#ex1').slider({
        formatter: function (value) {
            return 'Current value: ' + value;
        }
    });

    // Load the initial set of data
    PublicLibrariesNews.loadData(3, function () {
        var local = PublicLibrariesNews.getStoriesGroupedByLocation('local');
        var changes = PublicLibrariesNews.getStoriesGroupedByLocation('changes');
        $.each(changes, function (i, o) {
            var size = ['small', 20];
            if (o.stories.length >= 5) size = ['medium', 30];
            if (o.stories.length >= 10) size = ['large', 40];
            var newsIcon = L.divIcon({ html: '<div><span>' + o.stories.length + '</span></div>', className: "marker-cluster marker-cluster-" + size[0], iconSize: new L.Point(size[1], size[1]) });
            var marker = L.marker([o.lat, o.lng], { icon: newsIcon });
            marker.stories = o.stories;
            marker.title = i;
            // Attach a click event to the marker.
            var markerClick = function (e) {
                $('#lstStories').empty();
                $('#h1Location').text(e.target.title);
                $.each(e.target.stories.reverse(), function () {
                    $('#lstStories').append('<h4>' + moment(this.date).fromNow() + '</h4><p>' + this.text + '</p>');
                });
                sidebar.open('stories');
            };
            marker.on('click', markerClick);
            marker.addTo(map);
            newsMarkers.push(marker);
        });
    });
});