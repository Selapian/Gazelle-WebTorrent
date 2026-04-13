function assertMermaid(){
  $("#warp").unbind("click");
  $("#warp").click(function(e){
    assertTitleLoading();
    $("#warp").prop("disabled", true)
    e.preventDefault();
    
    $("#sourceTitle span a").text("Loading...")
    $("#sourceTitle span a").addClass("loading")
    processMermaid(assertMermaidComplete)
  })
}

function assertF8(){
  if(mermaid){
    $("h2 span a").removeClass("loading").text("True-Random").addClass("gold")
  }
  else{
    $("h2 span a").removeClass("loading").text("Pseudo-Random").addClass("red");
  }
}

function assertMermaidComplete(){
  $("#warp").prop("disabled", false)

}

