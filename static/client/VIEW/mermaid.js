/*function assertHieroglyph(){
  const index = Math.floor(Math.random() * 1071)

  $("#warp").text(hieroglyphs[index])
}*/

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
    $("h2 span").removeClass("loading").text("MERMAID: True-Random!").addClass("violet").css("font-family", "Bitcount Prop Single").css("color", "violet");
  }
  else{
    $("h2 span").removeClass("loading").text("Consolations, Pseudo-Random...").addClass("violet").css("color", "red").css("font-family", "Bitcount Prop Single");
  }
}

function assertMermaidComplete(){
  $("#warp").prop("disabled", false)

  $("h2 span").removeClass("red").removeClass("violet");
}

