function assertTitleLoading(){
  $("h2 span").hide();

  $("h2 span").text("Loading...").addClass("loading").fadeIn()
}

//because when the page is already loaded, initializeTorrents isn't called
function assertTorrentsTitleLoaded(){
  if(ANCHOR.getParams() && ANCHOR.getParams().search){
    $("#torrentsTitle span").text("Graph Search").removeClass("loading").fadeIn(3000)

  }
  else{
    $("#torrentsTitle span").text("Titles").removeClass("loading").fadeIn(3000)

  }

}

function assertTitleLoaded(){

  switch (ANCHOR.page()) {
    case "titles":
      assertTorrentsTitleLoaded();
      break;
    case "top10":
      $("#top10Title span").text("Top 10").removeClass("loading").show();
      break;
    case "source":
       console.log("SOURCE")
      //TODO: maybe multiple calls here
      //$.get("/source_info/" + ANCHOR.getParams().uuid, function (data) {
        $("#sourceTitle span").text(decodeEntities(decodeEntities(tableData.data[0]._fields[0].properties.name))).removeClass("loading").show()
        /*$("#addFormat").click(function () {
          ANCHOR.route("#upload?uuid=" + ANCHOR.getParams().uuid);
        });*/
     
        ANCHOR.buffer();
      //});
      break;
    case "author":
          initializeNodes(decodeEntities(decodeEntities(tableData.data[0]._fields[5].properties.name)))
         $("#authorTitle span").text(decodeEntities(decodeEntities(tableData.data[0]._fields[5].properties.name))).removeClass("loading").show()
         

      break;
    case "class":
        initializeNodes(decodeEntities(decodeEntities(tableData.data[0]._fields[5].properties.name)))
        $("#classTitle span").text(decodeEntities(decodeEntities(tableData.data[0]._fields[5].properties.name))).removeClass("loading").show()
      
      break;
    case "publisher":
        initializeNodes(decodeEntities(decodeEntities(tableData.data[0]._fields[5].properties.name)))      
      $("#publisherTitle span").text(decodeEntities(decodeEntities(tableData.data[0]._fields[5].properties.name))).removeClass("loading").show();
      
      break;
    default:
      assertTorrentsTitleLoaded();

  }
}

function assertGraphSearch(){
  $("#adv_class_all").prop("checked", false);
  $("#adv_class_any").prop("checked", true)
  
  if(ANCHOR.getParams() && ANCHOR.getParams.class_all){
    
    $("#adv_class_all").prop("checked", true);
    $("#adv_class_any").prop("checked", false);
  }
  else{
    $("#adv_class_all").prop("checked", false);
    $("#adv_class_any").prop("checked", true);
  }
  $("#adv_title").val(
    ANCHOR.getParams() && ANCHOR.getParams().title
      ? ANCHOR.getParams().title
      : ""
  );
  $("#adv_author").val(
    ANCHOR.getParams() && ANCHOR.getParams().author
      ? ANCHOR.getParams().author
      : ""
  );
  $("#adv_classes").val(
    ANCHOR.getParams() && ANCHOR.getParams().classes
      ? decodeEntities(ANCHOR.getParams().classes) === "undefined"
        ? ""
        : decodeEntities(ANCHOR.getParams().classes).replace(/['"]+/g, "")
      : ""
  );
  $("#adv_publisher").val(
    ANCHOR.getParams() && ANCHOR.getParams().publisher
      ? ANCHOR.getParams().publisher
      : ""
  );
  $("#adv_type").val(
    ANCHOR.getParams() && ANCHOR.getParams().type ? ANCHOR.getParams().type : ""
  );
  $("#adv_media").val(
    ANCHOR.getParams() && ANCHOR.getParams().media
      ? ANCHOR.getParams().media
      : ""
  );
  $("#adv_format").val(
    ANCHOR.getParams() && ANCHOR.getParams().format
      ? ANCHOR.getParams().format
      : ""
  );
}

function assertAdvSearchUI(){
 // $.get("/advanced_search_ui", function (data) {
    $("#adv_type").empty();
    $("#adv_type").append("<option value='all'>All Types</option>");
    $("#adv_media").empty();
    $("#adv_media").append("<option value='all'>All Media</option>");
    $("#adv_format").empty();
    $("#adv_format").append("<option value='all'>All Formats</option>");
    if(ANCHOR.getParams() && ANCHOR.getParams().class_all){
      $("#adv_class_all").prop("checked", true);
    }
    types.forEach(function (val) {
      var option = document.createElement("option");
      $(option).val(val);
      $(option).text(decodeEntities(decodeEntities(val)));
      var option2 = document.createElement("option");
      $(option2).val(val);
      $(option2).text(decodeEntities(decodeEntities(val)));
      $("#adv_type").append(option);
      $("#top10_type").append(option2);
      if (ANCHOR.getParams() && ANCHOR.getParams().type) {
        $("#adv_type").val(ANCHOR.getParams() ? ANCHOR.getParams().type : "");
        $("#top10_type").val(ANCHOR.getParams() ? ANCHOR.getParams().type : "");
      }
    });
    media.forEach(function (val) {
      var option = document.createElement("option");
      $(option).val(val);
      $(option).text(decodeEntities(decodeEntities(val)));
      $("#adv_media").append(option);
      var option2 = document.createElement("option");
      $(option2).val(val);
      $(option2).text(decodeEntities(decodeEntities(val)));
      $("#top10_media").append(option2);
      if (ANCHOR.getParams() && ANCHOR.getParams().media) {
        $("#adv_media").val(ANCHOR.getParams() ? ANCHOR.getParams().media : "");

        $("#top10_media").val(
          ANCHOR.getParams() ? ANCHOR.getParams().media : ""
        );
      }
    });
    formats.forEach(function (val) {
      var option = document.createElement("option");
      $(option).val(val);
      $(option).text(decodeEntities(decodeEntities(val)));
      $("#adv_format").append(option);
      var option2 = document.createElement("option");
      $(option2).val(val);
      $(option2).text(decodeEntities(decodeEntities(val)));
      $("#top10_format").append(option2);
      if (ANCHOR.getParams() && ANCHOR.getParams().format) {
        $("#adv_format").val(
          ANCHOR.getParams() ? ANCHOR.getParams().format : ""
        );

        $("#top10_format").val(
          ANCHOR.getParams() ? ANCHOR.getParams().format : ""
        );
      }
    });
  //});
}

function assertAdvSubmit(){
  $("#adv_submit").unbind("click");
  $("#adv_submit").click(function () {
    
    ANCHOR.route(
      "#titles?search=true&title=" +
        encodeURIComponent($("#adv_title").val()) +
        "&author=" +
        encodeURIComponent($("#adv_author").val()) +
        "&classes=" +
        ($("#adv_classes").val()
          ? JSON.stringify(encodeURIComponent($("#adv_classes").val()))
          : "") +
        "&class_all=" +
        $("#adv_class_all").prop("checked") +
        "&publisher=" +
        encodeURIComponent($("#adv_publisher").val()) +
        "&type=" +
        encodeURIComponent($("#adv_type").val()) +
        "&media=" +
        $("#adv_media").val() +
        "&format=" +
        $("#adv_format").val()
    );
    initializeTorrents("torrents", dismissLoader);
  });
}



function assertLockGraphScroll(){
  function stopScroll(e){
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
          e.preventDefault();
    }
  }

  $(".partial_graph, .search_graph").on("mouseenter", function () {
    {
      window.removeEventListener("keydown", stopScroll);
      window.addEventListener("keydown", stopScroll);
    }
  });

  $(".partial_graph, .search_graph").on('mouseleave', function () {
    window.removeEventListener("keydown", stopScroll);
  });
}

function initializeNodes(field){
  $("#" + ANCHOR.page() + "_button").click(function(){
    switch(ANCHOR.page()){
      case "author":
        ANCHOR.route("#titles?search=true&title=&author=" + field + "&classes=&class_all=false&publisher=&type=all&media=all&format=all");
        break;
      case "class" :
        ANCHOR.route("#titles?search=true&title=&author=&classes=" + encodeURIComponent(JSON.stringify(field)) + "&class_all=false&publisher=&type=all&media=all&format=all");
        break;
      case "publisher" :
        ANCHOR.route("#titles?search=true&title=&author=&classes=&class_all=false&publisher=" + encodeURIComponent(field) + "&type=all&media=all&format=all");
        break;
    }
  })
}

function assertTr(record, edition_torrent){
  if(edition_torrent.torrent){
     var tr = "<tr>";
      tr += "<td>" + edition_torrent.torrent.properties.format + "</td>";          
      
     /*   tr +=
        "<td class='here'>" +
        timeSince(edition_torrent.torrent.properties.created_at) +
        " ago</td>";*/
      tr +=
        "<td><a href='#torrent?id=" + edition_torrent.torrent.properties.total_size_bytes + "&release=" + edition_torrent.torrent.properties.release +  
        "&media=" + edition_torrent.torrent.properties.media + "' id='add_torrent_tab' data-infohash='" + edition_torrent.torrent.properties.infoHash +
        "' data-title='" + record._fields[0].properties.title + "' class='ANCHOR torrent stream' href='#torrent?infoHash=" + edition_torrent.torrent.properties.infoHash +
        "' data-torrent-uuid = '" + edition_torrent.torrent.properties.uuid + 
         "'>[WebTorrent]</a></td>"
      tr += "<td>" + prettyBytes(edition_torrent.torrent.properties.total_size_bytes) + "</td><td class='light'><p>" +
        edition_torrent.torrent.properties.snatches +
        "</p></td>"
      tr += "</tr>";
      return tr;
  }
 
}
