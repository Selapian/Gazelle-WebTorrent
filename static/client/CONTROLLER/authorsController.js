var authorsTable;
function initializeAuthors(cb){
	$("#add_class_button").removeAttr("disabled")
	if(authorsTable){
		authorsTable.destroy();
		$("#authors tbody").empty();
		//torrentsTable.draw();
	}




	authorsTable = $("#authors").DataTable({
		responsive : true,
		serverSide : true,
		pageLength: 25,
		processing: true,
		searching: false, paging : true, info: true,
		stateSave: true,
		ajax: {
			url: "/authors",
			type: "POST",
			dataSrc : function(data){

				var records = [];

				data.data.forEach(function(record){

			      	//if(record._fields[0].properties.name && record._fields[0].properties.name !== "undefined" && record._fields[2] && record._fields[3]){
			      
				      records.push(["<a class='ANCHOR author' href='#author?uuid=" + record._fields[0].properties.uuid + "'>" + decodeEntities(decodeEntities(record._fields[0].properties.author)) +"</a>", 
				      	record._fields[2], record._fields[3]] 
				      	)
			      	//}	
			    })	
			     
			      
			    
			    return records;
			}
		},
		drawCallback : function(){
			//ANCHOR.buffer();
			cb();
		}

  	})
    //$('th').unbind('click.DT')


}