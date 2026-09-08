const config = {
        defaultPage: "torrents",
        dir: "client/partials",
        fade: false,
        pages: ["mission", "webtorrent", "torrents", "top10", "node", "set", "upload", "privacy"],
        helm: [
            {
                page: "torrents",
                fn: function() {
                    // Priority 1: Get the list visible                    
                    initializeTorrents("torrents");
                                        
                    if(TEMPLAR.paramREC() && TEMPLAR.paramREC().search === "true"){
                        initializeGraph();
                        $(".graph_search").show();                        
                    }
                    else{
                        $(".graph_search").hide();
                    }
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
                    if (!TEMPLAR.paramREC() || !TEMPLAR.paramREC().uuid) {
                        TEMPLAR.route("#torrents");
                        return;
                    }  
                    initializeTorrents("node");
                    if(TEMPLAR.paramREC() && TEMPLAR.paramREC().label === "source"){
                        assertMermaid();
                    }                    
                }
            },
            {
                page: "set",
                fn: function() {
                    if (!TEMPLAR.paramREC() || !TEMPLAR.paramREC().ward) {
                        TEMPLAR.route("#torrents");
                        return;
                    }  
                    crossWard();
                }
            },
            {
                page: "webtorrent",
                fn: function() {
                    if(!TEMPLAR.paramREC()){
                        TEMPLAR.route("#");
                        return;
                    }
                    if(!client){
                        alert("NO CLIENT!");
                    }
                    const currentFile = {
                        infohash : TEMPLAR.paramREC().infoHash,
                        apa : TEMPLAR.paramREC().apa,
                        format : TEMPLAR.paramREC().format
                    }
                    assertHero(currentFile)                
                }
            },
            {
                page: "upload",
                fn : function(){
                    initializeUpload();
                    uploadAutocomplete();
                }
            },           
            {
                page:  "privacy",
                fn : function(){
                    $(".TEMPLAR .privacy h2 span a").show();
                }
            },
            {
                page:  "mission",
                fn : function(){
                    $(".TEMPLAR .mission h2 span a").show();
                }
            }
        ]
    }

function mount() {
    $(".autosuggestBox").hide();

    const params = TEMPLAR.paramREC() ? TEMPLAR.paramREC : {};
    $.get("../client/partials/header.html", function(data){
        $("header").html(data);            
        headerAutocomplete();

        $.get("../client/partials/hero.html", function(data){
            $("footer").html(data);
            //helm race condition
            //initializeWebtorrent();   
            TEMPLAR.initialize(config)
        })
    })

    $(document).on("TEMPLAR", function(){           
        $("#warp").hide();
        $("#graph_search").hide();
        $("h2 span a").hide()
    })

    
}

$(document).ready(function(){
    mount();
})