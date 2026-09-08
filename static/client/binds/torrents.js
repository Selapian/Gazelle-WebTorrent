function assertGraphParamsPendingReset(){
  $("a TEMPLAR.torrents").on("click", function(){
    resetGraphParams();
  })
}

function assertTitleLoaded(){
  switch (TEMPLAR.pageREC()) {
    case "torrents":
      if(TEMPLAR.paramREC() && TEMPLAR.paramREC().search){
        $("#torrentsTitle span a").text("Graph Search").attr("href", "#torrents?search=true&title=&author=&classes=&all=false&publisher=&type=all&media=all&format=all&res=all").show();

      }
      else{
        $("#torrentsTitle span a").text("Torrents").attr("href", "#torrents").show();

      }
      break;
    case "top10":
      $("#top10Title span a").text("Top 10").attr("href", "top10").show();
      break;
    case "node":
      //TODO: maybe multiple calls here
      //$.get("/source_info/" + TEMPLAR.paramREC().uuid, function (data) {
        
        /*$("#addFormat").click(function () {
          TEMPLAR.route("#upload?uuid=" + TEMPLAR.paramREC().uuid);
        });
     
        //TEMPLAR.DOM();
      //});*/
      break;
    default:
      $("#torrentsTitle span a").text("Torrents").attr("href", "#torrents").show();
      break;

  }
  
}

function assertSourceIMG(record) {
    let sourceIMG;
    const type = record._fields[0].properties.type;

    // Direct mapping to your new minimalist assets
    const mapping = {
        "Nonfiction": "img/nonfiction.png",
        "Fiction": "img/fiction.png",
        "Short Story": "img/short_story.png",
        "Children Book": "img/children_book.png",
        "Poetry": "img/poetry.png",
        "Play": "img/play.png",
        "Journal Article": "img/journal_article.png",
        "Essay": "img/essay.png",
        "Holy Book": "img/holy_book.png",
        "Codex": "img/tome.png",
        "Encyclopedia": "img/encyclopedia.png",
        "Textbook": "img/textbook.png",
        "Classical Music": "img/classical_music.png",
        "Chant": "img/chant.png",
        "Lecture" : "img/lecture.png",
        "Letter" : "img/letter.png",
        "Renaissance Art": "img/renaissance_art.png",
        "Documentary" : "img/documentary.png"
    };

    sourceIMG = mapping[type] || "img/download.png";
    return sourceIMG;
}

function assertExistingEditionRow(edition_torrent, editionsAdded, newRows) {
    var index = editionsAdded.indexOf(edition_torrent.edition.properties.uuid);
    var existingHtml = dtRecs[index][5];
    
    // Inject the new rows before the closing tbody and table tags
    dtRecs[index][5] = existingHtml.replace("</tbody></table>", newRows + "</tbody></table>");
}

function assertFirstEditionRow(record, edition_torrent, editionsAdded, citationHtml, sourceIMG, dateField, authorField, classesField, torrentsTable) { // records is DataTable records, not neo4j records.
  editionsAdded.push(edition_torrent.edition.properties.uuid);

  const editionUuid = edition_torrent.edition.properties.uuid;

  // Clipboard SVG Icon + Copy Trigger with flex inline-block lock
  const copyBtnHtml = 
    "<button class='copy-citation-btn' data-uuid='" + editionUuid + "' title='Copy APA Citation' style='background:transparent; border:none; cursor:pointer; padding:0 0 0 6px; color:#a0a0a0; display:inline-flex; align-items:center; vertical-align:middle; line-height:1;'>" +
      "<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
        "<rect x='9' y='9' width='13' height='13' rx='2' ry='2'></rect>" +
        "<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path>" +
      "</svg>" +
    "</button>";

  dtRecs[editionsAdded.indexOf(editionUuid)] = [
    "<img class='tableImg' id='source_" + record._fields[0].properties.uuid + "' src='" + sourceIMG + "'>" +
    "<span class='sourceType'>" + decodeEntities(decodeEntities(record._fields[0].properties.type)) + "</span>" +
    "<div class='torrentSource'>" +
    "<div class='tableHeading'><a id='sourceTab' class='TEMPLAR node source' href='#node?label=source&uuid=" + record._fields[0].properties.uuid + "'>" +
    decodeEntities(decodeEntities(record._fields[0].properties.name)) +
    "</a>" + dateField + authorField + "</div><br><div class='torrentClasses'>" + classesField + "</div></div>",

    // Flex container preventing line breaks and ensuring inline layout
    "<div class='apa-container' style='display:inline-flex; align-items:baseline; max-width:100%;'>" +
      "<span class='apa-text bold' id='edition_" + editionUuid + "_field'>" +
        citationHtml +
      "</span>" +
      copyBtnHtml +
    "</div>",

    edition_torrent.edition.properties.snatches,
    "<span id='edition_date'>" +
    (edition_torrent.edition.properties.date && edition_torrent.edition.properties.date !== "undefined" && edition_torrent.edition.properties.date !== record._fields[0].properties.date ? record._fields[0].properties.date + "/" + edition_torrent.edition.properties.date : record._fields[0].properties.date) +
    "</span>",
    timeSince(edition_torrent.edition.properties.created_at) + " ago",
    torrentsTable + "</table>"
  ];
}


function assertAPACitation(record, edition_torrent){
  var publisherHtml = "";
  var formerPart = ""; // Authors + Date + Title

  // 1. Build Former Part (Authors)
  record._fields[1].forEach(function(field, i) {
      formerPart += decodeEntities(field.properties.name);
      if (record._fields[1][i + 1]) formerPart += ", ";
      else formerPart += (field.properties.name && !field.properties.name.endsWith(".")) ? ". " : " ";
  });

  // 2. Build Former Part (Date)
  if (!record._fields[0].properties.date && edition_torrent.edition.properties.date) {
      formerPart += "(" + decodeEntities(edition_torrent.edition.properties.date) + "). ";
  } else {
      formerPart += record._fields[0].properties.date ?
          "(" + decodeEntities(record._fields[0].properties.date) +
          (edition_torrent.edition.properties.date && edition_torrent.edition.properties.date !== record._fields[0].properties.date ?
              "/" + decodeEntities(edition_torrent.edition.properties.date) + "). " : "). ") : "";
  }

  // 3. Build Former Part (Source Title)
  formerPart += !["Journal Article", "Essay"].includes(record._fields[0].properties.type) ?
      "<span class='italics'>" + decodeEntities(record._fields[0].properties.name) + "</span>. " :
      decodeEntities(record._fields[0].properties.name) + ". ";

  // 4. Build Publisher HTML
  if (edition_torrent.publisher && edition_torrent.publisher.properties.name) {
      var pubName = toTitleCase(decodeEntities(decodeEntities(edition_torrent.publisher.properties.name)));
      publisherHtml = "<a id='edition_span_publisher' class='TEMPLAR node publisher' href='#node?label=publisher&uuid=" +
          edition_torrent.publisher.properties.uuid + "'>" + toTitleCase(pubName) + "</a>" +
          (pubName.endsWith(".") ? "" : (record._fields[0].properties.type !== "Journal Article" ? ". " : ", "));
  }

  // 5. Build Remainder (Edition info)
  var remainderPart = "";
  if (edition_torrent.edition.properties.title && edition_torrent.edition.properties.title !== "") {
      remainderPart += decodeEntities(edition_torrent.edition.properties.title);
      if (!edition_torrent.edition.properties.title.endsWith(".")) remainderPart += (record._fields[0].properties.type !== "Journal Article" ? ". " : "");
      else remainderPart += " ";
  }

  if (edition_torrent.edition.properties.no) {
      remainderPart += "(" + decodeEntities(edition_torrent.edition.properties.no) + ")";
      if (edition_torrent.edition.properties.pages) remainderPart += ": ";
  }
  if (edition_torrent.edition.properties.pages) {
      remainderPart += edition_torrent.edition.properties.no ?
          decodeEntities(edition_torrent.edition.properties.pages) + "." :
          ", " + edition_torrent.edition.properties.pages + ".";
  }

  // Construct Final APA Segmented Logic
  var citationHtml = "<span class='apa-former'>" + formerPart + "</span>";
  if (record._fields[0].properties.type === "Journal Article") {
      citationHtml += " <span class='apa-publisher-wrap'>" + publisherHtml + remainderPart + "</span>";
  } else {
      citationHtml += " <span class='apa-publisher-wrap'>" + remainderPart + publisherHtml + "</span>";
  }
  return citationHtml;
}


function assertGraphSearch(){
  $("#adv_all").prop("checked", false);
  $("#adv_any").prop("checked", true)
  
  if(TEMPLAR.paramREC() && TEMPLAR.paramREC().all === "true"){
    
    $("#adv_all").prop("checked", true);
    $("#adv_any").prop("checked", false);
  }
  else{
    $("#adv_all").prop("checked", false);
    $("#adv_any").prop("checked", true);
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
    $("#adv_type").append("<option value='all'>All Genuses</option>");
    $("#adv_media").empty();
    $("#adv_media").append("<option value='all'>All Media</option>");
    $("#adv_format").empty();
    $("#adv_format").append("<option value='all'>All Formats</option>");
    $("#adv_res").empty();
    $("#adv_res").append("<option value='all'>All Resolutions</option>")
    if(TEMPLAR.paramREC() && TEMPLAR.paramREC().all === "true"){
      $("#adv_all").prop("checked", true);
      $("adv_any").prop("checked", false);

    }
    else{
      $("adv_any").prop("checked", true);
      $("#adv_all").prop("checked", false);
    }
    types.forEach(function (val) {
      var option = document.createElement("option");
      $(option).val(val);
      $(option).text(decodeEntities(decodeEntities(val)));
      $("#adv_type").append(option);
      if (TEMPLAR.paramREC() && TEMPLAR.paramREC().type) {
        $("#adv_type").val(TEMPLAR.paramREC() ? TEMPLAR.paramREC().type : "");
      }
    });
    media.forEach(function (val) {
      var option = document.createElement("option");
      $(option).val(val);
      $(option).text(decodeEntities(decodeEntities(val)));
      $("#adv_media").append(option);
      if (TEMPLAR.paramREC() && TEMPLAR.paramREC().media) {
        $("#adv_media").val(TEMPLAR.paramREC() ? TEMPLAR.paramREC().media : "");
      }
    });
    formats.forEach(function (val) {
      var option = document.createElement("option");
      $(option).val(val);
      $(option).text(decodeEntities(decodeEntities(val)));
      $("#adv_format").append(option);
      if (TEMPLAR.paramREC() && TEMPLAR.paramREC().format) {
        $("#adv_format").val(
          TEMPLAR.paramREC() ? TEMPLAR.paramREC().format : ""
        );

      }
    });

    video_resolutions.forEach(function(val){
      var option = document.createElement("option");
      $(option).val(val);
      $(option).text(decodeEntities(decodeEntities(val)));
      $("#adv_res").append(option);
    })

    music_resolutions.forEach(function(val){
        var option2 = document.createElement("option");
        $(option2).val(val);
        $(option2).text(decodeEntities(decodeEntities(val)));
        $("#adv_res").append(option2);
      })
  //});
    var option = document.createElement("option");
    $(option).val("Digital");
    $(option).text("Digital");
    $("#adv_res").append(option);
    var option2 = document.createElement("option");
    $(option2).val("Scan");
    $(option2).text("Scan");
    $("#adv_res").append(option2);
    if (TEMPLAR.paramREC() && TEMPLAR.paramREC().res) {
        $("#adv_res").val(TEMPLAR.paramREC().res);
    }
}

function assertAdvButton(){
  $("#adv_submit").unbind("click");
  $("#adv_submit").click(function () {
    //pass false for no route
    /*if($("#adv_title").val() !== ""){
      walkGraph("source", $("#adv_title").val(), false);
    }
    if($("#adv_author").val() !== ""){
      walkGraph("author", $("#adv_author").val(), false);
    }
    if($("#adv_classes").val() !== ""){
      walkGraph("class", $("#adv_classes").val(), false);
    }
    if($("#adv_publisher").val() !== ""){
      walkGraph("publisher", $("#adv_publisher").val(), false);
    }*/
    
    TEMPLAR.route(
      "#torrents?search=true&title=" +
        encodeURIComponent($("#adv_title").val()) +
        "&author=" +
        encodeURIComponent($("#adv_author").val()) +
        "&classes=" +
        ($("#adv_classes").val()
          ? JSON.stringify(encodeURIComponent($("#adv_classes").val()))
          : "") +
        "&all=" +
        $("#adv_all").prop("checked") +
        "&publisher=" +
        encodeURIComponent($("#adv_publisher").val()) +
        "&type=" +
        encodeURIComponent($("#adv_type").val()) +
        "&media=" +
        $("#adv_media").val() +
        "&format=" +
        $("#adv_format").val() +
        "&res=" +
        $("#adv_res").val()
    );
    //initializeTorrents("torrents");
  });
}

function assertTr(record, edition_torrent, apaHtml){
  if(edition_torrent.torrent){
    const cleanApa = apaHtml.replace(/<[^>]*>?/gm, '');
     var tr = "<tr>";
      tr += "<td>" + edition_torrent.torrent.properties.format + "<br>" + edition_torrent.torrent.properties.media + "<br>" + ( edition_torrent.torrent.properties.res !== "N/A" ? edition_torrent.torrent.properties.res : "" )+ "</td>";          
      
     /*   tr +=
        "<td class='here'>" +
        timeSince(edition_torrent.torrent.properties.created_at) +
        " ago</td>";*/
      tr +=
        "<td>" +
          "<a" +
           " data-id='" + edition_torrent.torrent.properties.size + "'" +
           " data-release='" + edition_torrent.torrent.properties.release + "'" + 
           " data-media='" + edition_torrent.torrent.properties.media + "'" +
           " data-apa='" + cleanApa + "'" + // Store the citation here
           " data-format='" + edition_torrent.torrent.properties.format + "'" +
           " data-infohash = '" + edition_torrent.torrent.properties.infoHash + "'" +
           " class='webtorrent' href='webtorrent'>[WebTorrent]</a>" +
           "<a href='" + getMagnetURI(edition_torrent.torrent.properties.infoHash) + "' class='magnetURI' data-infohash='" + edition_torrent.torrent.properties.infoHash + "'>[magnetURI]</a>" + 
           "<a href='#' id='torrent_infoHash' data-infohash='" + edition_torrent.torrent.properties.infoHash + "'>[infoHash]</a>"
      tr += "<td>" +
        edition_torrent.torrent.properties.snatches
        "</td>"
      tr += "<td>" + prettyBytes(edition_torrent.torrent.properties.size) + "</td>"
      tr += "</tr>";
      return tr;
  }
}
