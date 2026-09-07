let firstLoad = true;

function initializeTorrents(table) {
    // 1. Check the Global DataTable registry
    // This is more robust than checking the local variable 'dataTable'
    // 1. HARD RESET: Kill the old instance and its DOM leftovers
    assertTitleHidden();
    $("#mobile_fullscreen").hide();

    //shiv for sources and top10
    if(TEMPLAR.pageREC() === "torrents" || TEMPLAR.pageREC() === "top10"){
        $("h2 span a").show();
    }
    
    if ($.fn.DataTable.isDataTable("#" + table)) {
        var oldTable = $("#" + table).DataTable();
        oldTable.clear().destroy(); 
        
        // Manual DOM cleanup to prevent 'style' calculation errors
        $("#" + table).empty(); 
        $("#" + table).removeAttr('style').removeClass('dtr-inline collapsed');
        
        // Re-inject the skeleton because .empty() removes the <thead> your partial provided
        $("#" + table).append('<thead><tr><th>Group</th><th>APA Citation</th><th>Revs</th><th>Date</th><th>Time</th><th class="none"></th></tr></thead><tbody></tbody>');
    }

    assertGraphParamsPendingReset();    
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
        responsive: {
            details: {
                // This forces the child row to be shown immediately
                display: $.fn.dataTable.Responsive.display.childRowImmediate,
                // Optional: determines how the row is toggled (none means the user can't close it)
                type: 'none' 
            }
        },
        serverSide: true,
        bSort: true,
        pageLength: 10,
        columns: [
            { visible: false, searchable: false }, // Index 0: Grouping (Date/Title)
            { width: "50%" },                      // Index 1: APA Citation
            { width: "16.66%" },// Index 2: Revs (Right-align to keep icon tidy)
            { width: "16.66%" },                      // Index 3: Date
            { width: "16.66%" },                      // Index 4: Time
            { width: "100%", responsivePriority: 1 }// Index 5: Download
        ],
        columnDefs: [
            { targets: [0], visible: false }, // Grouping column
            { targets: [1], className: "text-left" }, // APA Citation
            { targets: [2, 3, 4], className: "dt-left" }, // Revs, Date, Time (aligned left)
            { targets: 5, responsivePriority: 1 } // Download
        ],
        order: [[ 4, "desc" ]],
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
                all: TEMPLAR.paramREC() ? TEMPLAR.paramREC().all : "",
                publisher: TEMPLAR.paramREC() ? TEMPLAR.paramREC().publisher : "",
                type: TEMPLAR.paramREC() ? TEMPLAR.paramREC().type : "",
                media: TEMPLAR.paramREC() ? TEMPLAR.paramREC().media : "",
                format: TEMPLAR.paramREC() ? TEMPLAR.paramREC().format : "",
                res : TEMPLAR.paramREC() ? TEMPLAR.paramREC().res : ""
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
                            authorField += "<span class='silver'> by </span>"
                        if (record._fields[1].length === 1){                            
                            authorField += "<a class='TEMPLAR node author' href='#node?label=author&uuid=" +
                            field.properties.uuid + "'>" + decodeEntities(field.properties.name);
                        }
                        else{
                            authorField += "<a class='TEMPLAR node author' href='#node?label=author&uuid=" +
                            field.properties.uuid + "'>" + decodeEntities(field.properties.name);
                            if(i < record._fields[1].length - 1){
                                authorField += "<span class='silver'>, </span>"
                            }                            
                        }
                        authorField += "</a>"
                        
                        
                    });

                    var dateField = "";
                    if (record._fields[0] && record._fields[0].properties.date) {
                        dateField += "<b class='silver'>[" + decodeEntities(record._fields[0].properties.date) + "]</b>";
                    }

                    var classesField = " ";
                    record._fields[3].forEach(function(field, i) {
                        if (field.properties.uuid) {
                            classesField += "<a class='TEMPLAR node class' href='#node?label=class&uuid=" +
                                field.properties.uuid + "'>" + decodeEntities(field.properties.name);
                        }
                        if(record._fields[3].length > 1 && i < record._fields[3].length - 1){
                            classesField += "<span class='classComma silver'>,</span></a>"
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
                            var fullTable = "<table class='torrentsTable'><thead><tr><th>File</th><th>Download</th><th>Revs</th><th>Size</th></tr></thead><tbody>" + 
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
            assertTitleLoaded()
            //this sets graphParams in the graphModel so the graph can accumulate where the user left off.
            if(firstLoad){
              if($("#adv_title").val() !== ""){
                  walkGraph("source", $("#adv_title").val() ? $("#adv_title").val() : "", false);
                }
                if($("#adv_author").val() !== ""){
                  walkGraph("author", $("#adv_author").val() ? $("#adv_author").val() : "", false);
                }
                if($("#adv_classes").val() !== ""){
                  walkGraph("class", $("#adv_classes").val() ? $("#adv_classes").val() : "", false);
                }
                if($("#adv_publisher").val() !== ""){
                  walkGraph("publisher", $("#adv_publisher").val() ? $("#adv_publisher").val() : "", false);
                }
                firstLoad = false;
  
            }
            
            // Handle Copy Event
            /*$("table tbody").off('contextmenu', ".magnetURI").on('contextmenu', ".magnetURI", function() {
                const infoHash = $(this).data("infohash");
                $.post("/rev/" + infoHash);
            });*/
            /*$("a.webtorrent").off("click").on("click" function(){
                const infoHash = $(this).data("infohash");
                const APA = $(this).data("apa");                            
                TEMPLAR.route("file?infoHash=" + infoHash + "&APA=" + encodeURIComponent(APA));                
            })*/

            $("table tbody").off("click", ".magnetURI").on("click", ".magnetURI", function(){
                const infoHash = $(this).data("infohash");
                $.post("/rev/" + infoHash)
            })

            assertNodeNameFromData()
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
    
    $(document).off("click", "#torrent_infoHash").on("click", "#torrent_infoHash", function(e){
      e.preventDefault();
      
      // Retrieve the infohash from the data-infohash attribute
      const infoHash = $(this).data('infohash');
      
      if (!infoHash) {
        console.warn('No data-infohash attribute found on this element.');
        return;
      }

      // Copy to clipboard using modern Navigator API
      navigator.clipboard.writeText(infoHash)
        .then(() => {
          
          // Optional: Give visual feedback to the user
          const $el = $(this);
          const originalText = $el.text();
          $el.text('[Copied!]');
          $el.css('color', '#50C777');
          setTimeout(() => { $el.text(originalText); $el.css('color', 'darkgoldenrod'); }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy to clipboard:', err);
        });
    });

    $(document).off("click", ".copy-citation-btn").on("click", ".copy-citation-btn", function(e) {
      e.stopPropagation();
      const uuid = $(this).data("uuid");
      const $btn = $(this);
      
      // Extract clean text content from the citation element
      const textToCopy = $("#edition_" + uuid + "_field").text().trim();

      navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual indicator feedback (turns green briefy)
        $btn.css("color", "#50C777");
        setTimeout(() => $btn.css("color", "#a0a0a0"), 1200);
      }).catch(err => {
        console.error("Failed to copy citation: ", err);
      });
    });
    $(document).off("click", "a.webtorrent").on("click", "a.webtorrent", function(e) {
        e.preventDefault();
        const d = this.dataset;
        // Fix: Using d.infoHash (case sensitive) and adding quotes to selector       
        
        const $existing = $(`#hero option[value="${d.infohash}"]`);

    //called on webtorrent route load, either refresh or a.webtorrent route()
        if ($existing.length === 0){
            $(this).text("[Queued..!]");
            $(this).css('color', '#50C777');
        }
        else{
            $(this).text("Already Added.");
            $(this).css('color', 'orange');
        }
        var that = $(this);
        setTimeout(function(){
            that.text("[WebTorrent]");
            that.css("color", "darkgoldenrod");
        },2360);
        
        assertHero(d);
    });

    $("a.webtorrent").text("[WebTorrent]");

  
}


