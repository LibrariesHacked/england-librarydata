var config = {
    libStyles: {
        LAL: { type: 'Local authority run', description: '', cssClass: 'success', colour: '#38B44A' },
        CRL: { type: 'Community run', description: '', cssClass: 'warning', colour: '#EFB73E' },
        ICL: { type: 'Independent community', description: '', cssClass: 'default', colour: '#AEA79F' },
        CL: { type: 'Commissioned', description: '', cssClass: 'info', colour: '#772953' },
        XL: { type: 'Closed', description: '', cssClass: 'danger', colour: '#DF382C' }
    },
    markerPoints: { radius: 4, stroke: true, weight: 4, fill: true, fillColor: '#ccc', fillOpacity: 0.5, color: '#ccc', opacity: 0.7 },
    boundaryLines: {
        normal: { fillColor: "#38B44A", color: "#808080", weight: 1, opacity: 0.7, fillOpacity: 0.1 },
        selected: { fillColor: "#EFB73E", color: "#808080", weight: 3, opacity: 0.9, fillOpacity: 0.1 },
        nonselected: { fillColor: "#ccc", color: "#ccc", weight: 1, opacity: 0.3, fillOpacity: 0.1 },
        le: { fillColor: "#DF382C", color: "#DF382C", weight: 2, opacity: 0.7, fillOpacity: 0.1 },
        gl: { fillColor: "#772953", color: "#772953", weight: 2, opacity: 0.7, fillOpacity: 0.1 }
    }
};