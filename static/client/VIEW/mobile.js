$(document).on("click", "#mobile_menu", function(e){
	e.preventDefault()
	$(".mobile_menu").slideToggle();
})

$(document).on("click", "a.TEMPLAR", function(e){
	$(".mobile_menu").slideUp()
})