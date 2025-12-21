$(".buoys").hide();
$("#buoys").empty();
$("#buoys_h3").hide();
$("#invites_h3").hide();
$("#invites").empty();
$(".settings").hide();
$("#stats_user_uploads").hide();
$("#stats_user_downloads").hide();
$("#settings_atlsd").hide();
$("#settings_atlsd_submit").hide()
function initializeUser(cb){
	$(".stats_span").text("")
	$(".buoys").hide();
	$("#buoys").empty();
	$("#invites").empty();
	$("#buoys_h3").hide();
	$("#invites_h3").hide();
	$.get("/user/" + ANCHOR.getParams().uuid, function(data){
		$("#user_name").text(data.user.user);
		$("#stats_rank").text(data.access.rankTitle);
		$("#stats_uploads").text(data.uploads);
		var infoHashes = []
		if(data.downloaded && data.downloaded.length > 0){
			data.downloaded.forEach(function(infoHash){
				if(infoHashes.indexOf(infoHash) === -1){
					infoHashes.push(infoHash);
				}
			})

		}

		$("#stats_snatches").text(parseInt(infoHashes.length));
		if(!data.user.paranoia){
			$("#stats_user_uploads").text("[See Uploads]");
			$("#stats_user_uploads").attr("href", "#user_uploads?uuid=" + ANCHOR.getParams().uuid)
			$("#stats_user_uploads").show();
			$("#stats_user_downloads").text("[See Downloads]")
			$("#stats_user_downloads").attr("href", "#user_downloads?uuid=" + ANCHOR.getParams().uuid)
			$("#stats_payout").text(data.user.payout + " ATLANTIS!")			
		}
		$("#stats_uploaded").text(prettyBytes(data.user.totalUp));
		$("#stats_downloaded").text(prettyBytes(data.user.totalDown));
		$("#stats_ratio").text((data.user.totalUp / data.user.totalDown).toFixed(3));
		if(data.self){
			$("#settings").show();
			$("#settings_atlsd").show();
			$("#settings_atlsd_submit").show();
			$("#settings_atlsd").val(data.user.atlsd ? data.user.atlsd : "");


			
			$("#settings_atlsd_submit").click(function(){
				$(this).prop("disabled", true)
				var that = $(this);
				$.post("/settings_atlsd/" + data.user.uuid, {atlsd : $("#settings_atlsd").val()}, function(){
					that.prop('disabled', false)
				})				
			})
			if(data.user.paranoia){
				$("#paranoia").prop("checked", true)
			}
			else{
				$("#paranoia").prop("checked", false)
			}
			$("#paranoia").change(function(){
				$.post("/settings_paranoia/" + ANCHOR.getParams().uuid, {paranoia : $("#paranoia").prop("checked") }, function(data){

				})
				if($(this).prop("checked")){
					$("#stats_user_uploads").hide();
					$("#stats_user_downloads").hide();
				}
				else{
					$("#stats_user_uploads").show();
					$("#stats_user_downloads").show();
				}
			})
			/*if(data.buoys){
				data.buoys.forEach(function(buoy){	
					if(buoy.private){
						var li = document.createElement("li");
						var a = document.createElement("a");
						console.log(buoy);
						$("#buoys").append(li);
						$(li).append(a);

						$(a).attr("href", "#");
						$(a).text(buoy.buoy);
						$(a).click(function(e){
							e.preventDefault();
							setTabs();
							console.log("SETTING TABS")
							setPanel();
							switchBuoy();
							$(".buoys").val(buoy.uuid)

							ANCHOR.route("#buoy?buoy=" + buoy.uuid)
						})	
					}			
				
				})
			}*/		
			/*if(data.invite_uuids){
				data.invite_uuids.forEach(function(obj, i){
					console.log(getUser())
					var li = document.createElement("li");
					var span = document.createElement("span");
					$(span).text(data.invite_buoys[i].buoy);
					var button=document.createElement("button");

					$(button).click(function(){
						$.post("/accept_invite/" + obj.uuid,function(data){
							ANCHOR.route("#buoy?buoy="+data.invite_buoys[i].buoy);
						})
						return false;
						
					})

					$(button).text("Accept");

					$("#invites").append(li);
					$("#invites").append("<br>")
					$(li).append(span);
					$(li).append(button);
				})	
			}	
			$("#invites").show();
			$("#invites_h3").show();*/
			ANCHOR.buffer();
			/*
			$(".buoys").show();
			$("#buoys_h3").show()	
			*/
		}
		cb();
		
	})
	

}

function logout(){
	$("body").css("cursor", "progress");
	$.post("/logout", function(data){
		setUser(null);
		$("body").css("cursor", "default");
		setAccess(null);
		userPanel(null);
		//clearInterval(health.healthInterval);
		//initializeHealth();
		//initializeBuoySelect(ANCHOR.getParams().buoy);
		ANCHOR.route("#home");

	})
}

function authenticateUser(){
	$.get("/auth", function(data){
	 	setUser(data.user)
	 	userPanel(data.user)
		//initializeBuoySelect(ANCHOR.getParams().buoy);
		//clearInterval(health.healthInterval);
		//initializeHealth();
 	})
}