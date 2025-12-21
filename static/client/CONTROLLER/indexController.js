var count = 0; //HOTFIX: REMOVE
var firstLoad = true;
 function init(){
 
	$(".autosuggestBox").hide();
	ANCHOR.buffer();
 }

 function pages(){
    if(!ANCHOR.page() || ANCHOR.page()  === "titles"){
   
    	$.get("../client/VIEW/titles.html", function(data){
          
					
          $("div.titles").html(data)
          htmlSearch();
          
          if(ANCHOR.getParams() && ANCHOR.getParams().search){
          	initializeGraph()
          	$("#search_graph").fadeIn();
          }
          initializeTorrents("torrents")


		  	
    		ANCHOR.buffer();
    	})
  	}
    else  if(ANCHOR.page() === "source"){
		$.get("../client/VIEW/source.html", function(data){
		
		$("div.source").html(data);
			assertMermaid();
			initializeTorrents(ANCHOR.page());

			ANCHOR.buffer();
		})
		  	
		  
		  
		  //if(windowsize >= 1080) {
		  	//initializeGraph()
		  //}
    }
    else if(ANCHOR.page() === "author"){

		$.get("../client/VIEW/author.html", function(data){
			$("div.author").html(data);
				
	 		initializeTorrents(ANCHOR.page());
	 	    ANCHOR.buffer();

		})
    	
    	  		
    }
    else if(ANCHOR.page() === "class"){
		  
		$.get("../client/VIEW/class.html", function(data){
			$("div.class").html(data);
	 		initializeTorrents(ANCHOR.page());
	 		ANCHOR.buffer();

		})
    	
    	
    }
    else if(ANCHOR.page() === "publisher"){
		  $.get("../client/VIEW/publisher.html", function(data){
    		$("div.publisher").html(data);
    			
          	initializeTorrents(ANCHOR.page());
		  	ANCHOR.buffer();
    	  })
    	
		
    
    }
   

	else if(ANCHOR.page() === "top10"){
		//sort of wonky dismisslaoder

		$.get("../client/VIEW/top10.html", function(data){
			
      	$("div.top10").html(data);
      	
      	initializeTorrents("top10_day");
	    initializeTorrents("top10_week");
	    initializeTorrents("top10_month");
	    initializeTorrents("top10_year");
	    initializeTorrents("top10_alltime");  
	    ANCHOR.buffer();
	    htmlSearch();
      

		})
    	
    	

		//initializeTorrents("top10_alltime", );
	}
	else if(ANCHOR.page() === "upload"){
		count++;
		$.get("../client/VIEW/upload.html", function(data){
			$("div.upload").html(data);
			htmlUpload();
      		htmlSearch();
      		initializeUpload();
			ANCHOR.buffer();

		})
		//initializeLoader();
	}
	else if(ANCHOR.page() === "publishers"){
		$.get("../client/VIEW/publishers.html", function(data){
			$("div.publishers").html(data);
			initializePublishers();
    		$("div.publishers").show();
			ANCHOR.buffer();			
		})
	}
	else if(ANCHOR.page() === "authors"){
		$.get("../client/VIEW/authors.html", function(data){
				$("div.authors").html(data);
				initializeAuthors();	
				ANCHOR.buffer();		
			})
	}
	else if(ANCHOR.page() === "classes"){
   		
      $.get("../client/VIEW/classes.html", function(data){
				$("div.classes").html(data);
				initializeClasses();			
				ANCHOR.buffer();
			})
            
   		 
   	}	
   	else if(ANCHOR.page() === "torrent"){
   		$.get('../client/VIEW/torrent.html', function(data){
			$("div.torrent").html(data);
            initializeTorrent(); 
			
		
		})
   	}
   	
}
 

$(document).ready(function(){
	
  ANCHOR.setDefault("titles")
  var $window = $(window);  
  
  // Bind event listener
  function checkWidth() {
	  var windowsize = $window.width();
	  if (windowsize >= 1080) {
	      //if the window is greater than 440px wide then turn on jScrollPane..
	      $(".mobile_menu").hide();
	      //this is because if you switch the width on desktop it should change to desktop
	  }
	}
  $(window).resize(checkWidth);

	$(document).on("ANCHOR", function(){
		if(!firstLoad){
			init();

			pages();
		}
	
		firstLoad = false;
		$(".mobile_menu").slideUp();
	})



					
							
$.get("../client/VIEW/header.html", function(data){
	$("header").html(data);
	DMCA();
	$('#mobile_menu').click(function(e){
		e.preventDefault();
  		$(".mobile_menu").slideToggle();

	})   
	
	


   htmlSearch();
	

  ANCHOR.buffer();																				
  var page = ANCHOR.page();

  if(!$.isEmptyObject(ANCHOR.getParams())){
    ANCHOR.route("#" + page + "?" + ANCHOR.getParamsString());
  }							    	
  else{
    ANCHOR.route("#" + page)
  }

  init();
  

  pages();   
	
})

})