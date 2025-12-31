function initializeTorrents(table) {

    if (TEMPLAR.paramREC() && TEMPLAR.paramREC().search) {
        $(".search_graph").fadeIn(3000);
    } else {
        $(".search_graph").hide();
    }

    // 2. PRECISE DESTROY: Kill existing instance and clear HTML
    if ($.fn.DataTable.isDataTable("#" + table)) {
        var dt = $("#" + table).DataTable();
        dt.clear(); // Removes all data rows
        dt.destroy(); // Unbinds DataTables logic
        $("#" + table + " tbody").empty(); // Clear ONLY the body, not the thead
    }
    
    assertTitleLoading();
    assertGraphSearch();
    assertAdvSearchUI();
    assertAdvButton();

    var hashes = []
    var url = ""
    var checkTable = table;
    if (table === "torrents") {
        if (!TEMPLAR.paramREC()) {
            url = "/" + table
        } else {
            url = "/" + table + "/adv_search"
        }
    } else if (TEMPLAR.pageREC() === "top10") {
        url = "/top10/" + table
    } else if (table === "node") {
        url = "/" + table + "/" + TEMPLAR.paramREC().label + "?uuid=" + TEMPLAR.paramREC().uuid
    }

    $(document).mouseup(function(e) {
        var container = $(".seeAllField");
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            container.hide();
        }
    });

    dataTable = $("#" + table).DataTable({
        destroy: true,
        /*responsive: {
            details: {
                display: $.fn.dataTable.Responsive.display.childRowImmediate,
                type: ''
            }
        },*/
        responsive : true,
        serverSide: true,
        stateSave : TEMPLAR.pageREC() === "titles" && !TEMPLAR.paramREC() ? true : false,
        bSort: true,
        pageLength: 10,
        "aoColumns": [
            { "sWidth": "0%" },
            { "sWidth": "50%" },
            { "sWidth": "12.5%" },
            { "sWidth": "12.5%" },
            { "sWidth": "12.5%" },
            { "sWidth": "12.5%" }
        ],
        processing: true,
        searching: false,
        paging: true,
        info: true,
        columnDefs: [
            { target: 0, visible: false, searchable: false },
            { target: 4, responsivePriority: 1 }
        ],
        rowGroup: {
            dataSrc: 0,
            ordering: true,
            orderable: true,
        },
        ajax: {
            url: url,
            type: "POST",
            data: {
                title: TEMPLAR.paramREC() ? TEMPLAR.paramREC().title : "",
                author: TEMPLAR.paramREC() ? TEMPLAR.paramREC().author : "",
                classes: TEMPLAR.paramREC() ? TEMPLAR.paramREC().classes : "",
                class_all: TEMPLAR.paramREC() ? TEMPLAR.paramREC().class_all : "",
                publisher: TEMPLAR.paramREC() ? TEMPLAR.paramREC().publisher : "",
                type: TEMPLAR.paramREC() ? TEMPLAR.paramREC().type : "",
                media: TEMPLAR.paramREC() ? TEMPLAR.paramREC().media : "",
                format: TEMPLAR.paramREC() ? TEMPLAR.paramREC().format : "",
            },
            dataSrc: function(data) {
                setRecords();

                if (!data || !data.records || data.records.length === 0) {
                    console.log("No results found.");
                    return []; // Returns empty array to DataTable
                }
                else {
                    insertTableData(data)
                }
                var editionsAdded = [];

                tableData.records.forEach(function(record) {
                    var authorField = "";
                    record._fields[1].forEach(function(field, i) {
                        if (i > 0) authorField += ", ";
                        authorField += "<a class='TEMPLAR node author' href='#node?label=author&uuid=" +
                            field.properties.uuid + "'>" + decodeEntities(field.properties.name) + "</a>";
                    });

                    var dateField = "";
                    if (record._fields[0] && record._fields[0].properties.date) {
                        dateField += "<b>[" + decodeEntities(record._fields[0].properties.date) + "]</b>";
                    }

                    var classesField = " ";
                    record._fields[3].forEach(function(field, i) {
                        if (field.properties.uuid) {
                            classesField += "<a class='TEMPLAR node class' href='#node?label=class&uuid=" +
                                field.properties.uuid + "'>" + decodeEntities(field.properties.name) + "</a>";
                        }
                    });

                    var sourceIMG = assertSourceIMG(record);
                    
                    var numPeers = 0;
                    record._fields[2].forEach(function(edition_torrent) {
                        /* This is where the torrent table (with WebTorrent Download) <th> header is set. */
                        var torrentsTable = "<table class='torrentsTable'><thead><th>Format</th>" +
                            "<th>Download</th><th>Size</th><th>Revs</th></thead><tbody>";

                        if (edition_torrent.torrent) {
                            // Image selection logic based on type
                            
                            if (edition_torrent.edition) {                    
                                const currentApa = assertAPACitation(record, edition_torrent);
                                torrentsTable += assertTr(record, edition_torrent, currentApa);

                                if (editionsAdded.indexOf(edition_torrent.edition.properties.uuid) === -1) {
                                    assertFirstEditionRow(records, record, edition_torrent, editionsAdded, assertAPACitation(record, edition_torrent), sourceIMG, dateField, authorField, classesField, torrentsTable);
                                } else {
                                    assertExistingEditionRow(records, record, edition_torrent, editionsAdded, torrentsTable)
                                }
                            }
                        }
                    });
                });
                return records;
            },
        },
        drawCallback: function(settings) {
            this.api().rows().every(function() {
                syncTorrentButtonState(this.node()); // Check main row
                if (this.child.isShown()) {
                    syncTorrentButtonState(this.child()); // Check expanded child row
                }
            });
            
            assertTitleLoaded();
            if (TEMPLAR.pageREC() === "node") {
                assertButtonTab();
            }

            var api = this.api();
        
            // Internal DataTables draw counter
            // settings.iDraw > 1 ensures this doesn't run on the initial load
            if (settings.iDraw > 1) {
                // Use the wrapper to ensure we find the top of the table component
                var tableWrapper = $(api.table().container());
                
                // Scroll to the top of the wrapper
                tableWrapper[0].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        },
    })
    if (TEMPLAR.pageREC() === "top10") $('th').unbind('click.DT')

    dataTable.on('responsive-display', function (e, datatable, row, showHide, update) {
        if (showHide) { // If the row was just expanded
            syncTorrentButtonState($(row.node()).next()); // Target the child row specifically
        }
    });

    $(document).off("click", ".webtorrent").on("click", ".webtorrent", function(e) {
        e.preventDefault();
        
        // If the button has the disabled class, show the "please wait" message
        if ($(this).hasClass("webtorrent-disabled")) {
            $(".please").show().fadeOut(2000);
            return;
        }

        // Otherwise, proceed with the route
        const d = this.dataset;
        TEMPLAR.route("#file?id=" + d.id + "&media=" + d.media + "&format=" + d.format + "&release=" + d.release + "&apa=" + encodeURIComponent(d.apa));
    });
}

function syncTorrentButtonState(container) {
    // If no container is provided, default to the whole table
    var target = container || "#torrents";
    var buttons = $(target).find(".webtorrent");

    // Check the actual state of the WebTorrent client
    if (window.torrent && window.torrent.files && window.torrent.files[0]) {
        buttons.removeClass("webtorrent-disabled");
    } else {
        buttons.addClass("webtorrent-disabled");
    }
}
