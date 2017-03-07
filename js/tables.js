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
                    { title: "name" },
                    { title: "libraries" },
                    { title: "authority" },
                    { title: "commissioned" },
                    { title: "community" },
                    { title: "independent" },
                    {
                        title: "closed",
                        render: function (data, type, row) {
                            return '<span class="text-danger strong">' + data + '</span>';
                        }
                    },
                    { title: "new" },
                    {
                        title: "population",
                        render: function (data, type, row) {
                            return LibrariesFuncs.getNumFormat(parseInt(data));
                        }
                    },
                    {
                        title: "area",
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
                    { title: "name" },
                    { title: "postcode" },
                    { title: "type" },
                    {
                        title: "closed",
                        render: function (data, type, row) {
                            return '<span class="text-danger">' + data + '</span>';
                        }
                    },
                    { title: "notes" },
                    {
                        title: "multiple",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "employment",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "education",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "adult skills",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "health",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "services",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    }
                ]
            });
    });
});