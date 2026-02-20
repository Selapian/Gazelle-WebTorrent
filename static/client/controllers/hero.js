function assertHero(infoHash, APA, format){
	if ($('.academic option[value="' + infoHash + '"]').length > 0) {
        // Option exists, just sync the dropdown value and exit
        selectAcademic(currentFile);
        return;
    }

	const option = document.createElement("option");
	$(option).val(infoHash)
	$(option).text(decodeURIComponent(APA) + " (" + format + ")");
	
	$(".academic").append(option);
	$(".academic").off("change")
	$(".academic").on("change", function(){

		var optionSelected = $(this).find('option:selected');
		if($(optionSelected).val() === "null"){
			return;
		}

		TEMPLAR.route("#file?infoHash=" + infoHash + "&APA=" + APA + "&format=" + format;
	})

	selectAcademic(infoHash);

}


function selectAcademic(infoHash){
	$(".academic").val(infoHash);	
}