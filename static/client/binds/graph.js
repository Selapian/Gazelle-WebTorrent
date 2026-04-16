function traverseGraph(set, searchable){
    switch(set){
            case "source":
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

function scrollBind() {
    const $container = $('div.TEMPLAR');
    const $target = $("#graph_scroll");

    // Ensure elements exist before running
    if (!$container.length || !$target.length) return;

    // Check if the container is currently at the top
    const isAtTop = $container.scrollTop() <= 5; 

    if (isAtTop) {
        // CORRECT MATH: 
        // (Target's distance from document top) - (Container's distance from document top)
        const targetScrollPos = $target.offset().top - $container.offset().top + $container.scrollTop();

        $container.stop(true, false).animate({
            scrollTop: targetScrollPos
        }, 400); // Added a default speed for smoothness
    }
}