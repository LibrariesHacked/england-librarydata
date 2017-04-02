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
                    { title: "Libraries" },
                    { title: "Authority" },
                    { title: "Commissioned" },
                    { title: "Community" },
                    { title: "Independent" },
                    {
                        title: "Closed",
                        render: function (data, type, row) {
                            return '<span class="text-danger strong">' + data + '</span>';
                        }
                    },
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
                    { title: "Name" },
                    { title: "Postcode" },
                    { title: "Type" },
                    {
                        title: "Closed",
                        render: function (data, type, row) {
                            return '<span class="text-danger">' + data + '</span>';
                        }
                    },
                    { title: "Notes" },
                    {
                        title: "Multiple",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Employment",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Education",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Adult Skills",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Health",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    },
                    {
                        title: "Services <span class='fa fa-info-circle'></span>",
                        render: function (data, type, row) {
                            return parseFloat(data).toFixed(0);
                        }
                    }
                ]
            });
    });
});