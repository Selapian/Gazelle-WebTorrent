function processMermaid(cb){
	$.post("/mermaid/" + TEMPLAR.paramREC().uuid, function(data){

	  if(data.mermaid){
	  	mermaid = true;
	  }
	  else{
	  	mermaid = false;
	  }
	  
      var uuid = data.uuid;
      //ANCHOR.removeParams("uuid");
      //ANCHOR.setParams("uuid", data.source)


      //faster without re-route
      TEMPLAR.paramSET({uuid : uuid, from_qrng : mermaid}, true);
      initializeTorrents("node");
      assertF8();      
      cb();
    })
}

