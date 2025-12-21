function initializeTorrents(table) {
  
  if(TEMPLAR.paramREC() && TEMPLAR.paramREC().search){ /*&& $(window).width() > 1079){*/
    $(".search_graph").fadeIn(3000);
    //$(".search_graph").hide();
  }
  else{
    $(".search_graph").hide();
  }

  if ($(table) instanceof $.fn.dataTable.Api) {
    $(table).destroy();
  }
  
  
  assertTitleLoading();
  

  assertGraphSearch();

  assertAdvSearchUI();

  assertAdvButton();

  var hashes = []
  var url = ""
  var checkTable = table;
  if(table === "torrents"){
    if(!TEMPLAR.paramREC()){
      url = "/" + table 
    }
    else{
      url = "/" + table + "/adv_search"
    }
  }
  else if(TEMPLAR.pageREC() === "top10"){
    url = "/top10/" + table
  }
  else if(table === "node"){

    url = "/" + table + "/" + TEMPLAR.paramREC().label + "?uuid=" + TEMPLAR.paramREC().uuid
    console.log(url)
  }

  //statesave
  var stateSave = false;
  if(TEMPLAR.pageREC() === "top10" || TEMPLAR.pageREC() === "node"){
    stateSave = false;
  }
  else if(!TEMPLAR.paramREC() || !TEMPLAR.paramREC().search){
    stateSave = true;
  }
  

  $(document).mouseup(function (e) {
    var container = $(".seeAllField");
    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0) {
      container.hide();
    }
  });

  torrentsTable = $("#" + table).DataTable({
    bDestroy: true,
    responsive: {
        details: {
            display: $.fn.dataTable.Responsive.display.childRowImmediate,
            type: ''
        }
    },
    serverSide: true,
    bSort: true,
    pageLength: TEMPLAR.pageREC() === "top10" ? 10 : 25,
    "aoColumns": [
      { "sWidth": "0%" }, // 1st column width 
      { "sWidth": "50%" },
      { "sWidth": "12.5%" },
      { "sWidth": "12.5%" },
      { "sWidth": "12.5%" },
      { "sWidth": "12.5%" }

  
       // 3rd column width and so on 
    ],
    processing: true,
    searching: false,
    paging: true,
    info: true,
    columnDefs: [
      {
        target: 0,
        visible: false,
        searchable: false,
      },
      {
        target:4,
        responsivePriority:1
      }
    ],
    rowGroup: {
      dataSrc: 0,
      ordering: true,
      orderable: true,
    },
    ajax: {
      url: url,
      type: "POST",
      data: {
        title: TEMPLAR.paramREC() ? TEMPLAR.paramREC().title : "",
        author: TEMPLAR.paramREC() ? TEMPLAR.paramREC().author : "",
        classes: TEMPLAR.paramREC() ? TEMPLAR.paramREC().classes : "",
        class_all: TEMPLAR.paramREC() ? TEMPLAR.paramREC().class_all : "",
        publisher: TEMPLAR.paramREC() ? TEMPLAR.paramREC().publisher : "", //?nazi
        type: TEMPLAR.paramREC() ? TEMPLAR.paramREC().type : "",
        media: TEMPLAR.paramREC() ? TEMPLAR.paramREC().media : "",
        format: TEMPLAR.paramREC() ? TEMPLAR.paramREC().format : "",
      },
      dataSrc: function (data) {
        setRecords();
        if (data && data.data[0]) {
          insertTableData(data)
        }
        console.log(data.data)

        var editionsAdded = [];

        tableData.data.forEach(function (record) {
          var authorField = "";
          record._fields[1].forEach(function (field, i) {
            if (i > 0) {
              authorField += ", ";
            }
            authorField +=
              "<a class='TEMPLAR node author' href='#node?label=author&uuid=" +
              field.properties.uuid +
              "'>" +
              (field.properties.name.charAt(0) ==
              field.properties.name.charAt(0).toUpperCase()
                ? decodeEntities(field.properties.name)
                : decodeEntities(field.properties.name)) +
              "</a>";
          });


          var dateField = "";
          if (record._fields[0] && record._fields[0].properties.date) {
            dateField +=
              " <b>[" +
              decodeEntities(record._fields[0].properties.date) +
              "]</b> ";
          }

          var classesField = " ";
          var seeAll = false;
          record._fields[3].forEach(function (field, i) {
            if (i === 0) {
              if (field.properties.uuid) {
                classesField +=
                  "<a class='TEMPLAR node class' href='#node?label=class&uuid=" +
                  field.properties.uuid +
                  "'>" +
                  decodeEntities(field.properties.name) +
                  "</a> ";
              }
            } else {
              if (field.properties.uuid) {
                classesField +=
                  " <a class='TEMPLAR node class' href='#node?label=class&uuid=" +
                  field.properties.uuid +
                  "'>" +
                  decodeEntities(field.properties.name) +
                  "</a>";
              }
            }
          });


          //to find source img

          var sourceIMG = "";


          var numPeers = 0;
          var top10Table = table;
          record._fields[2].forEach(function (edition_torrent) {
            var torrentsTable =
              "<table class='torrentsTable'><thead><th>Format</th>" +
              "<th>Download</th><th>Size</th><th>Revs</th></thead><tbody><tr>";

            if (edition_torrent.torrent) {
              if (
                record._fields[0].properties.type === "Nonfiction"
                
              ){
                sourceIMG  = "https://i.imgur.com/bKuB5OF.png"
              }
              else if(record._fields[0].properties.type === "Fiction" || record._fields[0].properties.type === "Short Story" || record._fields[0].properties.type === "Children Book"){
                sourceIMG = "https://i.imgur.com/X0j3Ufg.jpeg"
              }
              
              else if (record._fields[0].properties.type === "Poetry") {
                sourceIMG =
                  "https://cdn.glitch.global/ae615eaa-fa44-4c56-8e49-a21afe3e2c54/33yaqamzi1_8jam1asthi_vc061604.png?v=1733512506876";
              } else if (record._fields[0].properties.type === "Play") {
                sourceIMG =
                  "https://i.imgur.com/0CwjOSE.jpeg";
              } else if (
                record._fields[0].properties.type === "Journal Article" ||
                record._fields[0].properties.type === "Essay"
              ) {
                sourceIMG =
                  "https://i.imgur.com/YKemkcF.jpeg";
                }
              else if (
                record._fields[0].properties.type === "Music" ||
                record._fields[0].properties.type === "Classical Music" ||
                record._fields[0].properties.type === "Chant"
              ) {
                sourceIMG = "https://i.imgur.com/WTZGlJP.png"
              }else if (record._fields[0].properties.type === "Holy Book") {
                  sourceIMG = "https://i.imgur.com/TDCsuyT.png"
              }
              else if(record._fields[0].properties.type === "Encyclopedia" || record._fields[0].properties.type === "Textbook"){
                sourceIMG = "https://i.imgur.com/Qtzg2gs.png"
              }
             
          
              
      
              if (edition_torrent.edition) {
               
                if (edition_torrent.torrent) {
                  var publisherHtml = "";
                  var editionField = "";
                  record._fields[1].forEach(function (field, i) {
                    editionField += decodeEntities(field.properties.name);
                    if (record._fields[1][i + 1]) {
                      editionField += ", ";
                    } else if (
                      field.properties.name &&
                      !field.properties.name.endsWith(".")
                    ) {
                      editionField += ". ";
                    } else {
                      editionField += " ";
                    }
                  });
                  if (
                    !record._fields[0].properties.date &&
                    edition_torrent.edition.properties.date
                  ) {
                    editionField +=
                      "(" +
                      decodeEntities(edition_torrent.edition.properties.date) +
                      "). ";
                  } else {
                    editionField += record._fields[0].properties.date
                      ? "(" +
                        decodeEntities(record._fields[0].properties.date) +
                        (edition_torrent.edition.properties.date &&
                        edition_torrent.edition.properties.date !==
                          record._fields[0].properties.date
                          ? "/" +
                            decodeEntities(edition_torrent.edition.properties.date) +
                            "). "
                          : "). ")
                      : "";
                  }
                  editionField +=
                    record._fields[0].properties.type !== "Journal Article" &&
                    record._fields[0].properties.type !== "Essay"
                      ? "<span class='italics'>" +
                        decodeEntities(record._fields[0].properties.name) +
                        "</span>. "
                      : decodeEntities(record._fields[0].properties.name) +
                        ". ";

                  if (edition_torrent.publisher && edition_torrent.publisher.properties.name) {
                    if (
                      edition_torrent.publisher.properties.name &&
                      edition_torrent.publisher.properties.name.endsWith(".")
                    ) {
                      publisherHtml += toTitleCase(decodeEntities(decodeEntities(edition_torrent.publisher.properties.name)))
                        ? "<a id='edition_span_publisher' class='TEMPLAR node publisher' href='#node?label=publisher&uuid=" +
                          encodeURIComponent(
                            edition_torrent.publisher.properties.uuid
                          ) +
                          "'>" +
                          toTitleCase(decodeEntities(decodeEntities(edition_torrent.publisher.properties.name))) +
                          "</a>"
                        : " ";
                    } else {
                      publisherHtml +=
                        (edition_torrent.publisher.properties.name
                          ? "<a id='edition_span_publisher' class='TEMPLAR node publisher' href='#node?label=publisher&uuid=" +                            
                              edition_torrent.publisher.properties.uuid
                            +
                            "'>" +
                            toTitleCase(decodeEntities(
                              decodeEntities(edition_torrent.publisher.properties.name)
                            )) +
                            "</a>"
                          : " ") +
                        (record._fields[0].properties.type !== "Journal Article"
                          ? ". "
                          : ", ");
                    }
                  }
                  if (record._fields[0].properties.type === "Journal Article") {
                    editionField += publisherHtml;
                  }
                  if (
                    edition_torrent.edition.properties.title &&
                    edition_torrent.edition.properties.title !== ""
                  ) {
                    if (!edition_torrent.edition.properties.title.endsWith(".")) {
                      editionField +=
                        decodeEntities(edition_torrent.edition.properties.title) +
                        (record._fields[0].properties.type !== "Journal Article"
                          ? ". "
                          : "");
                    } else {
                      editionField +=
                        decodeEntities(edition_torrent.edition.properties.title) + " ";
                    }
                  }
                  if (record._fields[0].properties.type !== "Journal Article") {
                    editionField += publisherHtml;
                  }
                  if (edition_torrent.edition.properties.no) {
                    
                    editionField +=
                      "(" + decodeEntities(edition_torrent.edition.properties.no) + ")";
                    if (edition_torrent.edition.properties.pages) {
                      editionField += ": ";
                    }
                  }
                  
                  if (edition_torrent.edition.properties.pages) {
                    if(edition_torrent.edition.properties.no){
                      editionField +=
                      decodeEntities(edition_torrent.edition.properties.pages) + ".";
                    }
                    else{
                      editionField += ", " + edition_torrent.edition.properties.pages + ".";
                    }
                    
                  }
                }
           
                
                torrentsTable += assertTr(record, edition_torrent)

        

                if (editionsAdded.indexOf(edition_torrent.edition.properties.uuid) === -1) {
                  editionsAdded.push(edition_torrent.edition.properties.uuid);
                  records[
                    editionsAdded.indexOf(edition_torrent.edition.properties.uuid)
                  ] = [
                    "<img class='tableImg' id='source_" +
                      record._fields[0].properties.uuid +
                      "' src='" +
                      sourceIMG +
                      "'>" +
                      "<div class='torrentSource'><span class='sourceType'>" +
                      decodeEntities(
                        decodeEntities(
                          decodeEntities(record._fields[0].properties.type)
                        )
                      ) +
                      "</span>" +
                      "<div class='tableHeading'><a id='sourceTab' class='TEMPLAR node source' href='#node?label=source&uuid=" +
                      record._fields[0].properties.uuid +
                      "'>" +
                      ($(window).width() > 1079 ? (record._fields[0].properties.name.length > 350 ? decodeEntities(record._fields[0].properties.name.substring(0,349) + "..."): decodeEntities(record._fields[0].properties.name)) : decodeEntities(record._fields[0].properties.name).substring(0,299) +
                      (record._fields[0].properties.name.length > 300 ? "..." : "")) +
                      
                      "</a>" +
                      dateField +
                      authorField +
                      "</div><br><div class='torrentClasses normal'>" +
                      classesField +
                      "</div></div>",
                    "<span id='edition_" +
                      edition_torrent.edition.properties.uuid +
                      "_field'>" +
                      editionField +
                      "</span>",
                    
                    edition_torrent.edition.properties.snatches,
                    // edition.edition.properties.numPeers,
                    "<span id='edition_date'>" +
                      (edition_torrent.edition.properties.date && edition_torrent.edition.properties.date !== "undefined" &&
                      edition_torrent.edition.properties.date !==
                        record._fields[0].properties.date
                        ? record._fields[0].properties.date +
                          "/" +
                           edition_torrent.edition.properties.date
                        : record._fields[0].properties.date) +
                      "</span>",

                    timeSince(edition_torrent.edition.properties.created_at) + " ago",
                    torrentsTable + "</table>"
                  ];
                } else {
                  

                  records[
                    editionsAdded.indexOf(edition_torrent.edition.properties.uuid)
                  ][5] =
                    records[
                      editionsAdded.indexOf(edition_torrent.edition.properties.uuid)
                    ][5].slice(0, -16) + torrentsTable + "</table>";
                }

              }
            }
          });
        });

        return records;
      },
    },
    drawCallback: function () {
        $(document).on("contextmenu", ".infoHash", function(e){
        $.post("/snatched/" + $(this).data('infohash'));
        console.log($(this).data("infohash"))
        
      });
      assertTitleLoaded();
    },
   
  })
  
  //$('th').unbind('click.DT')
}




function assertTitleLoading(){
  $("h2 span").hide();

  $("h2 span").text("Loading...").addClass("loading").fadeIn()
}

function assertTitleLoaded(){

  switch (TEMPLAR.pageREC()) {
    case "titles":
      if(TEMPLAR.paramREC() && TEMPLAR.paramREC().search){
        $("#torrentsTitle span").text("Graph Search").removeClass("loading").fadeIn(3333)

      }
      else{
        $("#torrentsTitle span").text("Titles").removeClass("loading").fadeIn(3333)

      }
      break;
    case "top10":
      $("#top10Title span").text("Top 10").removeClass("loading").show();
      break;
    case "node":
      //TODO: maybe multiple calls here
      //$.get("/source_info/" + TEMPLAR.paramREC().uuid, function (data) {
        assertNodeNameFromData()
        /*$("#addFormat").click(function () {
          TEMPLAR.route("#upload?uuid=" + TEMPLAR.paramREC().uuid);
        });*/
     
        //TEMPLAR.DOM();
      //});
      break;
    default:
      $("#torrentsTitle span").text("Titles").removeClass("loading").fadeIn(3333)

  }
}

function assertGraphSearch(){
  $("#adv_class_all").prop("checked", false);
  $("#adv_class_any").prop("checked", true)
  
  if(TEMPLAR.paramREC() && TEMPLAR.paramREC().class_all === "true"){
    
    $("#adv_class_all").prop("checked", true);
    $("#adv_class_any").prop("checked", false);
  }
  else{
    $("#adv_class_all").prop("checked", false);
    $("#adv_class_any").prop("checked", true);
  }
  $("#adv_title").val(
    TEMPLAR.paramREC() && TEMPLAR.paramREC().title
      ? decodeURIComponent(TEMPLAR.paramREC().title)
      : ""
  );
  $("#adv_author").val(
    TEMPLAR.paramREC() && TEMPLAR.paramREC().author
      ? decodeURIComponent(TEMPLAR.paramREC().author)
      : ""
  );
  $("#adv_classes").val(
    TEMPLAR.paramREC() && TEMPLAR.paramREC().classes
      ? decodeURIComponent(TEMPLAR.paramREC().classes) === "undefined"
        ? ""
        : decodeURIComponent(TEMPLAR.paramREC().classes).replace(/['"]+/g, "")
      : ""
  );

  $("#adv_publisher").val(

    TEMPLAR.paramREC() && TEMPLAR.paramREC().publisher
      ? toTitleCase(decodeURIComponent(TEMPLAR.paramREC().publisher))
      : ""
  );
  $("#adv_type").val(
    TEMPLAR.paramREC() && TEMPLAR.paramREC().type ? TEMPLAR.paramREC().type : ""
  );
  $("#adv_media").val(
    TEMPLAR.paramREC() && TEMPLAR.paramREC().media
      ? TEMPLAR.paramREC().media
      : ""
  );
  $("#adv_format").val(
    TEMPLAR.paramREC() && TEMPLAR.paramREC().format
      ? TEMPLAR.paramREC().format
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
    if(TEMPLAR.paramREC() && TEMPLAR.paramREC().class_all){
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
      if (TEMPLAR.paramREC() && TEMPLAR.paramREC().type) {
        $("#adv_type").val(TEMPLAR.paramREC() ? TEMPLAR.paramREC().type : "");
        $("#top10_type").val(TEMPLAR.paramREC() ? TEMPLAR.paramREC().type : "");
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
      if (TEMPLAR.paramREC() && TEMPLAR.paramREC().media) {
        $("#adv_media").val(TEMPLAR.paramREC() ? TEMPLAR.paramREC().media : "");

        $("#top10_media").val(
          TEMPLAR.paramREC() ? TEMPLAR.paramREC().media : ""
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
      if (TEMPLAR.paramREC() && TEMPLAR.paramREC().format) {
        $("#adv_format").val(
          TEMPLAR.paramREC() ? TEMPLAR.paramREC().format : ""
        );

        $("#top10_format").val(
          TEMPLAR.paramREC() ? TEMPLAR.paramREC().format : ""
        );
      }
    });
  //});
}

function assertAdvButton(){
  $("#adv_submit").unbind("click");
  $("#adv_submit").click(function () {
    
    TEMPLAR.route(
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
    initializeTorrents("torrents");
  });
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
        "&media=" + edition_torrent.torrent.properties.media + 
         "' class='TEMPLAR torrent stream' href='#torrent?infoHash=" + edition_torrent.torrent.properties.infoHash +
         edition_torrent.torrent.properties.uuid + 
         "'>[WebTorrent]</a></td>"
      tr += "<td>" + prettyBytes(edition_torrent.torrent.properties.total_size_bytes) + "</td><td class='light'><p>" +
        edition_torrent.torrent.properties.snatches +
        "</p></td>"
      tr += "</tr>";
      return tr;
  }
 
}
