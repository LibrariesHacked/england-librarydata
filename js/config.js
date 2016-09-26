var config = {
    mapTilesDark: 'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesLight: 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesStreets: 'https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapAttribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors.  Contains OS data &copy; Crown copyright and database right 2016.  Contains Royal Mail data &copy; Royal Mail copyright and Database right 2016.  Contains National Statistics data &copy; Crown copyright and database right 2016.',
    libStyles: {
        LAL: { type: 'Local authority', description: '', cssClass: 'success', colour: '#93C54B' },
        CL: { type: 'Commissioned', description: '', cssClass: 'info', colour: '#29ABE0' },
        CRL: { type: 'Community', description: '', cssClass: 'warning', colour: '#F47C3C' },
        ICL: { type: 'Independent community', description: '', cssClass: 'primary', colour: '#325D88' },
        XL: { type: 'Closed', description: '', cssClass: 'danger', colour: '#D9534F' }
    },
    markerPoints: { radius: 4, stroke: true, weight: 4, fill: true, fillColor: '#ccc', fillOpacity: 0.5, color: '#ccc', opacity: 0.7 },
    boundaryLines: {
        gl: { fillColor: "#772953", color: "#772953", weight: 2, opacity: 0.7, fillOpacity: 0.1 },
        normal: { fillColor: "#38B44A", color: "#808080", weight: 1, opacity: 0.7, fillOpacity: 0.1 },
        selected: { fillColor: "#EFB73E", color: "#808080", weight: 3, opacity: 0.9, fillOpacity: 0.1 },
        nonselected: { fillColor: "#ccc", color: "#ccc", weight: 1, opacity: 0.3, fillOpacity: 0.1 },
        le: { fillColor: "#DF382C", color: "#DF382C", weight: 2, opacity: 0.7, fillOpacity: 0.1 }
    },
    fillColours: {
        1: '#93C54B',
        2: '#93C54B',
        3: '#93C54B',
        4: '#93C54B',
        5: '#93C54B',
        6: '#93C54B',
        7: '#93C54B'
    }
};