import express from 'express';

const app = express();

const port = 8080;

import util from 'util';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import http from 'https';

import { 
  v1 as uuidv1
} from 'uuid';

import neo4j from 'neo4j-driver'

import he from "he";

import {uri, user, password} from './config.js'
import mermaid from "./js/mermaid.js"

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

import path from 'path';

import bodyParser from 'body-parser'

app.use( bodyParser.json() );       
app.use(bodyParser.urlencoded({     
  extended: true
})); 

app.use(express.static(path.join(__dirname, 'static')));

import { check, query, validationResult } from 'express-validator';



var stopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now']

function remove_stopwords(str) {
    var res = []
    var str = str.toLowerCase();
    var words = str.split(' ')
    for(var i=0;i<words.length;i++) {
       var word_clean = words[i].split(".").join("")
       if(!stopwords.includes(word_clean)) {
           res.push(word_clean)
       }
    }
    return(res.join(' '))
}

/**
 * Removes stop words and common business suffixes from publisher names.
 * Targeted for graph search optimization.
 */
function remove_publisher_stopwords(str) {
    if (!str) return "";

    // 1. Define Publisher-specific stop words (Case-Insensitive)
    const stopWords = [
        "and", "the", "of", "for", "in", "by", "with", "a", "an",
        "ltd", "limited", "inc", "incorporated", "corp", "corporation",
        "publishers", "publisher", "publishing", "publications", "press",
        "books", "company", "co", "llc", "group", "house", "intl", "international"
    ];

    // 2. Normalize and split into tokens
    // We remove common trailing punctuation like periods or commas first
    let cleanStr = str.replace(/[,.]/g, ' ');
    let words = cleanStr.split(/\s+/);

    // 3. Filter out the stop words
    let filteredWords = words.filter(word => {
        let lowerWord = word.toLowerCase();
        return !stopWords.includes(lowerWord);
    });

    // 4. Rejoin and clean up extra whitespace
    return filteredWords.join(' ').trim();
}

app.post("/mermaid/:uuid", check("publisher").trim().escape(), check("uuid").trim().escape(), function(req,res){
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    mermaid.recommendSource(driver, req.params.uuid, function(data){
      quantumMermaid(data.records.length, function(index, mermaid){
        console.log("INDEX : " + index + "LEN : " + data.records.length);
        if(data.records[0]){
          console.log("SRC", data.records[index]._fields[0].properties.uuid)
          return res.json({uuid : data.records[index]._fields[0].properties.uuid, mermaid : mermaid })
        }
        else{
          return res.json({errors : [{msg : ""}]})
        }
      })          
    })
      
})

function quantumMermaid(len, cb) {
    const options = {
        host: 'lfdr.de',
        path: '/qrng_api/qrng?length=1&format=HEX'
    };

    // 1. Centralized Flag to Prevent Double-Callback
    let finished = false;

    // 2. Centralized Fallback Function
    const fallbackRandom = (errorType) => {
        // Only run the fallback if the request hasn't successfully finished yet
        if (finished) return;

        console.error(`QRNG failed due to ${errorType}. Falling back to Math.random().`);
        
        // Use a cryptographically secure fallback if available (e.g., crypto.randomInt)
        // If not, use Math.random() as you currently have.
        const min = Math.ceil(0);
        const max = Math.floor(172);
        const qrn = Math.floor(Math.random() * (max - min + 1)) + min;

        finished = true;
        cb(mermaidHex(qrn, len), false);
    };

    // --- Request Execution ---
    const req = http.get(options, (res) => {
        // Handle Status Codes (e.g., 404, 500, 502)
        if (res.statusCode !== 200) {
            // Abort the stream and trigger the fallback
            res.resume(); // Consume the rest of the data to free up memory
            return fallbackRandom(`Bad Status Code: ${res.statusCode}`);
        }

        let bodyChunks = [];
        res.on('data', (chunk) => {
            bodyChunks.push(chunk);
        });

        res.on('end', () => {
            if (finished) return; // In case an earlier error handler was triggered
            finished = true; // Mark as successful before processing

            const body = Buffer.concat(bodyChunks).toString();
            console.log('BODY: ' + body);

            try {
                const json = JSON.parse(body);
                // Check if the expected data is in the JSON
                if (json.qrn) {
                    cb(mermaidHex(json.qrn, len), true);
                } else {
                    // JSON was valid but didn't contain the expected 'qrn' field
                    fallbackRandom('JSON parsing was incomplete or missing data');
                }
            } catch (error) {
                // Catches JSON.parse() errors
                fallbackRandom('JSON Parsing Error');
            }
        });

        // 3. Handle Response Stream Errors (e.g., network disconnect while reading data)
        res.on("error", () => {
            fallbackRandom("Response Stream Error");
        });
    });

    // 4. Handle Request/Connection Errors (e.g., DNS, ECONNREFUSED, ECONNRESET)
    req.on('error', (err) => {
        fallbackRandom(`Request/Connection Error: ${err.code}`);
    });

    // 5. Handle Timeout Errors
    req.setTimeout(5555, () => {
        req.abort(); // Crucially, abort the request to clean up
        fallbackRandom("Timeout Error");
    });
}

function mermaidHex(qrn, ln){
  const decimal = parseInt(qrn, 16);
  if(ln > 373){
    return decimal % 373;
  }
  else{
    return decimal % ln;
  }
}


 
// SMEE: The route is now a single door for all node types!
app.post("/node/:label", [
    check("label").trim().escape().isIn(['source', 'author', 'class', 'publisher']),
    // SMEE: This requires 'query' to be imported at the top of the file!
    query("uuid").notEmpty().trim().escape() 
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("KRAKEN ATTACK: Validation Mutiny!", errors.array());
        return res.json({ errors: errors.array() });
    }

    const { label } = req.params; 
    const { uuid } = req.query; // Plucked from ?uuid=
    const { start, length, order } = req.body;
    const session = driver.session();

    // SMEE: Renamed to cypherQuery to avoid collision with the 'query' validator
    // SMEE: The matchClause now uses $uuid placeholder instead of template literals!
    let countClause = "";
    switch(label) {
        case 'source':    countClause = "MATCH (s:Source {uuid: $uuid})"; break;
        case 'author':    countClause = "MATCH (a:Author {uuid: $uuid})-[]->(s:Source)"; break;
        case 'class':     countClause = "MATCH (c:Class {uuid: $uuid})-[:TAGS]->(s:Source)"; break;
        case 'publisher': countClause = "MATCH (p:Publisher {uuid: $uuid})<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s:Source)"; break;
        default:          countClause = "MATCH (s:Source {uuid: $uuid})";
    }

    let matchClause = ""
    switch(label) {
        case 'source':    matchClause = "MATCH (s1:Source {uuid: $uuid})"; break;
        case 'author':    matchClause = "MATCH (a:Author {uuid: $uuid})-[]->(s1:Source)"; break;
        case 'class':     matchClause = "MATCH (c:Class {uuid: $uuid})-[:TAGS]->(s1:Source)"; break;
        case 'publisher': matchClause = "MATCH (p:Publisher {uuid: $uuid})<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s1:Source)"; break;
        default:          matchClause = "MATCH (s1:Source {uuid: $uuid})";
    }

    let orderBy = "s.updated DESC"; // Default
    if (order && order.length > 0) {
        const dir = order[0].dir === 'asc' ? 'ASC' : 'DESC';
        switch(order[0].column) {
            case '0': orderBy = `s1.updated ${dir}`; break;
            case '1': orderBy = `s1.title ${dir}`; break;
            case '2': orderBy = `s1.snatches ${dir}`; break;
            case '3': orderBy = `s1.adjDate ${dir}`; break;
            case '4': orderBy = `s1.updated ${dir}`; break;
        }
    }

    const cypherQuery = `
        ${countClause}
        WITH s
        WITH TOFLOAT(count(s)) AS full_count

        ${matchClause}
        OPTIONAL MATCH (authors:Author)-[]->(s1)
        MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s1)
        OPTIONAL MATCH (t:Torrent)<-[:DIST_AS]-(e) WHERE t.deleted = false
        
        WITH s1, authors, p, e, t, full_count
        OPTIONAL MATCH (classes:Class)-[:TAGS]->(s1)
        
        WITH s1, full_count,
             collect(DISTINCT authors) AS authorList, 
             collect(DISTINCT {publisher: p, edition: e, torrent: t}) AS edition_torrents, 
             collect(DISTINCT classes) AS classList
             
        RETURN s1, authorList, edition_torrents, classList, full_count ORDER BY ` + orderBy;

    try {
        const result = await session.run(cypherQuery, {
            uuid: uuid,
            skip: start || 0,
            limit: length || 25
        });

        const total = result.records[0]._fields[4]
        console.log(total)

        res.json({
            draw: parseInt(req.body.draw) || 0,
            recordsTotal: total,
            recordsFiltered: total,
            records: result.records
        });
    } catch (err) {
        console.error("KRAKEN ATTACK:", err);
        res.status(500).send("KRAKEN ATTACK: Internal Server Error");
    } finally {
        await session.close();
    }
});

app.post("/set/:ward", function(req, res) {
    const session = driver.session();
    const ward = req.params.ward;
    const { start, length, order } = req.body;
    
    const params = {
        skip: start || 0,
        limit: length || 25
    };

    let relationshipLabel = '';
    let connectedNodeLabel = '';
    let countAlias = '';
    let actualNodeLabel;

    switch (ward) {
        case "authors":
            relationshipLabel = '-[:AUTHOR]->'; 
            connectedNodeLabel = 's:Source';
            countAlias = 'numSources';
            break;
        case "classes":
            relationshipLabel = '-[:TAGS]->';
            connectedNodeLabel = 's:Source';
            countAlias = 'numSources';
            actualNodeLabel = 'Class';
            break;
        case "publishers":
            relationshipLabel = '<-[:PUBLISHED_BY]-';
            connectedNodeLabel = 'e:Edition';
            countAlias = 'numEditions';
            break;
        default:
            session.close();
            return res.status(400).json({ error: "Invalid ward" });
    }

    const nodeVar = ward.charAt(0);
    const nodeLabel = actualNodeLabel || ward.charAt(0).toUpperCase() + ward.slice(1, -1);

    // --- Dynamic Sort Logic ---
    let orderByClause = `${nodeVar}.name ASC`; // Default Fallback
    if (order && order.length > 0) {
        const colIndex = order[0].column;
        const dir = order[0].dir.toUpperCase(); // ASC or DESC

        switch (colIndex) {
            case '0': // Column 1: Name
                orderByClause = `${nodeVar}.name ${dir}`;
                break;
            case '1': // Column 2: # Editions/Sources (The Alias)
                orderByClause = `${countAlias} ${dir}`;
                break;
            case '2': // Column 3: Snatches
                orderByClause = `snatches ${dir}`;
                break;
        }
    }

    // 1. Count Query (Remains the same)
    const countQuery = `MATCH (n:${nodeLabel}) WHERE n.name <> '' RETURN count(n) AS count`;

    // 2. Data Query 
    // We calculate 'snatches' in the WITH so we can sort by it if requested.
    const dataQuery = 
        `MATCH (${nodeVar}:${nodeLabel}) WHERE ${nodeVar}.name <> '' ` +
        `MATCH (${nodeVar})${relationshipLabel}(${connectedNodeLabel}) ` +
        `WITH ${nodeVar}, ` +
        `     count(DISTINCT ${connectedNodeLabel.charAt(0)}) AS ${countAlias}, ` +
        `     coalesce(${nodeVar}.snatches, 0) AS snatches ` +
        `ORDER BY ${orderByClause} ` + 
        `SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) ` +
        `RETURN ${nodeVar}, ${countAlias}, snatches`;

    let totalCount = 0;

    session.run(countQuery)
        .then(countData => {
            totalCount = countData.records[0].get('count').toNumber();
            return session.run(dataQuery, params);
        })
        .then(data => {
            session.close();
            res.json({
                draw: parseInt(req.body.draw),
                recordsTotal: totalCount,
                recordsFiltered: totalCount,
                data: data.records
            });
        })
        .catch(error => {
            session.close();
            console.error(`[STARDATE 202512.21] Cypher Error:`, error);
            res.status(500).send("Internal Error");
        });
});

app.post("/torrents/adv_search", check("class_all").not().isEmpty().trim().escape().isLength({max:100}), check("title").trim().escape().isLength({max: 400}),
 check("author").trim().escape().isLength({max: 200}), check("classes").trim().escape().isLength({max:1251}).toLowerCase(),
  check("publisher").trim().escape().isLength({max: 612}), check("type").trim().escape().isLength({max:200}), check("media").trim().escape().isLength({max:350}),
  check("format").trim().escape().isLength({max:360}), function(req,res){
    console.log("HERE!!!!", validationResult(req))
    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }

    req.body.title = remove_stopwords(req.body.title);

    const session = driver.session();
    var query = ""
    if(req.body.classes){
      var classes = JSON.parse(he.decode(req.body.classes)).split(",");
      if(classes[0] === ['']){
        classes = []
      }
      else{
        for (var i = 0; i < classes.length; i++) {
         classes[i] = he.decode(classes[i].trim()).replace(/['"]+/g, '')
        }  
      }
    }
    req.body.title = req.body.title.replace(":", ' ')
    req.body.author = req.body.author.replace(":", ' ')
    req.body.publisher = req.body.publisher.replace(':', ' ');
    if(req.body.publisher.toLowerCase() === "propagate" || req.body.publisher.toLowerCase() === "propagateinfo"){
      req.body.publisher = "propagate.info"
    }
    if(req.body.title && req.body.type === "all"){
      query += "CALL db.index.fulltext.queryNodes('titles', $title) YIELD node " +
      "MATCH (s:Source) WHERE s.uuid = node.uuid "
    }
    else if(req.body.title && req.body.type !== "all"){
      query += "CALL db.index.fulltext.queryNodes('titles', $title) YIELD node " +
      "MATCH (s:Source {type : $type}) WHERE s.uuid = node.uuid "
    }
    else if(!req.body.title && req.body.type !== "all"){
      query += "MATCH (s:Source {type : $type}) "
    }
    else if(req.body.classes && req.body.classes !== "undefined"){
      query += "MATCH (s:Source)<-[:TAGS]-(c:Class) WHERE c.name IN $classes "
    }
    else{
      query += "MATCH (s:Source) "
    }   
    query += "WITH s " 
    if(req.body.author){
      query += "CALL db.index.fulltext.queryNodes('authorSearch', $author) YIELD node " +
      "MATCH (a1:Author)-[:AUTHOR]->(s) WHERE a1.uuid = node.uuid " + 
      "OPTIONAL MATCH (a:Author)-[:AUTHOR]->(s) "
    }
    else{
      query += "OPTIONAL MATCH (a:Author)-[]->(s) "
    }
    query += "WITH s, a "
   if(req.body.publisher){
    // Use a subquery or strict match that carries the publisher context through
      query += "CALL db.index.fulltext.queryNodes('publisherName', $publisher) YIELD node AS pubNode " +
               "MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s) " +
               "WHERE p.uuid = pubNode.uuid ";
    } else {
      query += "OPTIONAL MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s) ";
    }
  query += "WITH s,a,e "
  if(req.body.media !== "all" && req.body.format !== "all"){
    query += "OPTIONAL MATCH (t:Torrent {media: $media, format:$format})<-[:DIST_AS]-(e)-[]-(s) WHERE t.deleted = false " 

  }
  else if(req.body.media !== "all"){
    query += "OPTIONAL MATCH (t:Torrent {media: $media})<-[:DIST_AS]-(e)-[]-(s) WHERE t.deleted = false " 

  }
  else if(req.body.format !== "all"){
    query += "MATCH (t:Torrent {format:$format})<-[:DIST_AS]-(e)-[]-(s) WHERE t.deleted = false " 

  }
  else{
    query += "OPTIONAL MATCH (t:Torrent)<-[:DIST_AS]-(e)-[]-(s) WHERE t.deleted = false " 

  }
  query+= "WITH s " 
  if(req.body.classes){
    
    console.log(req.body.class_all)
    if(req.body.class_all === "true"){
      query += "MATCH (c1:Class) WHERE c1.name IN $classes "+ 
      "WITH s, collect(c1) as classes " +
      "WITH s, head(classes) as head, tail(classes) as classes " +
      "MATCH (head)-[:TAGS]->(s) " +
      "WHERE ALL(c1 in classes WHERE (c1)-[:TAGS]->(s)) "
      
    }
    else{
      query += "MATCH (c1:Class)-[:TAGS]->(s) WHERE c1.name IN $classes "
    }

    query += "WITH count(DISTINCT s) AS count "

  }
  else{
    query += "WITH count(DISTINCT s) AS count "

  }
  if(req.body.title && req.body.type === "all"){
      console.log("THERE!!!")
      query += "CALL db.index.fulltext.queryNodes('titles', $title) YIELD node " +
      "MATCH (s:Source) WHERE s.uuid = node.uuid "
    }
    else if(req.body.title && req.body.type !== "all"){
      query += "CALL db.index.fulltext.queryNodes('titles', $title) YIELD node " +
      "MATCH (s:Source {type : $type}) WHERE s.uuid = node.uuid "
    }
    else if(!req.body.title && req.body.type !== "all"){
      query += "MATCH (s:Source {type : $type}) "
    }
    else{
      query += "MATCH (s:Source) "
    }
    query += "WITH s, count " 
    if(req.body.author){
      query += "CALL db.index.fulltext.queryNodes('authorSearch', $author) YIELD node " +
      "MATCH (a1:Author)-[:AUTHOR]->(s) WHERE a1.uuid = node.uuid " + 
      "OPTIONAL MATCH (a:Author)-[:AUTHOR]->(s) "
    }
    else{
      query += "OPTIONAL MATCH (a:Author)-[]->(s) "
    }
    query += "WITH s, a, count "
    if(req.body.publisher){
      // Use a subquery or strict match that carries the publisher context through
      query += "CALL db.index.fulltext.queryNodes('publisherName', $publisher) YIELD node AS pubNode " +
               "MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s) " +
               "WHERE p.uuid = pubNode.uuid ";
    } else {
      query += "OPTIONAL MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s) ";
    }
  query += "WITH s,a,p,e, count "
  if(req.body.media !== "all" && req.body.format !== "all"){
    query += "MATCH (t:Torrent {media: $media, format:$format})<-[:DIST_AS]-(e)-[]-(s) WHERE t.deleted = false " 

  }
  else if(req.body.media !== "all"){
    query += "MATCH (t:Torrent {media: $media})<-[:DIST_AS]-(e)-[]-(s) WHERE t.deleted = false " 

  }
  else if(req.body.format !== "all"){
    query += "MATCH (t:Torrent {format:$format})<-[:DIST_AS]-(e)-[]-(s) WHERE t.deleted = false " 

  }
  else{
    query += "OPTIONAL MATCH (t:Torrent)<-[:DIST_AS]-(e)-[]-(s) WHERE t.deleted = false " 

  }
  query+= "WITH s,a,p,e,t,count " 
  if(req.body.classes){
    var classes = JSON.parse(he.decode(req.body.classes)).split(",");
    if(classes[0] === ['']){
      classes = []
    }
    else{
      for (var i = 0; i < classes.length; i++) {
       classes[i] = he.decode(classes[i].trim()).replace(/['"]+/g, '')
      }  
    }
    console.log(req.body.class_all)
    if(req.body.class_all === "true"){
      query += 
      "MATCH (c1:Class) WHERE c1.name IN $classes "+ 
      "WITH s,a,e,t,p, collect(c1) as classes, count " +
      "WITH s,a,e,t,p, head(classes) as head, tail(classes) as classes, count " +
      "MATCH (head)-[:TAGS]->(s) " +
      "WHERE ALL(c1 in classes WHERE (c1)-[:TAGS]->(s)) "
    }
    else{
      query += "MATCH (c:Class)-[:TAGS]->(s) " + 
      "WITH s,a,p,e,t, count " +
      "MATCH (c1:Class)-[:TAGS]->(s) WHERE c1.name IN $classes "
    }


  }

query += "MATCH (c:Class)-[:TAGS]->(s) " +
    "WITH s, collect(DISTINCT a) AS authors, collect(DISTINCT{edition : e, publisher :p, torrent: t} ) AS edition_torrents, collect(DISTINCT c) as classes, count "

  

  

  switch(req.body.order[0].column){
    case '0':
      query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.updated DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      break;
    case '1':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.title ASC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.title DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      break;
    case '2':
      console.log("SNATCHES SORT")
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY TOINTEGER(s.snatches) ASC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY TOINTEGER(s.snatches) DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      }
      break;
    case '3':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, authors, edition_torrents, cclasses, count ORDER BY s.adjDate ASC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.adjDate DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      break;    
    case '4':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, authors, edition_torrents, classes,  ORDER BY s.updated ASC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.updated DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      }
      break;
    default :
      query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.updated DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      break;

  }
  console.log(query);
  var params = {skip : req.body.start, limit : req.body.length, title : he.encode(remove_stopwords(he.decode(he.decode(req.body.title)))), author : he.encode(he.decode(he.decode(req.body.author))), 
  classes: classes, publisher : he.encode(he.decode(he.decode(req.body.publisher))), type : he.encode(he.decode(he.decode(req.body.type))), media: req.body.media, format : req.body.format}
  console.log(params.classes)
  console.log(req.body.type)
  console.log(he.encode(he.decode(he.decode(he.decode(req.body.type)))))
  session.run(query , params).then(data => {
      session.close()      
      var recordsTotal;
      var recordsFiltered;
      if(data.records.length > 0){
        recordsTotal = parseInt(data.records[0]._fields[4]);
        recordsFiltered = parseInt(data.records[0]._fields[4])
        console.log("TOTAL: " + recordsTotal)
        
      }
      return res.json({recordsTotal: recordsTotal, recordsFiltered: recordsFiltered, records: data.records});
    })
})
app.post("/graph_search", 
  check("class_all").trim().escape().isLength({max:100}), 
  check("title").trim().escape().isLength({max: 400}),
  check("author").trim().escape().isLength({max: 200}), 
  check("classes").trim().escape().isLength({max:1251}).toLowerCase(),
  check("publisher").trim().escape().isLength({max: 612}), 
  check("type").trim().escape().isLength({max:200}), 
  check("media").trim().escape().isLength({max:350}),
  check("format").trim().escape().isLength({max:360}), 
  function(req,res){
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json({ errors: errors.array() });

    let classes = null; 
    if(req.body.classes && req.body.classes !== "undefined"){
        classes = JSON.parse(he.decode(req.body.classes)).split(",");
        classes = classes[0] === [''] ? [] : classes.map(c => he.decode(c.trim()).replace(/['"]+/g, ''));
    }

    req.body.title = remove_stopwords(req.body.title).replace(":", ' ');
    req.body.author = req.body.author.replace(":", ' ');
    req.body.publisher = req.body.publisher.replace(':', ' ');
    
    if(req.body.publisher.toLowerCase().startsWith("propagate")) req.body.publisher = "propagate.info";

    const session = driver.session();
    var query = "";

    // --- 1. FILTERING BLOCK (Defining 's') ---
    if(req.body.title && req.body.title !== "undefined" && req.body.type === "all"){
      query += "CALL db.index.fulltext.queryNodes('titles', $title) YIELD node " +
               "MATCH (s:Source) WHERE s.uuid = node.uuid "
    }
    else if(req.body.title && req.body.title !== "undefined" && req.body.type !== "all"){
      query += "CALL db.index.fulltext.queryNodes('titles', $title) YIELD node " +
               "MATCH (s:Source {type : $type}) WHERE s.uuid = node.uuid "
    }
    else if(!req.body.title && req.body.type !== "all" && req.body.type){
      query += "MATCH (s:Source {type : $type}) "
    }
    else if(req.body.classes && req.body.classes !== "undefined" && req.body.class_all !== "true"){
      query += "MATCH (s:Source)<-[:TAGS]-(c:Class) WHERE c.name IN $classes "
    }
    else{
      query += "MATCH (s:Source) "
    }    

    // --- 2. INITIALIZE SCOPE VARIABLES ---
    query += "WITH s, null as a1UUID, null as pUUID ";

    // --- 3. AUTHOR BLOCK ---
    if(req.body.author && req.body.author !== "undefined"){
        query += "CALL db.index.fulltext.queryNodes('authorSearch', $author) YIELD node " +
                 "MATCH (a1:Author)-[:AUTHOR]->(s) WHERE a1.uuid = node.uuid " +
                 "WITH s, a1.uuid as a1UUID, pUUID "; 
    }

    // --- 4. CLASS LOGIC (RESTORED BOTH PATHS) ---
    if(req.body.class_all === "true" && classes){
      query += 
      "MATCH (c1:Class) WHERE c1.name IN $classes "+ 
      "WITH s, a1UUID, pUUID, collect(c1) as classes " + 
      "WITH s, a1UUID, pUUID, head(classes) as head, tail(classes) as classes " + 
      "MATCH (head)-[:TAGS]->(s) " + 
      "WHERE ALL(c1 in classes WHERE (c1)-[:TAGS]->(s)) "
    }
    else if(req.body.classes && req.body.classes !== "undefined"){
      // This is the block that was missing: handle standard class search
      query += "MATCH (c:Class)-[:TAGS]->(s) " + 
               "WITH s, a1UUID, pUUID, c " + 
               "MATCH (c1:Class)-[:TAGS]->(s) WHERE c1.name IN $classes "
    }

    // --- 5. PUBLISHER BLOCK ---
    if(req.body.publisher){
        query += "CALL db.index.fulltext.queryNodes('publisherName', $publisher) YIELD node " +
                 "MATCH (searchedP:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s) WHERE searchedP.uuid = node.uuid " +
                 "WITH s, a1UUID, searchedP.uuid as pUUID ";
    }

    // --- 6. RECOMMENDATION & RETRIEVAL ---
    query += "WITH s, s.uuid as sUUID, a1UUID, pUUID " +
         "CALL { " +
             // Segment 1: The Seed
             "WITH s, a1UUID, pUUID " +
             "MATCH (s) RETURN s as s2 " +
             "UNION ALL " + 
             
             // Segment 2: The Author Books
             "WITH a1UUID, pUUID " + // <--- Missing bridge fixed here
             "MATCH (author:Author {uuid: a1UUID})-[:AUTHOR]->(s2:Source) RETURN s2 " +
             "UNION ALL " +
             
             // Segment 3: The Publisher Books
             "WITH pUUID " + // <--- Missing bridge fixed here
             "MATCH (pub:Publisher {uuid: pUUID})<-[:PUBLISHED_BY]-(:Edition)<-[:PUB_AS]-(s2:Source) RETURN s2 " +
             "UNION ALL " +
             
             // Segment 4: The Related Classes
             "WITH s " + // <--- Missing bridge fixed here
             "MATCH (s)<-[:TAGS]-(c:Class)-[:TAGS]->(s2:Source) " + 
             "RETURN s2 ORDER BY rand() LIMIT 12 " +
         "} " +

             "OPTIONAL MATCH (s2)<-[:AUTHOR]-(a:Author) " +
             "OPTIONAL MATCH (s2)<-[:TAGS]-(c:Class) " +
             "OPTIONAL MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s2) " +
             
             "WITH s2, a, c, p, sUUID, a1UUID, pUUID, " + 
             "CASE " +
             "  WHEN (p.uuid = pUUID OR s2.uuid = sUUID OR a.uuid = a1UUID) THEN 1 " +
             "  ELSE 0 " +
             "END AS priority " + 
             
             "RETURN s2, a, c, p " +
             "ORDER BY priority DESC, rand() " +
             "LIMIT 126";

    var params = {
      skip : req.body.start, limit : req.body.length, 
      title : he.encode(he.decode(he.decode(req.body.title))), 
      author : he.encode(he.decode(he.decode(req.body.author))), 
      classes: classes, 
      publisher : he.encode(he.decode(he.decode(req.body.publisher))), 
      type : req.body.type, media: req.body.media, format : req.body.format
    }

    session.run(query , params).then(data => {
      session.close();
      return res.json({gData: data.records});
    }).catch(err => {
      session.close();
      console.error(err);
      res.status(500).json({error: err.message});
    });
});
app.get("/search", check("term").trim().escape(), check("field").not().isEmpty().trim().escape(), function(req,res){
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ errors: errors.array() });
  }
  const session = driver.session()

  console.log(req.query.field)
  if(search.query.field === "search_publishers"){
    req.query.term = remove_publisher_stopwords(req.query.term)
  }
  else{
    req.query.term = remove_stopwords(req.query.term);
  }
  if(req.query.term.toLowerCase() === "propagate" || req.query.term.toLowerCase() === "propagateinfo"){
    req.query.term = "propagate.info"
  }
  var query = "";  
  console.log("HERE");
  console.log(req.query.field)
  req.query.term = req.query.term.replace(":", '')
  console.log(req.query.term)
  if(req.query.term){
    switch(req.query.field){
      case "search_sources":
        query += "CALL db.index.fulltext.queryNodes('titles', $sourceName) YIELD node " +
        "MATCH (s:Source) WHERE s.uuid = node.uuid " +
        "RETURN s " 
        break;
      case "search_authors":
        query += "CALL db.index.fulltext.queryNodes('authorSearch', $authorName) YIELD node " +
        "MATCH (a:Author)-[:AUTHOR]->(s:Source) WHERE a.uuid = node.uuid " +
        "RETURN a "
        break;
      case "search_classes":
        query += "CALL db.index.fulltext.queryNodes('classes', $className) YIELD node " +
        "MATCH (c:Class) WHERE c.uuid = node.uuid " +
        "RETURN c " 
        break;
      case "search_publishers":
        query += "CALL db.index.fulltext.queryNodes('publisherName', $publisherName) YIELD node " +
        "MATCH (p:Publisher) WHERE p.uuid = node.uuid " +
        "RETURN p "
        break; 
    }
  }

  console.log(query);
  var params = {sourceName : req.query.term, authorName : req.query.term, className : req.query.term, publisherName: req.query.term};
  console.log(params);
  session.run(query , params).then(data => {
      session.close()
      var recordData = []
      if(data.records){
        data.records.forEach(function(data, i){
          if(recordData.find(n=>n.value === (req.query.field === "search_publishers" ? data._fields[0].properties.publisher : 
            data._fields[0].properties.uuid))){
            return;
          }
          switch(req.query.field){
            case "search_sources":
              recordData.push({label : data._fields[0].properties.title, value : data._fields[0].properties.uuid});
              console.log(recordData[0])
              break;
            case "search_authors":
              recordData.push({label : data._fields[0].properties.author, value : data._fields[0].properties.uuid});
              break;
            case "search_classes":
              recordData.push({label : data._fields[0].properties.name, value : data._fields[0].properties.uuid});
              break;
            case "search_publishers":
              recordData.push({label : data._fields[0].properties.name, value : data._fields[0].properties.uuid});
              break;
            default: 
              break;
          }
        }) 
        console.log(recordData);
        return res.send(recordData); 
      }
      else{
        return res.end();
    }
  }).catch(function(err){
    console.log(err);
    return res.end();
  })
  

  
})


var torrentQuery = "OPTIONAL MATCH (a:Author)-[]->(s) " + 
  "WITH s, a, count " +  
  "OPTIONAL MATCH (e:Edition)<-[:PUB_AS]-(s) " +
  "WITH s,a,e, count " +
  "OPTIONAL MATCH (t:Torrent)<-[:DIST_AS]-(e)-[:PUBLISHED_BY]->(p:Publisher) WHERE t.deleted = false " +
  "WITH s,a,p,e,t,count " +  
  "OPTIONAL MATCH (c:Class)-[:TAGS]->(s) " +
  "WITH s, a, collect(DISTINCT{publisher :p, edition : e, torrent: t} ) AS edition_torrents, c, count "

app.post("/torrents", [check("start").trim().escape(), check("length").trim().escape()], async function(req,res){
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ errors: errors.array() });
  }
  const session = driver.session()

  var query = '';

  var params = {};
  query += "MATCH (so:Source) " +
  "WITH count(so) AS count "
  + "MATCH (s:Source) "
  query += torrentQuery;
  switch(req.body.order[0].column){
    case '0':
      query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.updated DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      break;
    case '1':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.title ASC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.title DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      break;
    case '3':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.adjDate ASC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.adjDate DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      break;    
    case '2':
      console.log("SNATCHES SORT")
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.snatches ASC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.snatches DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      }
      break;
    case '4':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.updated ASC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.updated DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      }
      break;
    default :
      query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.updated DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      break;

  }

  params = {skip : req.body.start, limit : req.body.length}

  session.run(query , params).then(async data => {
      session.close()    
      var recordsTotal;
      var recordsFiltered;
      if(data.records.length > 0){
        recordsTotal = parseInt(data.records[0]._fields[4]);
        recordsFiltered = parseInt(data.records[0]._fields[4])
      }
      return res.json({recordsTotal: recordsTotal, recordsFiltered: recordsFiltered, records: data.records});  

    })
})



function decodeEntities(encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? decodeEntities(decodeEntities(word.toLowerCase())) : decodeEntities(decodeEntities(word.toUpperCase()));
  }).replace(/\s+/g, '');
}

app.post("/snatched/:id", check("id").trim().escape().not().isEmpty().isInt().isLength({min : 3, max : 10}), function(req,res){
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    const session = driver.session()

    console.log(req.params.infoHash);

    var query = "MATCH (t:Torrent{size:$id}) " + 
                "SET t.snatches = toFloat(t.snatches + 1) " +
                "WITH t " + 
                "MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)-[:DIST_AS]->(t) " +
                "SET e.snatches = toFloat(e.snatches + 1), p.snatches = toFloat(p.snatches + 1) " +
                "WITH t, e " +
                "MATCH (s:Source)-[:PUB_AS]->(e) " +
                "SET s.snatches = toFloat(s.snatches + 1) " +
                "SET s.lastSnatched = DATETIME() " +
                "WITH s, t, e " +
                "MATCH (c:Class)-[:TAGS]-(s) " +
                "SET c.snatches = toFloat(c.snatches + 1), c.updated = DATETIME() " +
                "WITH s,t " +
                "MATCH (a:Author)-[:AUTHOR]->(s) " +
                "SET a.snatches = toFloat(a.snatches +1) " +
                "WITH t, s " +
                "SET s.count = s.count + 1" 

    var params = {id: parseInt(req.params.id), user : req.user ? req.user.uuid : "null"}

    session.run(query,params).then(async data => {
      session.close();
      
      return res.end();
    })
})

var top10Query = "WITH s, count ORDER BY s.snatches DESC LIMIT 250 " +
    "OPTIONAL MATCH (a:Author)-[]->(s) " + 
    "WITH s, a, count " +  
    "OPTIONAL MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s) " +
    "WITH s,a,e,p, count " +
    "OPTIONAL MATCH (t:Torrent)<-[:DIST_AS]-(e:Edition)-[:PUBLISHED_BY]->(p:Publisher) WHERE t.deleted = false " +
    "WITH s,a,e,t,p, count " +  
    "OPTIONAL MATCH (c:Class)-[:TAGS]->(s) " +
    "WITH s, a, collect(DISTINCT{publisher: p, edition : e, torrent: t} ) AS edition_torrents, c, count "

app.post("/top10/:time", check("time").trim().escape(), async function(req,res){
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    const session = driver.session()

    var params = {limit : req.body.length, skip : req.body.start, buoy:req.body.buoy}

    switch(req.params.time){
      case "day":
        params.time = "P1D";
        break;
      case "week":
        params.time = "P7D";
        break;
      case "month":
        params.time = "P30D";
        break;
      case "year":
        params.time = "P365D";
        break;
      case "alltime":
        params.time = "P99Y";
        break;

    }

    var query = "WITH DATETIME() - duration($time) AS threshold " +
                "MATCH (s:Source) " + 
                "WHERE s.lastSnatched > threshold " +
                "WITH s LIMIT 250 " +
                "WITH count(s) AS count " +
                "WITH DATETIME() - duration($time) AS threshold, count " +
                "MATCH (s:Source) " + 
                "WHERE s.lastSnatched >threshold "

    query += top10Query;
    query += "WITH s, a, edition_torrents, c, count " 
    query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), TOFLOAT(count) ORDER BY s.snatches DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

    session.run(query,params).then(async data => {
      session.close();
            
     var total = 0;
      if(data.records.length > 0){
          total = data.records[0]._fields[4]

        }

      return res.json({recordsTotal : total, recordsFiltered : total, records: data.records});
    })

})

app.get('*', function(req, res, next) {

  res.sendFile(path.join(__dirname, '/static/index.html'));

});

app.listen(3000, "0.0.0.0");
console.log('Server started at http://localhost:3000');