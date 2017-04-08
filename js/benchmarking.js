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
    });    
});