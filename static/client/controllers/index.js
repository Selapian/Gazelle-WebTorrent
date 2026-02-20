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
        pages: ["file", "top10", "titles", "node", "set", "upload"],
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
                    
                    advAutocomplete();
                    
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
                    initializeTorrents("node");
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
                    /*const QFILE = Q_FILE();
                    if(QFILE){
                        assertReference(QFILE);             
                    }
                    if(torrent && torrent.files && torrent.files.length > 0){
                        selectFile(QFILE);                                               
                    }*/
                    assertHero(TEMPLAR.paramREC().infoHash, TEMPLAR.paramREC().APA, TEMPLAR.paramREC().format);    
                    DL(TEMPLAR.paramREC().infoHash);

                    
                }
            },
            {
                page: "upload",
                fn : function(){
                    initializeUpload();
                    uploadAutocomplete();
                }
            }
        ]
    }, function(){
        $.get("../client/partials/hero.html", function(data){
            $("footer").html(data);
            if(TEMPLAR.pageREC() === "file"){
                assertReference(Q_FILE());     
            }
            headerAutocomplete();
            
            // Use a timeout to stagger the initialization of magnets
            //setTimeout(initializeMagnets, 0);

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