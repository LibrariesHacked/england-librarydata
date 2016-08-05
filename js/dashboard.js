$(function () {
    /////////////////////////////////////////////////
    // Map.  Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var map = L.map('divMiniMap', { zoomControl: false }).setView([52.6, -2.5], 7);
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/librarieshacked.jefmk67b/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Load the initial set of data - for the dashboard start with 1 month
    PublicLibrariesNews.loadData(2, function () {
        var data = { 'local': PublicLibrariesNews.getStoriesGroupedByLocation('local'), 'changes': PublicLibrariesNews.getStoriesGroupedByLocation('changes') }

        //////////////////////////////////////////////
        // 1. Populate the changes and local stories
        //////////////////////////////////////////////
        var locs = { 
            changes: PublicLibrariesNews.locationsSortedByCount('changes'), 
            local: PublicLibrariesNews.locationsSortedByCount('local')
        };
        var currentlyShowing = {
            changes: [0, 2],
            local: [0, 0]
        };
        var clickListItem = function (e) {
            e.preventDefault();
            var type = e.currentTarget.id.substring(0, e.currentTarget.id.indexOf('Location'));
            var item = $(e.currentTarget);
            var authSt = data[type][$(item).data('auth')].stories;
            var index = $(item).data('current') + 1;
            if (index == authSt.length) index = 0;
            $(item).data('current', index);
            $(item).find('span').text((index + 1) + '/' + authSt.length);
            $(item).find('.list-group-item-text').text(authSt[index].text);
        };
        var addLocation = function (type, index, position) {

            var it = data[type][locs[type][index]];
            var li = '<a href="#" id="' + type + 'Location' + index + '" class="list-group-item ' + type + '-list" data-current="0" data-auth="' + locs[type][index] + '"><span class="badge">1/' + it.stories.length + '</span><h4 class="list-group-item-heading">' + locs[type][index] + '</h5><p class="list-group-item-text">' + $('<div/>').html(it.stories[0].text).text() + '</p></a>';
            position == 'first' ? $('#' + type + 'Counts').prepend(li) : $('#' + type + 'Counts').append(li);
            $('#' + type + 'Location' + index).on('click', clickListItem);
        };
        var removeLocation = function (type, position) {
            $('#' + type + 'Counts a:' + position).remove();
        };
        var clickShiftChangeItems = function (e) {
            e.preventDefault();
            var id = e.currentTarget.parentNode.parentNode.id;
            var type = id.substring(0, id.indexOf('Switch'));
            var incr = $(e.target).data('direction');
            if ((currentlyShowing[type][1] == locs[type].length - 1) || (currentlyShowing[type][0] == 0 && incr == -1)) return false;
            currentlyShowing[type][0] = currentlyShowing[type][0] + incr;
            currentlyShowing[type][1] = currentlyShowing[type][1] + incr;
            $('#' + type + 'Switch li').attr('class', '');
            if (currentlyShowing[type][0] == 0) $('#ul' + type + 'Switch li').first().attr('class', 'disabled');
            if (currentlyShowing[type][1] == locs.length - 1) $('#' + type + 'Switch li').last().attr('class', 'disabled');
            removeLocation(type, (incr == 1 ? 'first' : 'last'));
            addLocation(type, incr == 1 ? currentlyShowing[type][1] : currentlyShowing[type][0], (incr == 1 ? 'last' : 'first'));
        };
        $('ul.page-story-list li a').on('click', clickShiftChangeItems);
        // Initial setup: 3 items.
        for (x = 0 ; x < 1; x++) addLocation('local', x, 'last');
        for (x = 0 ; x < 3; x++) addLocation('changes', x, 'last');

        //////////////////////////////////////////////
        // 2. Populate the mini map
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
                $.each(data[type], function (i, o) {
                    var size = ['small', 20];
                    if (o.stories.length >= 5) size = ['medium', 30];
                    if (o.stories.length >= 10) size = ['large', 40];
                    var newsIcon = L.divIcon({ html: '<div><span>' + o.stories.length + '</span></div>', className: "marker-cluster marker-cluster-" + size[0], iconSize: new L.Point(size[1], size[1]) });
                    var marker = L.marker([o.lat, o.lng], { icon: newsIcon });
                    marker.stories = o.stories;
                    marker.title = i;
                    var markerClick = function (e) {
                    };
                    marker.on('click', markerClick);
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