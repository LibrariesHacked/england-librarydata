$(function () {

    /////////////////////////////////////////////////
    // Variables
    // Declared variables that get set later on
    /////////////////////////////////////////////////

    // Global Chart options
    Chart.defaults.global.defaultFontColor = '#98978B';
    Chart.defaults.global.defaultFontFamily = '"Roboto","Helvetica Neue",Helvetica,Arial,sans-serif';
    Chart.defaults.global.responsiveAnimationDuration = 500;
    Chart.defaults.global.maintainAspectRatio = false;

    //////////////////////////////////////////////////////////////////////////
    // LOAD.  Load the data
    // Authority data, not authority geography, library data, not twitter data.
    //////////////////////////////////////////////////////////////////////////
    LibrariesFuncs.loadData(0, true, false, true, false, function () {

        var data = { labels: [], datasets: [{ data: [] }] };
        var auths = LibrariesFuncs.getAuthoritiesListedByNameWithBenchmarks();

        $.each(Object.keys(auths[Object.keys(auths)[0]]), function (i, o) {
            $('#sel-benchmark-type').append($('<option>', { value: o }).text(auths[Object.keys(auths)[0]][o].display)); 
        });

        var benchmarking = new Chart($('#cht-benchmarking'), {
            type: 'horizontalBar',
            data: data,
            options: {
                scales: {
                    yAxes: [{
                        gridLines: { display: false },
                        ticks: {
                            autoSkip: false,
                            fontSize: 9
                        }
                    }],
                    xAxes: [{
                        position: 'top',
                        scaleLabel: {
                            display: true,
                            labelString: 'Population'
                        }
                    }]
                },
                legend: { display: false },
            }
        });

        var benchmarkByVariable = function (variable) {
            
            data.labels = [];
            data.datasets[0].data = [];
            data.datasets[0].borderColor = [];
            data.datasets[0].borderWidth = 1;
            data.datasets[0].backgroundColor = [];
            $.each(Object.keys(auths).sort(function (a, b) {
                if (auths[b][variable].sort == 'desc') return auths[b][variable].value - auths[a][variable].value;
                return auths[a][variable].value - auths[b][variable].value;
            }), function (i, a) {
                var c = config.libStyles['LAL'];
                if (i > 25) c = config.libStyles['CRL'];
                if (i > 50) c = config.libStyles['XLT'];
                if (i > 75) c = config.libStyles['X'];
                if (i > 100) c = config.libStyles['CL'];
                if (i > 125) c = config.libStyles['ICL'];
                var colour = 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', 0.2)';
                var borderColour = 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', 0.5)';
                data.datasets[0].borderColor.push(borderColour);
                data.datasets[0].backgroundColor.push(colour);
                data.labels.push(a);
                data.datasets[0].data.push(auths[a][variable].value);
                benchmarking.options.scales.xAxes[0].scaleLabel.labelString = auths[a][variable].x;
            });
            benchmarking.update();
        };

        $('#sel-benchmark-type').on('change', function (e) {
            benchmarkByVariable($(e.target).val());
            benchmarking.update();
        });

        benchmarkByVariable($('#sel-benchmark-type').val());
    });
});