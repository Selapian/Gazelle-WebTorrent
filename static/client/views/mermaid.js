function assertMermaid(){
  $("#warp").unbind("click");
  $("#warp").click(function(e){
    assertTitleLoading();
    $("#warp").prop("disabled", true)
    e.preventDefault();
    
    $("#sourceTitle span").text("Loading...")
    $("#sourceTitle span").addClass("loading")
    processMermaid(assertMermaidComplete)
  })
}

function assertF8(){
  if(mermaid){
    $("h2 span").removeClass("loading").text("True-Random!").css("font-family", "Roboto Flex").css("color", "darkviolet")
  }
  else{
    $("h2 span").removeClass("loading").text("Pseudo-Random").css("color", "red").css("font-family", "Roboto Flex").css("text-shadow", "none");
  }
}

function assertMermaidComplete(){
  $("#warp").prop("disabled", false)
  setTimeout(function(){
      $("h2 span").css("color", "#17627C").css("font-family", "Red Rose").css("text-shadow", "1px 1px gold");
  },777)
}

