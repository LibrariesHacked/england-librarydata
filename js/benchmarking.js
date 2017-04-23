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
        var benchmarking = new Chart($('#cht-benchmarking'), {
            type: 'horizontalBar',
            data: data,
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            autoSkip: false,
                            fontSize: 9
                        }
                    }]
                }
            }
        });

        var benchmarkByVariable = function (variable) {
            var auths = LibrariesFuncs.getAuthoritiesListedByNameWithBenchmarks();

            data.labels = [];
            data.datasets[0].data = [];
            $.each(Object.keys(auths).sort(function (a, b) { return auths[b][variable] - auths[a][variable] }), function (i, a) {
                data.labels.push(a);
                data.datasets[0].data.push(auths[a][variable]);
            });
            benchmarking.update();
        };

        $('#sel-benchmark-type').on('change', function (e) {
            benchmarkByVariable($(e.target).val());
            benchmarking.update();
        });

        benchmarkByVariable('population');
    });
});