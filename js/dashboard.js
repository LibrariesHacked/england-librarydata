$(function () {
    /////////////////////////////////////////////////
    // Map
    // Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var changesMarkers = [];
    var newsMarkers = [];
    var map = L.map('divMiniMap', { zoomControl: false }).setView([52.55, -2.72], 7);
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/librarieshacked.jefmk67b/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Load the initial set of data - for the dashboard start with 1 month
    PublicLibrariesNews.loadData(2, function () {
        var local = PublicLibrariesNews.getStoriesGroupedByLocation('local');
        var changes = PublicLibrariesNews.getStoriesGroupedByLocation('changes');

        //////////////////////////////////////////////
        // 1. Populate the changes
        //////////////////////////////////////////////
        var currentlyShowing = [0, 2];
        var locs = Object.keys(changes);
        locs.sort(function (a, b) {
            return changes[b].stories.length - changes[a].stories.length;
        });
        var addLocation = function (index, position) {
            var it = changes[locs[index]];
            var li = '<a href="#" class="list-group-item changes-list" data-current="0" data-auth="' + locs[index] + '"><span class="badge">1/' + it.stories.length + '</span><h4 class="list-group-item-heading">' + locs[index] + '</h5><p class="list-group-item-text">' + it.stories[0].text + '</p></a>';
            position == 'first' ? $('#divChangesCounts').prepend(li) : $('#divChangesCounts').append(li);
        };
        var removeLocation = function (position) {
            $('#divChangesCounts a:' + position).remove();
        };
        for (x = 0 ; x < 3; x++) addLocation(x, 'last');
        // Event: click on an individual item 
        $('.changes-list').on('click', function (event) {
            event.preventDefault();
            var item = $(event.currentTarget);
            var authSt = changes[$(item).data('auth')].stories;
            var index = $(item).data('current') + 1;
            if (index == authSt.length) index = 0;
            $(item).data('current', index);
            $(item).find('.list-group-item-text').text(authSt[index].text);
        });
        // Event: 
        $('#ulChangesSwitch a').on('click', function (event) {
            event.preventDefault();
            var incr = $(event.target).data('direction');
            if ((currentlyShowing[1] == locs.length - 1) || (currentlyShowing[0] == 0 && incr == -1)) return false;
            currentlyShowing[0] = currentlyShowing[0] + incr;
            currentlyShowing[1] = currentlyShowing[1] + incr;
            $('#ulChangesSwitch li').attr('class', '');
            if (currentlyShowing[0] == 0) $('#ulChangesSwitch li').first().attr('class', 'disabled');
            if (currentlyShowing[1] == locs.length - 1) $('#ulChangesSwitch li').last().attr('class', 'disabled');
            removeLocation((incr == 1 ? 'first' : 'last'));
            addLocation(incr == 1 ? currentlyShowing[1] : currentlyShowing[0], (incr == 1 ? 'last' : 'first'));
        });

        //////////////////////////////////////////////
        // 2. Populate the map
        //////////////////////////////////////////////
        var miniMapCurrent = 0;
        $.each(local, function (i, o) {
            var size = ['small', 20];
            if (o.stories.length >= 5) size = ['medium', 30];
            if (o.stories.length >= 10) size = ['large', 40];
            var newsIcon = L.divIcon({ html: '<div><span>' + o.stories.length + '</span></div>', className: "marker-cluster marker-cluster-" + size[0], iconSize: new L.Point(size[1], size[1]) });
            var marker = L.marker([o.lat, o.lng], { icon: newsIcon });
            marker.stories = o.stories;
            marker.title = i;
            // Attach a click event to the marker.
            var markerClick = function (e) {
                // Set the modal content
                $('#divMiniMapText').empty();
                $('#divMiniMapText').show(500);
                $.each(e.target.stories, function () {
                    var summary = this.text.substring(0, 100) + '&#8230;';
                    $('#divMiniMapText').append(summary);
                });
            };
            marker.on('click', markerClick);
            marker.addTo(map);
            newsMarkers.push(marker);
        });

        // 3. The stories line chart
        new Morris.Line({
            element: 'divStoriesLineChart',
            data: [
              { year: '2008', value: 20 },
              { year: '2009', value: 10 },
              { year: '2010', value: 5 },
              { year: '2011', value: 5 },
              { year: '2012', value: 20 }
            ],
            xkey: 'year',
            ykeys: ['value'],
            labels: ['Value']
        });
    });
});