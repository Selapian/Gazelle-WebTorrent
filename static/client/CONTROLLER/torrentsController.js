var full = false;
var tableData;
function initializeTorrents(table) {
  
  if(ANCHOR.getParams() && ANCHOR.getParams().search){ /*&& $(window).width() > 1079){*/
    $(".search_graph").fadeIn(3000);
    //$(".search_graph").hide();
  }
  else{
    $(".search_graph").hide();
  }

  if ($(table) instanceof $.fn.dataTable.Api) {
    $(table).destroy();
  }
  
  
  
  assertLockGraphScroll();
  
  assertTitleLoading();
  

  /*$("#download_class").click(function(e){
    e.preventDefault();
    $.post("/download_class?uuid=" + ANCHOR.getParams().uuid, function(data){
      data.records.forEach(function(record){
        setTimeout(function(){
            window.location = "magnet:?xt=urn:btih:" + record._fields[0] + "&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337"

        },25)
      })
    })
  })
*/

  var all = [];
  var top = {
    top10_all_active: [],
    top10_all_day: [],
    top10_all_week: [],
    top10_all_month: [],
    top10_all_trinity: [],
    top10_all_year: [],
    top10_all_time: [],
  };
  
  assertGraphSearch();

  assertAdvSearchUI();

  assertAdvSubmit();


  var torrentsTable;
  if (torrentsTable) {
    //torrentsTable.destroy();
    //$("#" + table + " tbody").empty();
    //torrentsTable.draw();
  }

  var hashes = []
  var url = ""
  var checkTable = table;
  if(table === "torrents"){
    if(!ANCHOR.getParams()){
      url = "/" + table 
    }
    else{
      url = "/" + table + "/adv_search"
    }
  }
  else if(table.indexOf("top10") > -1){
    if(!ANCHOR.getParams()){
      url = "/top10/" + table
    }
    else{
      url = "/top10_adv_search/" + table;
    }
  }
  else if(table === "class" || table === "author" || table === "source" || table === "publisher"){
    url = "/" + table + "/" + ANCHOR.getParams().uuid
  }

  //statesave
  var stateSave = false;
  if(ANCHOR.page() === "top10" || ANCHOR.page() === "source" || ANCHOR.page() === "author" || ANCHOR.page() === "class" || ANCHOR.page() === "publisher"){
    stateSave = false;
  }
  else if(!ANCHOR.getParams() || !ANCHOR.getParams().search){
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
    pageLength: ANCHOR.page() === "top10" ? 10 : 25,
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
    stateSave: stateSave,
    ajax: {
      url: url,
      type: "POST",
      data: {
        title: ANCHOR.getParams() ? ANCHOR.getParams().title : "",
        author: ANCHOR.getParams() ? ANCHOR.getParams().author : "",
        classes: ANCHOR.getParams() ? ANCHOR.getParams().classes : "",
        class_all: ANCHOR.getParams() ? ANCHOR.getParams().class_all : "",
        publisher: ANCHOR.getParams() ? ANCHOR.getParams().publisher : "", //?nazi
        type: ANCHOR.getParams() ? ANCHOR.getParams().type : "",
        media: ANCHOR.getParams() ? ANCHOR.getParams().media : "",
        format: ANCHOR.getParams() ? ANCHOR.getParams().format : "",
      },
      dataSrc: function (data) {
        var records = [];
        if (data && data.data[0]) {
          tableData = data;
        }
        console.log(data.data)

        var editionsAdded = [];

        data.data.forEach(function (record) {
          var authorField = "";
          record._fields[1].forEach(function (field, i) {
            if (i === 0) {
              authorField += "<span class='normal'> by </span>";
            } else {
              authorField += ", ";
            }
            authorField +=
              "<a class='ANCHOR author sourceAuthor' href='#author?uuid=" +
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
          var seeAllField = "<span class='seeAllField'>";
          record._fields[3].forEach(function (field, i) {
            if (i === 0) {
              if (field.properties.uuid) {
                classesField +=
                  "<a class='ANCHOR class' href='#class?uuid=" +
                  field.properties.uuid +
                  "'>" +
                  decodeEntities(field.properties.name) +
                  "</a> ";
              }
            } else {
              if (field.properties.uuid) {
                classesField +=
                  " <a class='ANCHOR class' href='#class?uuid=" +
                  field.properties.uuid +
                  "'>" +
                  decodeEntities(field.properties.name) +
                  "</a>";
              }
            }
          });

          seeAllField += "</span>";
          classesField += seeAllField;

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
                record._fields[0].properties.type === "Journal" ||
                record._fields[0].properties.type === "Essay"
              ) {
                sourceIMG =
                  "https://i.imgur.com/YKemkcF.jpeg";
              } else if (record._fields[0].properties.type === "Lecture") {
                sourceIMG = "https://i.imgur.com/D8UFJGM.jpeg"
              } else if (
                record._fields[0].properties.type === "Documentary" ||
                record._fields[0].properties.type === "Movie" ||
                record._fields[0].properties.type === "Film"
              ) {
                sourceIMG =
                  "https://i.imgur.com/0gg7GoL.png";
              } else if (
                record._fields[0].properties.type === "Music" ||
                record._fields[0].properties.type === "Classical Music" ||
                record._fields[0].properties.type === "Chant"
              ) {
                sourceIMG = "https://i.imgur.com/WTZGlJP.png"
              } else if (
                record._fields[0].properties.type === "Videogame" ||
                record._fields[0].properties.type === "Game"
              ) {
                sourceIMG =
                  "https://cdn.glitch.global/ae615eaa-fa44-4c56-8e49-a21afe3e2c54/Video_Game_History_Icon_Alternative.svg?v=1718726679991";
              } else if (
                record._fields[0].properties.type === "Software" ||
                record._fields[0].properties.type === "Program"
              ) {
                sourceIMG =
                  "https://cdn.glitch.global/ae615eaa-fa44-4c56-8e49-a21afe3e2c54/images.png?v=1718726747129";
              } else if (record._fields[0].properties.type === "Holy Book") {
                  sourceIMG = "https://i.imgur.com/TDCsuyT.png"
              }
              else if(record._fields[0].properties.type === "Encyclopedia" || record._fields[0].properties.type === "Textbook"){
                sourceIMG = "https://i.imgur.com/Qtzg2gs.png"
              }
             
          
              if (
                record._fields[0] &&
                !record._fields[0].properties.imgSrc &&
                record._fields[0].properties.imgSrc !== "null"
              ) {
                $.get(
                  "https://www.googleapis.com/books/v1/volumes?q=intitle:" +
                    record._fields[0].properties.name +
                    "+inauthor:" +
                    (record._fields[1] && record._fields[1][0]
                      ? record._fields[1][0].properties.name.split(",")[0]
                      : ""),
                  function (data) {
                    if (
                      data.items &&
                      data.items.length > 0 &&
                      data.items[0].volumeInfo.imageLinks &&
                      (data.items[0].volumeInfo.title ===
                        record._fields[0].properties.name ||
                        data.items[0].volumeInfo.publishedDate ===
                          record._fields[0].properties.date)
                    ) {
                      sourceIMG =
                        data.items[0].volumeInfo.imageLinks.smallThumbnail;
                      $.post(
                        "/google_img/" + record._fields[0].properties.uuid,
                        { img: sourceIMG },
                        function (data) {}
                      );
                      $("#source_" + record._fields[0].properties.uuid).attr(
                        "src",
                        sourceIMG
                      );
                    }
                    if (!data.items) {
                      $.get(
                        "/source_cover/" +
                          record._fields[0].properties.name +
                          "?author=" +
                          (record._fields[1] && record._fields[1][0]
                            ? record._fields[1][0].properties.name.split( //is this right?
                                ","
                              )[0]
                            : ""),
                        function (data) {
                          if (data.cover && data.cover["1x"]) {
                            sourceIMG = data.cover["1x"];
                            $(
                              "#source_" + record._fields[0].properties.uuid
                            ).attr("src", sourceIMG);
                          }
                        }
                      );
                    }
                  }
                );
              } else {
                sourceIMG =
                  record._fields[0].properties.imgSrc &&
                  record._fields[0].properties.imgSrc !== "null"
                    ? record._fields[0].properties.imgSrc
                    : sourceIMG;
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
                    record._fields[0].properties.type !== "Journal" &&
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
                        ? "<a id='edition_span_publisher' class='ANCHOR publisher' href='#publisher?uuid=" +
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
                          ? "<a id='edition_span_publisher' class='ANCHOR publisher' href='#publisher?uuid=" +                            
                              edition_torrent.publisher.properties.uuid
                            +
                            "'>" +
                            toTitleCase(decodeEntities(
                              decodeEntities(edition_torrent.publisher.properties.name)
                            )) +
                            "</a>"
                          : " ") +
                        (record._fields[0].properties.type !== "Journal"
                          ? ". "
                          : ", ");
                    }
                  }
                  if (record._fields[0].properties.type === "Journal") {
                    editionField += publisherHtml;
                  }
                  if (
                    edition_torrent.edition.properties.title &&
                    edition_torrent.edition.properties.title !== ""
                  ) {
                    if (!edition_torrent.edition.properties.title.endsWith(".")) {
                      editionField +=
                        decodeEntities(edition_torrent.edition.properties.title) +
                        (record._fields[0].properties.type !== "Journal"
                          ? ". "
                          : "");
                    } else {
                      editionField +=
                        decodeEntities(edition_torrent.edition.properties.title) + " ";
                    }
                  }
                  if (record._fields[0].properties.type !== "Journal") {
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
                //add torrents
                /*if (all.indexOf(edition_torrent.torrent.uuid === -1)) {
                  //all.push(edition_torrent.torrent.uuid);
                }*/
                //if(ANCHOR.page() === "top10"){
                  
                //}
                
                torrentsTable += assertTr(record, edition_torrent)

                /*if(ANCHOR.page() === "top10" || hashes.indexOf(edition_torrent.torrent.infoHash) === -1){

                  hashes.push(edition_torrent.torrent.infoHash)
                  
                }*/
                

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
                      "<div class='tableHeading'><a id='sourceTab' class='ANCHOR source' href='#source?uuid=" +
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


