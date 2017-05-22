var config = {
    mapcentre: {
        x: -2.5,
        y: 52.55,
        zoom: 7
    },
    mapBoxToken: 'pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesDark: 'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesLight: 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesStreets: 'https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapAttribution: '&copy; <a href="http://osm.org/copyright" target="blank" title="Open Street Map">OSM</a> contributors.  Contains: OS data &copy;, Royal Mail data &copy;, National Statistics data &copy;.  Crown copyright and database right 2016',
    libStyles: {
        LAL: { type: 'authority', description: 'local authority library', cssClass: 'success', colour: '#4CAF50', r: '76', g: '175', b: '80' },
        CL: { type: 'commissioned', description: 'commissioned library', cssClass: 'info', colour: '#9C27B0', r: '156', g: '39', b: '176' },
        CRL: { type: 'community', description: 'community-run library', cssClass: 'primary', colour: '#2196F3', r: '33', g: '150', b: '243' },
        ICL: { type: 'independent', description: 'independent community library', cssClass: 'gray-dark', colour: '#292b2c', r: '41', g: '43', b: '44' },
        XLT: { type: 'temp closed', description: 'library temporarily closed', cssClass: 'warning', colour: '#FF9800', r: '255', g: '152', b: '0' },
        XLR: { type: 'replaced', description: 'library closed and replaced', cssClass: 'muted', colour: '#636c72', r: '99', g: '108', b: '114' },
        XL: { type: 'closed', description: 'closed library', cssClass: 'danger', colour: '#E51C23', r: '229', g: '28', b: '35' },
        X: { type: 'closed', description: 'closed library', cssClass: 'danger', colour: '#E51C23', r: '229', g: '28', b: '35' }
    },
    depStatStyles: {
        1: 'danger',
        2: 'danger',
        3: 'danger',
        4: 'muted',
        5: 'muted',
        6: 'muted',
        7: 'muted',
        8: 'muted',
        9: 'muted',
        10: 'muted'
    },
    markerPoints: { radius: 4, stroke: true, weight: 3, fill: true, fillColor: '#ccc', fillOpacity: 0.5, color: '#ccc', opacity: 0.7 },
    boundaryLines: {
        normal: { fillColor: "#38B44A", color: "#808080", weight: 1, opacity: 0.6, fillOpacity: 0.1 },
        selected: { fillColor: "#EFB73E", color: "#808080", weight: 2, opacity: 0.8, fillOpacity: 0.1 },
        nonselected: { fillColor: "#ccc", color: "#ccc", weight: 0, opacity: 0.0, fillOpacity: 0.0 },
        // sentiment analysis
        le: { fillColor: "#DF382C", color: "#DF382C", weight: 2, opacity: 0.7, fillOpacity: 0.1 },
        gl: { fillColor: "#772953", color: "#772953", weight: 2, opacity: 0.7, fillOpacity: 0.1 }
    },
    oaLines: {
        normal: { fillColor: "#d9534f", color: "#d9534f", weight: 2, opacity: 0.6, fillOpacity: 0 }
    },
    libCircle: { radius: 5, stroke: true, weight: 2, color: '#ffffff', fill: true, fillColor: '#ccc', opacity: 1, fillOpacity: 1 },
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

// Array: Get sum of values in an array
Array.prototype.sum = function () {
    var total = 0;
    for (var i = 0; i < this.length; i++) {
        total += parseFloat(this[i]);
    }
    return total;
};