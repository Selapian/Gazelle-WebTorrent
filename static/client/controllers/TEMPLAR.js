/**
 * THE TEMPLAR INDEX: A fusion of maritime discipline and existential clarity.
 * We resolve to make the code sail by ensuring its properties are 'Ready-to-hand'.
 */
function mount() {
    $(".autosuggestBox").hide();

    TEMPLAR.initialize({
        defaultPage: "titles",
        dir: "client/partials",
        fade: true,
        pages: ["file", "top10", "titles", "node", "set"],
        helm: [
            {
                page: "titles",
                fn: function() {
                    // Priority 1: Get the list visible
                    initializeTorrents("torrents");
                    
                    // Priority 2: Defer the heavy graph and search logic
                    setTimeout(() => {
                        if(TEMPLAR.paramREC() && TEMPLAR.paramREC().search === "true"){
                            initializeGraph(); // Likely the source of the 710ms reflow
                            $(".graph_search").fadeIn(333);
                        }                        
                    }, 50); // Small delay to allow Torrent list to render first
                    
                    htmlSearch();
                    
                }
            },
            {
                page: "top10",
                fn: function() {
                    initializeTorrents("day");  
                    initializeTorrents("week");
                    initializeTorrents("month");
                    initializeTorrents("year");
                    //initializeTorrents("alltime");
                }
            },
            {
                page: "node",
                fn: function() {
                    initializeNode();
                    assertButtonTab();
                    $("button").hide();
                    if(TEMPLAR.paramREC() && TEMPLAR.paramREC().label === "source"){
                        assertMermaid();
                    }                    
                }
            },
            {
                page: "set",
                fn: function() {
                    crossWard();
                }
            },
            {
                page: "file",
                fn : function(){
                    const QFILE = Q_FILE();
                    //if metadata is downloaded, and #file routes, and file has not yet been downloaded
                    //throttle the file
                    
                    
                    if(QFILE){
                        assertReference(QFILE);       //defends against redundancy                 
                        /*QFILE.fileRefs.forEach(function(file){
                            file.appendTo("#output")
                        })*/
                    }
                    if(torrent && torrent.files && torrent.files.length > 0){
                        selectFile(QFILE);
                                               
                        $("#anonymous").fadeIn(1337);
                    }

                    
                }
            }
        ]
    }, function(){
        $.get("../client/partials/hero.html", function(data){
            $("footer").html(data);
            if(TEMPLAR.pageREC() === "file"){
                var QFILE = Q_FILE();
                assertReference(QFILE);     
            }
            htmlSearch();
            
            // Use a timeout to stagger the initialization of magnets
            setTimeout(initializeMagnets, 0);

        })

        $(document).on("TEMPLAR", function(){
            if(TEMPLAR.pageREC() !== "file"){           
                $(".academic").prop("selectedIndex", 0)
                $(".academic").trigger("change");
            }            
        })

        
    });
}

$(document).ready(function(){
    mount();
})