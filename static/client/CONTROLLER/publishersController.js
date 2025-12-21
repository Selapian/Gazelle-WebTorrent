var publishersTable;
function initializePublishers(cb){
	$("#add_class_button").removeAttr("disabled")
	if(publishersTable){
		publishersTable.destroy();
		$("#publishers tbody").empty();
		//torrentsTable.draw();
	}
	publishersTable = $("#publishers").DataTable({
		responsive : true,
		serverSide : true,
		pageLength: 25,
		processing: true,
		searching: false, paging : true, info: true,
		stateSave: true,
		ajax: {
			url: "/publishers",
			type: "POST",
			dataSrc : function(data){

				var records = [];

				data.data.forEach(function(record){
			      	//if(record._fields[0].properties.name && record._fields[0].properties.name !== "undefined" && record._fields[2] && record._fields[3]){
			      		records.push(["<a class='ANCHOR publisher' href='#publisher?uuid=" + record._fields[0].properties.uuid + "'>" + toTitleCase(decodeEntities(decodeEntities(record._fields[0].properties.name))) +"</a>", 
				      	record._fields[3] ? record._fields[3] : "", record._fields[1] ? record._fields[1] : 0] 
				      	)
			      	
				      
			    })	
			     
			      
			    
			    return records;
			}
		},
    drawCallback : function(){
      cb();
    }
  	})


}