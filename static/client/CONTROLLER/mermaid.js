function processMermaid(cb){
	$.post("/mermaid/" + TEMPLAR.paramREC().uuid, function(data){

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
      TEMPLAR.route("#node?label=source&uuid=" + data.source)
      cb();
    })
}

