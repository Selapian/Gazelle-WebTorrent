var upload;
var initialized;

function initializeUpload(){

	htmlUpload();
	$("#errorsDiv").empty();
	var uuid;
	var params = TEMPLAR.paramREC();

	$("#uuid").hide();

	//editing edition
	if(!$.isEmptyObject(params)){
		if(params.uuid){

			uploadModel.uuid = params.uuid;
			$("#uploadHeading a").text("Editing");
			$("#uploadHeading a").attr("href", "#upload?uuid=" + uploadModel.uuid);
			$("#uuid").show()
			$("#uuid").val(uploadModel.uuid)
			$("#uuid").prop("disabled", true)
			
			$(".DMCA").show();
			$(".merge_source").show();

			$(".newUpload").hide();
			//get the data for this uuid, it's a new format being added
			
			caller = setTimeout(function(){
				$.get("/upload/" + uploadModel.uuid, function(data){
					$("#up_submit").prop("disabled", false)
					if(!data.record){
						resetUpload();
	
						return;
					}
					
					$("#newUploadHeader a").text(" " + toTitleCase(decodeEntities(decodeEntities(data.record._fields[0]))))
          $("#newUploadHeader a").attr("href", "#node?label=source&uuid=" + uploadModel.uuid);
          $("#newUploadHeader a").addClass("TEMPLAR")
          $("#newUploadHeader a").addClass("source")
					$("#newUploadHeader a").click(function(e){
						e.preventDefault();
						TEMPLAR.route("#source?uuid=" + uploadModel.uuid)
					})
					$("#title").val(decodeEntities(decodeEntities(data.record._fields[0]))).trigger("change")
					$("#date").val(decodeEntities(decodeEntities(data.record._fields[3]))).trigger("change");
					data.record._fields[1].forEach(function(author){
						addAuthor(author);
					})
					
					if(data.record._fields[2] && data.record._fields[2].length > 0){
						$("#classes_input").val(data.record._fields[2].join(", ")).trigger("change");
					}

					$("#edition_select").empty();
					uploadModel.editions = [];
					$("#edition_select").append("<option value='new'>New Edition</option>")
					$("#edition_select").val("new").trigger("change");
					$(".existing_edition").show();
					$("#edition_select").show();
					$("#edition_select").change(function(){
						if($("#edition_select").val() !== 'new'){
							$("#newEdition").hide();
						}
						else{
							$("#newEdition").show();
						}
					})
					data.record._fields[4].forEach(function(edition, j){
						var option = document.createElement("option");
						var publisherHtml = "";
						var editionField = "";
			      	data.record._fields[1].forEach(function(field, i){
				      	editionField += field.name ? decodeEntities(decodeEntities(field.name)) : ""
				      	if(data.record._fields[1][i+1]){
				      		editionField += ", "
				      	}
								else if(field.name && !field.name.endsWith(".")){
									editionField += ". "
								}
								else{
									editionField += " "
								}
				      })
				      editionField += data.record._fields[3] ? "(" + decodeEntities(decodeEntities(data.record._fields[3])) + (edition.date ? "-" + 
				      	decodeEntities(decodeEntities(edition.date)) + "). " : "). ") : ""
				      editionField += decodeEntities(decodeEntities(data.record._fields[0])) + ". "


				      if(edition.publisher){
				        publisherHtml += edition.publisher ? decodeEntities(decodeEntities(edition.publisher)) + ". " : " "
				      }
				     
				      if(edition.title){
				      	if(!edition.title.endsWith(".")){
				      		editionField += decodeEntities(decodeEntities(edition.title)) + ". "
				      	}
				      	else{
				      		editionField += decodeEntities(decodeEntities(edition.title)) + " ";
				      	}
				      }
				      editionField += publisherHtml;
				      if(edition.no){
				      	editionField += "(" + decodeEntities(decodeEntities(edition.no)) + ")"
				      	if(edition.pages){
				      		editionField += ", "
				      	}
				      }
				      if(edition.pages){
				      	editionField += decodeEntities(decodeEntities(edition.pages)) + "."
				      }
						
						$(option).val(editionField);
						$(option).text(editionField);
						$("#edition_select").append(option);
						uploadModel.editions.push(edition);
					})
				
					$("#edition_title").val("");
					$("#edition_title").trigger("change");

					$("#edition_date").trigger("change");

					$("#edition_date").val("").trigger("change");

			
					//$("#edition_title").val($("#edition_select").val());

					//$("#edition_select").off();


					$("#edition_select option").each(function(){
					})

					$("#edition_select").change(function(){
						if($("#edition_select").val() !== "new"){
							var pos = $("#edition_select").prop('selectedIndex') - 1;

							//edition array holds old selection
							uploadModel.editions[pos].uuid = data.record._fields[4][pos].uuid;
							uploadModel.edition.edition_uuid = data.record._fields[4][pos].uuid;

							$("#edition_title").val(uploadModel.editions[pos].title).trigger("change");
							$("#edition_no").val(uploadModel.editions[pos].no).trigger("change");
							$("#edition_date").val(uploadModel.editions[pos].date).trigger("change");
							$("#edition_publisher").val(uploadModel.editions[pos].publisher).trigger("change");
							$("#edition_pages").val(uploadModel.editions[pos].pages).trigger("change");
							uploadModel.editions[pos].title = data.record._fields[4][pos].title;
							uploadModel.editions[pos].no = data.record._fields[4][pos].no
							uploadModel.editions[pos].date = data.record._fields[4][pos].date 
							uploadModel.editions[pos].publisher = data.record._fields[4][pos].publisher
							uploadModel.editions[pos].pages = data.record._fields[4][pos].pages

						}
						else{
							uploadModel.edition.edition_uuid = null;
							
						}

					})


					$("#edition_publisher").change(function(){
						uploadModel.edition.edition_publisher = $("#edition_publisher").val();
					})

					$("#edition_pages").change(function(){
						uploadModel.edition.edition_pages = $("#edition_pages").val();
					})

					$("#edition_img").change(function(){
						uploadModel.edition.edition_img = $("#edition_img").val();
					})

					$("#edition_date").change(function(){
						uploadModel.edition.edition_date = $("#edition_date").val();
					})

					$("#edition_title").change(function(){ //this is the edition or volume, not the publisher
						uploadModel.edition.edition_title = $("#edition_title").val();
					})


					types.forEach(function(val){
						var option = document.createElement("option");
						$(option).val(val);
						$(option).text(decodeEntities(decodeEntities(decodeEntities(val))));
						$("#type").append(option);
						$("#type").val(data.record._fields[6]);
						uploadModel.type = $("#type").val();
					})

					media.forEach(function(val){
							var option = document.createElement("option");
							$(option).val(val);
							$(option).text(decodeEntities(decodeEntities(val)));
							$("#media").append(option);
							uploadModel.torrent.media = $("#media").val();
						})

					formats.forEach(function(val){
							var option = document.createElement("option");
							$(option).val(val);
							$(option).text(decodeEntities(decodeEntities(val)));
							$("#format").append(option);
							uploadModel.torrent.format = $("#format").val();
					})
			
				})
			},100)			
			
		}
	}
	if($.isEmptyObject(params)){
			console.log(types);
			types.forEach(function(val){
				var option = document.createElement("option");
				$(option).val(val);
				$(option).text(decodeEntities(decodeEntities(val)));
				$("#type").append(option);
				uploadModel.type = $("#type").val();
			})

			media.forEach(function(val){
				var option = document.createElement("option");
				$(option).val(val);
				$(option).text(decodeEntities(decodeEntities(val)));
				$("#media").append(option);
				uploadModel.torrent.media = $("#media").val();

			})

			formats.forEach(function(val){
				var option = document.createElement("option");
				$(option).val(val);
				$(option).text(decodeEntities(decodeEntities(val)));
				$("#format").append(option);
				uploadModel.torrent.format = $("#format").val();

			})

	}

	$("#format").change(function(){
		uploadModel.torrent.format = $(this).val();
	})

	$("#media").change(function(){
		uploadModel.torrent.media = $(this).val();
	})
		

}

function addAuthor(data){
	if(!data || !data.name){
		return false;
	}
	uploadModel.authors.push({
		uuid : data.uuid,
		name : data.name
	});

	addAuthorArea(uploadModel.authors[uploadModel.authors.length - 1].uuid, uploadModel.authors[uploadModel.authors.length - 1].name, function(err, div, select, remove, id){

		$(remove).click(function(){
			removeAuthorArea(div, id);
			uploadModel.authors = uploadModel.authors.filter(function( obj ) {
			    return obj.uuid !== data.uuid;
			});
		})
	});

	return false;

}

function htmlUpload(){
	resetUpload();
	TEMPLAR.DOM();
	 //updateUpload();

	$("#newEdition").hide();
	$("#edition_select").hide();

	$("#edition").hide();
	$("#edition_check").click(function(){
		if($(this).is(":checked")){
			$("#edition").show();
			$("#newEdition").show();
		}
		else{
			$("#newEdition").hide();
			$("#edition").hide()
		}
	})


	$("#author_importance").hide();
	$("#author_role").hide();
  var apa;
	$("#APA").click(function(e){
		e.preventDefault();
    apa = APA();
		copyToClipboard(apa);
		function copyToClipboard(name) {
		    var $temp = $("<input>");
		    $("body").append($temp);
		    $temp.val(name).select();
		    document.execCommand("copy");
		    $temp.remove();
		}
		function APA(){
		


		  	var publisherHtml = "";
		  	var editionField = "";
		   uploadModel.authors.forEach(function(field, i){
		      	editionField += decodeEntities(decodeEntities(field.name))
		      	if(uploadModel.authors[i+1]){
		      		editionField += ", "
		      	}
					else if(field.name && !field.name.endsWith(".")){
						editionField += ". "
					}
					else{
						editionField += " "
					}
		      })
		      if(!uploadModel.date && $("#edition_date").val()){
		      	editionField += "(" + $("#edition_date").val() + "). ";
		      }
		      else{
		     	 editionField += uploadModel.date ? "(" + 
		     	 uploadModel.date + ($("#edition_date").val() && $("#edition_date").val() !== 
		     	 	uploadModel.date ? "-" + 
		     	 	$("#edition_date").val() + "). " : "). ") : ""

		      }
		      editionField += uploadModel.title + '. '
		      editionField = editionField.replace(':', " - ");
          editionField = editionField.substring(0,150)
		   		if(editionField.length === 150){
		   			editionField = editionField + "..."
		   		}

		      if(uploadModel.edition.edition_publisher){
		      	if(uploadModel.edition.edition_publisher && uploadModel.edition.edition_publisher.endsWith(".")){
		        	publisherHtml += uploadModel.edition.edition_publisher ? uploadModel.edition.edition_publisher + " " : " "
		      	}
		      	else{
		        	publisherHtml += (uploadModel.edition.edition_publisher ? uploadModel.edition.edition_publisher : " ") + 
		        	(uploadModel.type !== "Journal" ? ". " : (uploadModel.edition.edition_title ? ", " : "."))
		      	}
		      }
		     if(uploadModel.type === "Journal"){
		     	  editionField += publisherHtml;
		     }
		      if(uploadModel.edition.edition_title && uploadModel.edition.edition_title !== ""){
		      	if(!uploadModel.edition.edition_title.endsWith(".")){
		      		editionField += uploadModel.edition.edition_title + (uploadModel.type !== "Journal" ? ". " : "")
		      	}
		      	else{
		      		editionField += uploadModel.edition.edition_title + " ";
		      	}
		      }
		      if(uploadModel.type !== "Journal"){
		      	editionField += publisherHtml;
		      }
		      if(uploadModel.edition.edition_no){
		      	editionField += "(" + uploadModel.edition.edition_no + ")"
		      	if(uploadModel.edition.edition_pages){
		      		editionField += ": "
		      	}
		      }
		      if(uploadModel.edition.edition_pages){
		      	editionField += uploadModel.edition.edition_pages + "."
		      }
		  
		   		
		   		
		   		
		      return editionField.trim()
		}

	})

	/*$("input:file").change(function(){
		function renameFile(originalFile, newName) {
		    return new File([originalFile], newName, {
		        type: originalFile.type,
		        lastModified: originalFile.lastModified,
		    });
		}



		
		var files = this.files; 
		
			seed(files, function(err, torrent){

				//alert("Please download the torrent file and seed in BiglyBT with the WebTorrent plugin. Other torrent clients do not support WebTorrent seeding to the Browser. ****WEBTORRENT DESKTOP IS CURRENTLY BROKEN, SO DO NOT USE IT****")
				$(".torrentArea").empty();
				uploadModel.torrent.length = torrent.length;
				uploadModel.torrent.infoHash = torrent.infoHash;
				uploadModel.torrent.torrentFileBlobURL = torrent.torrentFileBlobURL;
				uploadModel.torrent.media = $("#media").val();
				uploadModel.torrent.format = $("#format").val();
				$(".torrentArea").append('<a href="' + torrent.torrentFileBlobURL + '" target="_blank" download="' + torrent.name + '.torrent">[Torrent]</a>')
            $(".torrentArea").append('&nbsp;<a href="magnet:?xt=urn:btih:' + torrent.infoHash + "&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337");     		
		
	})*/

    $('input:file').change(function() {
    // Reference the underlying HTMLInputElement
	    var fileList = this.files;
	    var totalSize = 0;

	    for (var i = 0; i < fileList.length; i++) {
	        totalSize += fileList[i].size;
	    }
	    const files = this.files;

  		uploadModel.torrent.size = totalSize;

  		WT.seed(files, function(torrent){
  			console.log(torrent);
			$("#MG").empty();
			uploadModel.torrent.infoHash = torrent.infoHash;
			$("#MG").append('<br><a href="' + torrent.torrentFileBlobURL + '" target="_blank" download="' + torrent.name + '.torrent">[Torrent]</a>')

            $("#MG").append("&nbsp;<a href='magnet:?xt=urn:btih:" + torrent.infoHash + "&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337'>[magnetURI]</a>");     		
		});
  	})

	$("#title").change(function(){
		uploadModel.title = $("#title").val();
	})


	$("#date").change(function(){
		uploadModel.date = $("#date").val();
	})


	$("#type").change(function(){
		uploadModel.type = $("#type").val();
	})

	$("#media").change(function(){
		uploadModel.torrent.media = $("#media").val();
	})

	$("#format").change(function(){
		uploadModel.torrent.format = $("#format").val();
	})

	$("#edition_publisher").change(function(){
		uploadModel.edition.edition_publisher = $("#edition_publisher").val();
	})

	$("#edition_title").change(function(){
		uploadModel.edition.edition_title = $("#edition_title").val();
	})

	$("#edition_date").change(function(){
		uploadModel.edition.edition_date = $("#edition_date").val();
	})

	$("#edition_pages").change(function(){
		uploadModel.edition.edition_pages = $("#edition_pages").val();
	})

	$("#edition_img").change(function(){
		uploadModel.edition.edition_img = $("#edition_img").val();
	})

	$("#edition_no").change(function(){
		uploadModel.edition.edition_no = $("#edition_no").val()
	})

	

	$("#add_author").click(function(e){
		e.preventDefault();

      $("body").css("cursor", "progress");
		$.post("/add_author", {name : $("#author_input").val()}, function(data){
        $("body").css("cursor", "default");
			addAuthor(data);
		})
	})


	$("#create_author").click(function(e){
		e.preventDefault();
       $("body").css("cursor", "progress");
		var retVal = confirm("Are you sure this author does not exist? Please create Author using APA format: Last name, Initials");
           if( retVal === false ) {
              return false;
          }
		$.post("/create_author", {name : $("#author_input").val()}, function(data){
         $("body").css("cursor", "default");
			addAuthor(data);
		})
	})

	$("#classes_input").change(function(){
		uploadModel.classes = $("#classes_input").val().split(",");		
	})

	$("#up_submit").click(function(e){
		e.preventDefault();
    /*if($("#link_address").val() === ""){
      alert("You must enter a valid LINK address, even if your torrent is in the Public Domain.")
      return;
    }*/
		$("#up_submit").prop("disabled", true)
		$("body").css("cursor", "progress");
		$.post("/upload/" + uploadModel.uuid, {size: uploadModel.torrent.size, APA : apa, type: uploadModel.type, edition_pages : uploadModel.edition.edition_pages, edition_publisher : uploadModel.edition.edition_publisher,
		 date: uploadModel.date, title : uploadModel.title, authors : JSON.stringify(uploadModel.authors), torrent : JSON.stringify(uploadModel.torrent), 
			edition_date : $("#edition_date").val(), edition_uuid : uploadModel.edition.edition_uuid, 
			edition_title : uploadModel.edition.edition_title, edition_no : uploadModel.edition.edition_no, classes : JSON.stringify(uploadModel.classes)},
			 function(data){
			 	$("body").css("cursor", "default");
			if(data.errors && data.errors.length > 0){
				addError(data.errors[0].msg);
        alert(data.errors[0].msg)
				$("#up_submit").prop("disabled", false)
        return;
			}
			else{				
				resetUpload();
			}
			if(data.uuid)
				//postHealth();
				TEMPLAR.route("#node?label=source&uuid=" + data.uuid);
			return false; 
		})
	})


	initialized = true;

}

function resetUpload(){
		

    
		$(".newUpload").show();
		$("#newUploadHeader a").text("")
		authorCount = 0;

		$("#edition_select").empty();
		$("#edition_select").off("change");
		$(".torrentArea").empty();
		uploadModel.torrent = {infoHash : "", media : "", format : ""};
		uploadModel.uuid = undefined;
		uploadModel.edition = {
		edition_date : "",
		edition_title : "",
		edition_img : "",
		edition_publisher : "",
		edition_no : "",
		edition_pages : "",
		edition_uuid : "null"
		};

		uploadModel.editions = [];
		uploadModel.date = "";
		uploadModel.authors = [];
		uploadModel.classes = []
		uploadModel.title = "";
	
		$(".merge_source").hide();
		$("#merge_source_input").val("");
		$("#uploadHeading a").text("Upload")

		$(".torrent_a").remove();

		$("#title").val("");
		$("#date").val("");

		$("#author_input").val("");
		$(".removeAuthor").click();
		$(".author_break").remove();

		$("#upload_files").val(null);
		$("#classes_input").val("");
	

		$("#edition_publisher").val("");
		$("#edition_pages").val("");
		$("#edition_title").val("");
		$("#edition_date").val("");
		$("#edition_img").val("");
		$("#edition_no").val("");

		$("#edition_title").prop("disabled",false)
		$("#edition_date").prop("disabled",false)
		$("#edition_no").prop("disabled",false)
		$("#edition_publisher").prop("disabled",false)
		$("#edition_pages").prop("disabled",false)

		//$("#tags_select").val("----")

		$("#edition_check").prop("checked", false)
		$("#edition").hide();

		//$("#edition_select").append("<option selected value='Standard Edition'>Standard Edition</option>")
		$("#edition_select").hide();
		$(".existing_edition").hide();
		//$("#media").val("ebook");
		//$("#format").val("PDF")

		$(".break").remove();

		$("#type").empty();
		$("#media").empty();
		$("#format").empty();
		$("#up_submit").prop("disabled", false)

		//$("#errorsDiv").empty();
}
	
