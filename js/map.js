$(function () {
    /////////////////////////////////////////////////
    // Map
    // Initialise the map, set center, zoom, etc.
    /////////////////////////////////////////////////
    var map = L.map('map', { zoomControl: false }).setView([51.15, 2.72], 13);
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/librarieshacked.jefmk67b/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    //add zoom control with your options
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
});