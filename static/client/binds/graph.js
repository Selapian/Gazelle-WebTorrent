function traverseGraph(set, searchable){
    switch(set){
            case "source":
              TEMPLAR.route(
                  "#torrents?search=true&title=" +
                    searchable +
                    "&author=" +                    
                    "&classes=" +                    
                    "&class_all=false" +                    
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
                        "&class_all=false" +                        
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
                        "&class_all=false" +                        
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
                        "&class_all=false" +                        
                        "&publisher=" + searchable +  
                        "&type=all" +
                        "&media=all" +                   
                        "&format=all" +
                        "&res=all"                
                    );
                break;

        }
}
