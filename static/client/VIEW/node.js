function assertNodeNameFromData() {
    const params = TEMPLAR.paramREC();
    const targetUuid = params?.uuid ? String(params.uuid).trim().toLowerCase() : null;
    const targetLabel = params?.label; // 'source', 'author', 'class', 'publisher'

    // We must use the raw data, not the HTML strings array
    const dataSource = (typeof tableData !== 'undefined' && tableData.data) ? tableData.data : null;

    if (!dataSource || !Array.isArray(dataSource) || !targetUuid) {
        console.warn("SMEE: tableData.data is not yet populated or UUID is missing.");
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
    } else {
        console.log(`DEBUG: UUID ${targetUuid} not found in current tableData page.`);
    }
}

function updateTitleUI(name, label) {
    const colors = {
        source: "darkcyan",
        author: "blue",
        class: "darkgoldenrod",
        publisher: "mediumvioletred"
    };

    requestAnimationFrame(() => {
        $("#nodeTitle span").fadeOut(100, function() {
            $(this).text(typeof toTitleCase === "function" ? toTitleCase(name) : name)
                   .removeClass("loading")
                   .css("color", colors[label] || "goldenrod")
                   .fadeIn(200);
        });
    });
}

function assertButtonTab(){
    switch(TEMPLAR.paramREC().label){
        case "source":
            $("#warp").show();
            $("#graph_search").hide();
            break;
        default:
            $("#warp").hide()
            $("#graph_search").show();
            break;
    }
}

function assertGraphButton(searchable){
    $("#graph_search").click(function(e){
        e.preventDefault();
        switch(TEMPLAR.paramREC().label){
            case "source":
              TEMPLAR.route(
                  "#titles?search=true&title=" +
                    encodeURIComponent(searchable) +
                    "&author=" +                    
                    "&classes=" +                    
                    "&class_all=false" +                    
                    "&publisher=" +
                    "&type=all" +
                    "&media=all" +                   
                    "&format=all"                     
                );
                break;
            case "author":
                TEMPLAR.route(
                      "#titles?search=true" +
                      "&title=" +                         
                        "&author=" + encodeURIComponent(searchable) +                        
                        "&classes=" +                        
                        "&class_all=false" +                        
                        "&publisher=" +
                        "&type=all" +
                        "&media=all" +                   
                        "&format=all"                     
                    );
                break;
            case "class":
                TEMPLAR.route(
                      "#titles?search=true" +
                      "&title=" +                         
                        "&author=" +                         
                        "&classes=" + '"' + encodeURIComponent(searchable) + '"' +               
                        "&class_all=false" +                        
                        "&publisher=" +
                        "&type=all" +
                        "&media=all" +                   
                        "&format=all"                
                    );
                break;
            case "publisher":
                TEMPLAR.route(
                      "#titles?search=true" +
                      "&title=" +                         
                        "&author=" +                      
                        "&classes=" +                        
                        "&class_all=false" +                        
                        "&publisher=" + encodeURIComponent(searchable) +  
                        "&type=all" +
                        "&media=all" +                   
                        "&format=all"                 
                    );
                break;

        }
    })
}