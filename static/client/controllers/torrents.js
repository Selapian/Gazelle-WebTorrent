function initializeTorrents(table) {
    // 1. Check the Global DataTable registry
    // This is more robust than checking the local variable 'dataTable'
    // 1. HARD RESET: Kill the old instance and its DOM leftovers
    if ($.fn.DataTable.isDataTable("#" + table)) {
        var oldTable = $("#" + table).DataTable();
        oldTable.clear().destroy(); 
        
        // Manual DOM cleanup to prevent 'style' calculation errors
        $("#" + table).empty(); 
        $("#" + table).removeAttr('style').removeClass('dtr-inline collapsed');
        
        // Re-inject the skeleton because .empty() removes the <thead> your partial provided
        $("#" + table).append('<thead><tr><th>Group</th><th>APA Citation</th><th>Revs</th><th>Date</th><th>Time</th><th class="none"></th></tr></thead><tbody></tbody>');
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
        bSort: true,
        pageLength: 10,
        columns: [
            { visible: false, searchable: false }, // Index 0: Grouping (Date/Title)
            { width: "50%" },                      // Index 1: APA Citation
            { width: "17%" },// Index 2: Revs (Right-align to keep icon tidy)
            { width: "17%" },                      // Index 3: Date
            { width: "17%" },                      // Index 4: Time
            { width: "100%", responsivePriority: 1 }// Index 5: Download
        ],
        columnDefs: [
            { targets: [0], visible: false }, // Grouping column
            { targets: [1], className: "text-left" }, // APA Citation
            { targets: [2, 3, 4], className: "dt-left" }, // Revs, Date, Time (aligned left)
            { targets: 5, responsivePriority: 1 } // Download
        ],
        processing: true,
        searching: false,
        paging: true,
        info: true,
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
                refreshDTRecs();

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
                        if(i===0)
                            authorField += " by "
                        if (record._fields[1].length === 1){                            
                            authorField += "<a class='TEMPLAR node author' href='#node?label=author&uuid=" +
                            field.properties.uuid + "'>" + decodeEntities(field.properties.name);
                        }
                        else{
                            authorField += "<a class='TEMPLAR node author' href='#node?label=author&uuid=" +
                            field.properties.uuid + "'>" + decodeEntities(field.properties.name);
                            if(i < record._fields[1].length - 1){
                                authorField += "<span>, </span>"
                            }                            
                        }
                        authorField += "</a>"
                        
                        
                    });

                    var dateField = "";
                    if (record._fields[0] && record._fields[0].properties.date) {
                        dateField += "<b>[" + decodeEntities(record._fields[0].properties.date) + "]</b>";
                    }

                    var classesField = " ";
                    record._fields[3].forEach(function(field, i) {
                        if (field.properties.uuid) {
                            classesField += "<a class='TEMPLAR node class' href='#node?label=class&uuid=" +
                                field.properties.uuid + "'>" + decodeEntities(field.properties.name);
                        }
                        if(record._fields[3].length > 1 && i < record._fields[3].length - 1){
                            classesField += "<span class='classComma'>,</span></a>"
                        }
                        else{
                            classesField += "</a>"
                        }
                    });

                    var sourceIMG = assertSourceIMG(record);
                    
                    var numPeers = 0;
                    record._fields[2].forEach(function(edition_torrent) {
                        /* This is where the torrent table (with WebTorrent Download) <th> header is set. */
                        /*

                        if (edition_torrent.torrent) {
                            // Image selection logic based on type
                            
                            if (edition_torrent.edition) {                    
                                const currentApa = assertAPACitation(record, edition_torrent);
                                torrentsTable += assertTr(record, edition_torrent, currentApa);

                                if (editionsAdded.indexOf(edition_torrent.edition.properties.uuid) === -1) {
                                    assertFirstEditionRow(record, edition_torrent, editionsAdded, assertAPACitation(record, edition_torrent), sourceIMG, dateField, authorField, classesField, torrentsTable);
                                } else {
                                    assertExistingEditionRow(record, edition_torrent, editionsAdded, torrentsTable)
                                }
                            }
                        }*/
                        // Inside record._fields[2].forEach:
                        var torrentsTableRows = ""; // Store only <tr> elements here
                        var currentApa = assertAPACitation(record, edition_torrent);
                        torrentsTableRows += assertTr(record, edition_torrent, currentApa);

                        if (editionsAdded.indexOf(edition_torrent.edition.properties.uuid) === -1) {
                            // NEW EDITION: Create the full table wrapper
                            var fullTable = "<table class='torrentsTable'><thead><tr><th>Format</th><th>Download</th><th>Revs</th><th>Size</th></tr></thead><tbody>" + 
                                            torrentsTableRows + "</tbody></table>";
                            
                            assertFirstEditionRow(record, edition_torrent, editionsAdded, currentApa, sourceIMG, dateField, authorField, classesField, fullTable);
                        } else {
                            // EXISTING EDITION: Only append the <tr> to the existing <tbody>
                            assertExistingEditionRow(edition_torrent, editionsAdded, torrentsTableRows);
                        }
                    });
                });
                return dtRecs;
            },
        },
        drawCallback: function(settings) {
            /*if (!this.api().table().node()) return;

            this.api().rows().every(function() {
                syncTorrentButtonState(this.node()); // Check main row
                if (this.child.isShown()) {
                    syncTorrentButtonState(this.child()); // Check expanded child row
                }
            });
            */

            $(".webtorrent").click(function(){
                const infoHash = $(this).data("infohash");
                const APA = $(this).data("apa");                            
                TEMPLAR.route("file?infoHash=" + infoHash + "&APA=" + encodeURIComponent(APA));                
            })

            $("table tbody").on("click", ".magnetURI", function(){
                const infoHash = $(this).data("infohash");
                $.post("/rev/" + infoHash)
            })

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
            $(".b").show().fadeOut(2000);
            return;
        }

        $(".webtorrent").prop("disabled", true);

        setTimeout(function(){
            $(".webtorrent").prop("disabled", false);
        }, 333)

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
