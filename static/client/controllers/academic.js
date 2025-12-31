function assertReference(currentFile){
	if ($('.academic option[value="' + currentFile.id + '"]').length > 0) {
        // Option exists, just sync the dropdown value and exit
        switchSelect(currentFile);
        return;
    }
	const option = document.createElement("option");
	$(option).val(currentFile.id)
	$(option).text(currentFile.apa + " (" + currentFile.format + ")");
	
	$(".academic").append(option);
	$(".academic").off("change")
	$(".academic").on("change", function(){

		var optionSelected = $(this).find('option:selected');
		const QFILE = queue.find(Q => Q.id === parseInt($(optionSelected).val()));
		if($(optionSelected).val() === "null"){
			return;
		}

		TEMPLAR.route("#file?id=" + QFILE.id + "&media=" + QFILE.media + "&format=" + QFILE.format + "&release=" + QFILE.release + "&apa=" + QFILE.apa);
	})

	switchSelect(currentFile);

}


function switchSelect(currentFile){
	$(".academic").val(currentFile.id);	
}