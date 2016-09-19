$(function () {


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
            data: [],//PublicLibrariesNews.getAuthoritiesDataTable(),
            columns: [
                { title: "Authority name" },
                { title: "Code", visible: false },
                { title: "Number libraries" },
                { title: "Local authority libraries" },
                { title: "Commissioned libraries" },
                { title: "Community libraries" },
                { title: "Independent community libraries" },
                { title: "Closed libraries" },
                { title: "Population" },
                { title: "Area (hecatares)" }
            ],
            order: [[8, 'asc']]
        });
});