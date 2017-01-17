var config = {
    mapBoxToken: 'pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesDark: 'https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesLight: 'https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapTilesStreets: 'https://api.mapbox.com/styles/v1/mapbox/streets-v9/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A',
    mapAttribution: '&copy; <a href="http://osm.org/copyright">OSM</a> contributors.  contains OS data &copy; Crown copyright and database right 2016, Royal Mail data &copy; Royal Mail copyright and Database right 2016, National Statistics data &copy; Crown copyright and database right 2016.',
    libStyles: {
        LAL: { type: 'local authority', description: '', cssClass: 'success', colour: '#5cb85c' },
        CL: { type: 'commissioned', description: '', cssClass: 'info', colour: '#5bc0de' },
        CRL: { type: 'community', description: '', cssClass: 'warning', colour: '#f0ad4e' },
        ICL: { type: 'independent community', description: '', cssClass: 'primary', colour: '#0275d8' },
        XL: { type: 'closed', description: '', cssClass: 'danger', colour: '#d9534f' },
        XLR: { type: 'replaced', description: '', cssClass: 'muted', colour: '#818a91' }
    },
    depStatStyles: {
        1: 'danger',
        2: 'danger',
        3: 'primary',
        4: 'primary',
        5: 'primary',
        6: 'primary',
        7: 'primary',
        8: 'primary',
        9: 'primary',
        10: 'primary',
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
        2: '#F47C3C',
        3: '#F47C3C',
        4: '#93C54B',
        5: '#D9534F',
        6: '#29ABE0',
        7: '#29ABE0'
    }
};