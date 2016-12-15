$(function () {

    PublicLibrariesNews.loadData(2, false, true, true, true, function () {

        /////////////////////////////////////////////////
        // Table 1: Authorities
        /////////////////////////////////////////////////
        var tableAuthorities = $('#tblAuthorities').dataTable(
            {
                processing: true,
                responsive: true,
                dom: 'Bfrtip',
                buttons: [
                    { extend: 'print', text: 'Print', className: 'btn-sm' },
                    { extend: 'excelHtml5', text: 'Export Excel', className: 'btn-sm' }
                ],
                deferRender: true,
                data: PublicLibrariesNews.getAuthoritiesDataTable(),
                columns: [
                    { title: "name" },
                    { title: "libraries" },
                    { title: "LAL" },
                    { title: "CL" },
                    { title: "CL" },
                    { title: "ICL" },
                    { title: "closed" },
                    { title: "population" },
                    { title: "area (hectares)" }
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
                buttons: [
                    { extend: 'print', text: 'Print', className: 'btn-sm' },
                    { extend: 'excelHtml5', text: 'Export Excel', className: 'btn-sm' }
                ],
                deferRender: true,
                data: PublicLibrariesNews.getLibrariesDataTable(),
                columns: [
                    { title: "name" },
                    { title: "address" },
                    { title: "postcode" },
                    { title: "type" },
                    { title: "closed" },
                    { title: "notes" },
                    { title: "multiple" },
                    { title: "education" },
                    { title: "income" },
                    { title: "health" }
                ]
            });

        /////////////////////////////////////////////////
        // Table 3: Local news
        /////////////////////////////////////////////////
        var tableLocal = $('#tblPlnLocal').dataTable(
            {
                processing: true,
                responsive: true,
                dom: 'Bfrtip',
                buttons: [
                    { extend: 'print', text: 'Print', className: 'btn-sm' },
                    { extend: 'excelHtml5', text: 'Export Excel', className: 'btn-sm' }
                ],
                deferRender: true,
                data: PublicLibrariesNews.getNewsDataTable('local'),
                columns: [
                    { title: "Location" },
                    { title: "Date" },
                    { title: "Text" },
                    { title: "URL" },
                ]
            });

        /////////////////////////////////////////////////
        // Table 4: Changes
        /////////////////////////////////////////////////
        var tableChanges = $('#tblPlnChanges').dataTable(
            {
                processing: true,
                responsive: true,
                dom: 'Bfrtip',
                buttons: [
                    { extend: 'print', text: 'Print', className: 'btn-sm' },
                    { extend: 'excelHtml5', text: 'Export Excel', className: 'btn-sm' }
                ],
                deferRender: true,
                data: PublicLibrariesNews.getNewsDataTable('changes'),
                columns: [
                    { title: "Location" },
                    { title: "Date" },
                    { title: "Text" },
                    { title: "URL" },
                ]
            });


    });
});