function traverseGraph(set, searchable){
    switch(set){
            case "torrents":
              TEMPLAR.route(
                  "#torrents?search=true&title=" +
                    searchable +
                    "&author=" +                    
                    "&classes=" +                    
                    "&all=false" +                    
                    "&publisher=" +
                    "&type=all" +
                    "&media=all" +                   
                    "&format=all" +
                    "&res=all"                     
                );
                break;
            case "author":
                TEMPLAR.route(
                      "#torrents?search=true" +
                      "&title=" +                         
                        "&author=" + searchable +                        
                        "&classes=" +                        
                        "&all=false" +                        
                        "&publisher=" +
                        "&type=all" +
                        "&media=all" +                   
                        "&format=all" +
                        "&res=all"                  
                    );
                break;
            case "class":
                TEMPLAR.route(
                      "#torrents?search=true" +
                      "&title=" +                         
                        "&author=" +                         
                        "&classes=" + JSON.stringify(searchable) +               
                        "&all=false" +                        
                        "&publisher=" +
                        "&type=all" +
                        "&media=all" +                   
                        "&format=all" +
                        "&res=all"    
                    );
                break;
            case "publisher":
                TEMPLAR.route(
                      "#torrents?search=true" +
                      "&title=" +                         
                        "&author=" +                      
                        "&classes=" +                        
                        "&all=false" +                        
                        "&publisher=" + searchable +  
                        "&type=all" +
                        "&media=all" +                   
                        "&format=all" +
                        "&res=all"                
                    );
                break;

        }
}

function assertScrollPause(){
    function stopScroll(e){
        if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
              e.preventDefault();
        }
      }

      $(".graph_search").on("mouseenter", function () {
            // Your existing keydown logic
            window.addEventListener("keydown", stopScroll);

            // FIX: Explicitly handle the wheel event on the graph container
            // Use the native DOM element to set passive: false
            
        });

      $(".graph_search").on('mouseleave', function () {
        window.removeEventListener("keydown", stopScroll);
      });
}