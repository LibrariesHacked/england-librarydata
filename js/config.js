var config = {
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
    }
};