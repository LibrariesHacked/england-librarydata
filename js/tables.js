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
                    { title: "Name&nbsp;<span class='fa fa-info-circle'></span>" },
                    { title: "Libraries" },
                    { title: "Authority" },
                    { title: "Commissioned" },
                    { title: "Community" },
                    { title: "Independent" },
                    { title: "Closed" },
                    { title: "New" },
                    {
                        title: "Population",
                        render: function (data, type, row) {
                            return LibrariesFuncs.getNumFormat(parseInt(data));
                        }
                    },
                    {
                        title: "Area",
                        render: function (data, type, row) {
                            return LibrariesFuncs.getNumFormat(parseInt(data)) + ' ha';
                        }
                    }
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
                    { title: "Name&nbsp;<span class='fa fa-info-circle'></span>" },
                    { title: "Postcode&nbsp;<span class='fa fa-info-circle'></span>" },
                    { title: "Type&nbsp;<span class='fa fa-info-circle'></span>" },
                    {
                        title: "Closed&nbsp;<span class='fa fa-info-circle'></span>",
                        render: function (data, type, row) {
                            return '<span class="text-danger">' + data + '</span>';
                        }
                    },
                    {
                        title: "Multiple&nbsp;<span class='fa fa-info-circle'></span>",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Work&nbsp;<span class='fa fa-info-circle'></span>",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Education&nbsp;<span class='fa fa-info-circle'></span>",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Adult Skills&nbsp;<span class='fa fa-info-circle'></span>",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Health&nbsp;<span class='fa fa-info-circle'></span>",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Services&nbsp;<span class='fa fa-info-circle'></span>",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    { title: "Notes&nbsp;<span class='fa fa-info-circle'></span>" }
                ]
            });
    });
});