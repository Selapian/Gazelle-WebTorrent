function processMermaid(cb){
	$.post("/mermaid/" + ANCHOR.getParams().uuid, function(data){

	  if(data.mermaid){
	  	mermaid = true;
	  }
	  else{
	  	mermaid = false;
	  }
	  assertF8();
      var uuid = data.uuid;
      //ANCHOR.removeParams("uuid");
      console.log(data)
      //ANCHOR.setParams("uuid", data.source)
      ANCHOR.route("#source?uuid=" + data.source)
      cb();
    })
}

