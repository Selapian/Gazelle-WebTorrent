function assertNodeNameFromData() {
    const params = TEMPLAR.paramREC();
    const targetUuid = params?.uuid ? String(params.uuid).trim().toLowerCase() : null;
    const targetLabel = params?.label; // 'source', 'author', 'class', 'publisher'

    // We must use the raw data, not the HTML strings array
    const dataSource = (typeof tableData !== 'undefined' && tableData.records) ? tableData.records : null;

    if (!dataSource || !Array.isArray(dataSource) || !targetUuid) {
        return;
    }

    let targetName = "";

    for (const record of dataSource) {
        if (targetName) break;
        const fields = record._fields;
        if (!fields) continue;

        // 1. Check Source (Field 0)
        if (fields[0]?.properties?.uuid && String(fields[0].properties.uuid).toLowerCase() === targetUuid) {
            targetName = fields[0].properties.name || fields[0].properties.title;
        }

        // 2. Check Authors (Field 1 - Array)
        if (!targetName && Array.isArray(fields[1])) {
            const match = fields[1].find(node => node.properties?.uuid && String(node.properties.uuid).toLowerCase() === targetUuid);
            if (match) targetName = match.properties.name;
        }

        // 3. Check Classes (Field 3 - Array)
        if (!targetName && Array.isArray(fields[3])) {
            const match = fields[3].find(node => node.properties?.uuid && String(node.properties.uuid).toLowerCase() === targetUuid);
            if (match) targetName = match.properties.name;
        }

        // 4. Check Publisher (Field 2 - Nested in edition_torrent array)
        if (!targetName && Array.isArray(fields[2])) {
            for (const et of fields[2]) {
                if (et.publisher?.properties?.uuid && String(et.publisher.properties.uuid).toLowerCase() === targetUuid) {
                    targetName = et.publisher.properties.name;
                    break;
                }
            }
        }
    }

    if (targetName) {
        const decoded = decodeEntities(decodeEntities((targetName)))
        updateTitleUI(decoded, targetLabel);
        assertGraphButton(encodeURIComponent(decoded));
    }
}



function assertTitleLoading(){
  $("h2 span a").hide();

  $("h2 span a").text("Loading...").addClass("loading").fadeIn()
}

function assertTitleLoaded(){

  switch (TEMPLAR.pageREC()) {
    case "torrents":
      if(TEMPLAR.paramREC() && TEMPLAR.paramREC().search){
        $("#torrentsTitle span a").text("Graph Search").attr("href", "#torrents?search=true&title=&author=&classes=&class_all=false&publisher=&type=all&media=all&format=all&res=all").removeClass("loading").fadeIn(3333)

      }
      else{
        $("#torrentsTitle span a").text("Torrents").attr("href", "#torrents").removeClass("loading").fadeIn(3333)

      }
      break;
    case "top10":
      $("#top10Title span a").text("Top 10").removeClass("loading").show();
      break;
    case "node":
      //TODO: maybe multiple calls here
      //$.get("/source_info/" + TEMPLAR.paramREC().uuid, function (data) {
        assertNodeNameFromData()
        /*$("#addFormat").click(function () {
          TEMPLAR.route("#upload?uuid=" + TEMPLAR.paramREC().uuid);
        });*/
     
        //TEMPLAR.DOM();
      //});
      break;
    default:
      $("#torrentsTitle span a").text("Torrents").removeClass("loading").fadeIn(3333)

  }
}

function updateTitleUI(name, label) {
    const colors = {
        source: "white",
        author: "yellow",
        class: "green",
        publisher: "red"
    };

    switch(label){
        case "source":
            name = toTitleCase(name);
            break;
        case "author":
            break;
        case "class":
            break;
        case "publisher":
            name = toTitleCase(name)
            break;
    }

    $("#nodeTitle span a").text(name)
       .addClass(label)
       .attr("href", "#node?label=" + label + "&uuid=" + (TEMPLAR.paramREC() ? TEMPLAR.paramREC().uuid : "undefined"))
       .removeClass("loading")
       .css("color", colors[label] || "white").removeClass("gold").removeClass("red")   

    TEMPLAR.DOM();

    $(document).off("TEMPLAR_SHIFT").on("TEMPLAR_SHIFT", "a.TEMPLAR", function(e){
        // 1. Prevent the mobile system menu from appearing
        e.preventDefault();
        const $self = $(this);
        const className = $self.attr('class').split(' ')[2];
        const text = encodeURIComponent($self.text());
        traverseGraph(className, text);
    })                  
}

function assertButtonTab(){
    switch(TEMPLAR.paramREC().label){
        case "source":
            $("#warp").fadeIn(1337);
            $("#graph_search").hide();
            break;
        default:
            $("#warp").hide()
            $("#graph_search").fadeIn(1337);
            break;
    }
}



function assertNodeTraverse(){
   
        // Configuration
        const LONG_TAP_DURATION = 600; // ms
        let touchTimer;

        $(document).on('touchstart', 'a.TEMPLAR', function(e) {
            if (e.originalEvent.touches.length >= 2) {
                // TWO FINGERS DETECTED
                e.preventDefault(); 
                
                const $self = $(this);
                traverseGraph($self.attr('class').split(' ')[2], encodeURIComponent($self.text()));
            }
        });

        // Add this to your second script (the one that loads AFTER Templar)
        $(document).off("TEMPLAR_SHIFT").on("TEMPLAR_SHIFT", "a.TEMPLAR", function(e){
            // 1. Prevent the mobile system menu from appearing
            const $self = $(this);
            const className = $self.attr('class').split(' ')[2];
            const text = encodeURIComponent($self.text());
            traverseGraph(className, text);
        })

    
}

function assertGraphButton(searchable){
    $("#graph_search").off("click")
    $("#graph_search").on("click", function(e){
        e.preventDefault();
        traverseGraph(TEMPLAR.paramREC().label, searchable);
        
    })
}