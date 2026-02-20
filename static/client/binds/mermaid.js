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
    $("h2 span").removeClass("loading").text("True-Random").addClass("gold")
  }
  else{
    $("h2 span").removeClass("loading").text("Pseudo-Random").addClass("red");
  }
}

function assertMermaidComplete(){
  $("#warp").prop("disabled", false)

}

