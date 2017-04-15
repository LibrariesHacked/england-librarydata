$(function () {

    LibrariesFuncs.loadData(0, true, true, true, true, function () {

        /////////////////////////////////////////////////
        // Table 1: Authorities
        /////////////////////////////////////////////////
        var tableAuthorities = $('#tblAuthorities').dataTable(
            {
                processing: true,
                responsive: true,
                dom: 'Bfrtip',
                info: false,
                deferRender: true,
                data: LibrariesFuncs.getAuthoritiesDataTable(),
                columns: [
                    { title: "Name" },
                    { title: "Libraries&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='number of open libraries in july 2016'></a>" },
                    {
                        title: "People&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='the resident population of the local authority'></a>",
                        render: function (data, type, row) {
                            if (type == 'display') return LibrariesFuncs.getNumFormat(parseInt(data));
                            return data;
                        }
                    },
                    {
                        title: "Adults&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='the resident population of the local authority'></a>",
                        render: function (data, type, row) {
                            if (type == 'display') return LibrariesFuncs.getNumFormat(parseInt(data));
                            return data;
                        }
                    },
                    {
                        title: "Children&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='the resident population of the local authority'></a>",
                        render: function (data, type, row) {
                            if (type == 'display') return LibrariesFuncs.getNumFormat(parseInt(data));
                            return data;
                        }
                    },
                    {
                        title: "Area&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='the land area of the local authority'></a>",
                        render: function (data, type, row) {
                            if (type == 'display') return LibrariesFuncs.getNumFormat(parseInt(data)) + ' ha';
                            return data;
                        }
                    },
                    { title: "Authority&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='number of local authority libraries open libraries in july 2016'></a>" },
                    { title: "Commissioned&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='number of commissioned libraries open libraries in july 2016'></a>" },
                    { title: "Community&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='number of community-run libraries open libraries in july 2016'></a>" },
                    { title: "Independent&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='number of independent libraries open libraries in july 2016'></a>" },
                    { title: "Closed&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='number of closed libraries between april 2010 and july 2016'></a>" },
                    { title: "New&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='number of new libraries open between april 2010 and july 2016'></a>" }
                ]
            });

        /////////////////////////////////////////////////
        // Table 2: Libraries
        /////////////////////////////////////////////////
        var tableLibraries = $('#tblLibraries').dataTable(
            {
                processing: true,
                responsive: true,
                dom: 'Bfrtip',
                info: false,
                deferRender: true,
                data: LibrariesFuncs.getLibrariesDataTable(),
                columns: [
                    {
                        title: "Name",
                        render: function (data, type, row) {
                            return (data.length > 30 ? (data.substring(0, 30) + '...') : data);
                        }
                    },
                    { title: "Postcode" },
                    {
                        title: "Type&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='the type of library.  hover over the code to see the full description.'></a>",
                        render: function (data, type, row) {
                            return '<abbr class="initialism" title="' + config.libStyles[data].description + '">' + data + '</abbr>';
                        }
                    },
                    {
                        title: "Adults&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='the resident population of the local authority'></a>",
                        render: function (data, type, row) {
                            if (type == 'display') return LibrariesFuncs.getNumFormat(parseInt(data));
                            return data;
                        }
                    },
                    {
                        title: "Children&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='the resident population of the local authority'></a>",
                        render: function (data, type, row) {
                            if (type == 'display') return LibrariesFuncs.getNumFormat(parseInt(data));
                            return data;
                        }
                    },
                    {
                        title: "Multiple&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title=''></a>",
                        render: function (data, type, row) {
                            var m = parseFloat(data).toFixed(0);
                            return '<span class="text-' + (m > 3 ? 'muted' : 'danger') + '">' + m + '</span>';
                        }
                    },
                    {
                        title: "Work&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title=''></a>",
                        render: function (data, type, row) {
                            var m = parseFloat(data).toFixed(0);
                            return '<span class="text-' + (m > 3 ? 'muted' : 'danger') + '">' + m + '</span>';
                        }
                    },
                    {
                        title: "Education&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title=''></a>",
                        render: function (data, type, row) {
                            var m = parseFloat(data).toFixed(0);
                            return '<span class="text-' + (m > 3 ? 'muted' : 'danger') + '">' + m + '</span>';
                        }
                    },
                    {
                        title: "Adult Skills&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title=''></a>",
                        render: function (data, type, row) {
                            var m = parseFloat(data).toFixed(0);
                            return '<span class="text-' + (m > 3 ? 'muted' : 'danger') + '">' + m + '</span>';
                        }
                    },
                    {
                        title: "Services&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title=''></a>",
                        render: function (data, type, row) {
                            var m = parseFloat(data).toFixed(0);
                            return '<span class="text-' + (m > 3 ? 'muted' : 'danger') + '">' + m + '</span>';
                        }
                    },
                    {
                        title: "Health&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title=''></a>",
                        render: function (data, type, row) {
                            var m = parseFloat(data).toFixed(0);
                            return '<span class="text-' + (m > 3 ? 'muted' : 'danger') + '">' + m + '</span>';
                        }
                    },
                    {
                        title: "Notes&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title=''></a>",
                        render: function (data, type, row) {
                            return '<span class="text-muted">' + data + '</span>';
                        }
                    },
                    { title: "Closed&nbsp;<a href='#' class='fa fa-info' data-toggle='tooltip' data-animation='false' title='the year the library closed (if applicable)'></a>" }
                ]
            });
    });

    /////////////////////////////////////////////////////////
    // Tooltips
    /////////////////////////////////////////////////////////
    var updateTooltips = function () {
        $('[data-toggle="tooltip"]').on('click', function (e) { e.preventDefault(); }).tooltip();
    };
    updateTooltips();
});