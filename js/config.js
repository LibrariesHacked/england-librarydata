var config = {
    mapBoxToken: 'pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesDark: 'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesLight: 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesStreets: 'https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapAttribution: '&copy; <a href="http://osm.org/copyright" target="blank" title="Open Street Map">OSM</a> contributors.  Contains: OS data &copy;, Royal Mail data &copy;, National Statistics data &copy;.  Crown copyright and database right 2016',
    libStyles: {
        LAL: { type: 'authority', description: '', cssClass: 'success', colour: '#5cb85c' },
        CL: { type: 'commissioned', description: '', cssClass: 'info', colour: '#5bc0de' },
        CRL: { type: 'community', description: '', cssClass: 'primary', colour: '#0275d8' },
        ICL: { type: 'independent', description: '', cssClass: 'gray-dark', colour: '#292b2c' },
        XLT: { type: 'temp closed', description: '', cssClass: 'warning', colour: '#f0ad4e' },
        XLR: { type: 'replaced', description: '', cssClass: 'muted', colour: '#636c72' },
        XL: { type: 'closed', description: '', cssClass: 'danger', colour: '#d9534f' }
    },
    depStatStyles: {
        1: 'danger',
        2: 'danger',
        3: 'danger',
        4: 'gray-dark',
        5: 'gray-dark',
        6: 'gray-dark',
        7: 'gray-dark',
        8: 'gray-dark',
        9: 'gray-dark',
        10: 'gray-dark',
    },
    markerPoints: { radius: 3, stroke: true, weight: 4, fill: true, fillColor: '#ccc', fillOpacity: 0.5, color: '#ccc', opacity: 0.7 },
    boundaryLines: {
        normal: { fillColor: "#38B44A", color: "#808080", weight: 1, opacity: 0.6, fillOpacity: 0.1 },
        selected: { fillColor: "#EFB73E", color: "#808080", weight: 2, opacity: 0.8, fillOpacity: 0.1 },
        nonselected: { fillColor: "#ccc", color: "#ccc", weight: 1, opacity: 0.3, fillOpacity: 0.1 },
        // sentiment analysis
        le: { fillColor: "#DF382C", color: "#DF382C", weight: 2, opacity: 0.7, fillOpacity: 0.1 },
        gl: { fillColor: "#772953", color: "#772953", weight: 2, opacity: 0.7, fillOpacity: 0.1 },
    },
    fillColours: {
        1: '#93C54B',
        2: '#F47C3C',
        3: '#F47C3C',
        4: '#93C54B',
        5: '#D9534F',
        6: '#29ABE0',
        7: '#29ABE0'
    }
};