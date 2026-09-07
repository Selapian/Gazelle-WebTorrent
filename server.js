import express from 'express';

const app = express();

import util from 'util';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import http from 'https';

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
        if(data.records[0]){
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
    check("uuid").notEmpty().trim().escape() 
], async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error("KRAKEN ATTACK: Validation Mutiny!", errors.array());
        return res.json({ errors: errors.array() });
    }

    const label = req.params.label; 
    const uuid = req.query.uuid; 
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
    }

    let matchClause = ""
    switch(label) {
        case 'source':    matchClause = "MATCH (s1:Source {uuid: $uuid})"; break;
        case 'author':    matchClause = "MATCH (a:Author {uuid: $uuid})-[]->(s1:Source)"; break;
        case 'class':     matchClause = "MATCH (c:Class {uuid: $uuid})-[:TAGS]->(s1:Source)"; break;
        case 'publisher': matchClause = "MATCH (p:Publisher {uuid: $uuid})<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s1:Source)"; break;
    }

    let orderBy = "s1.updated DESC"; // Default

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
        MATCH (s)-[:PUB_AS]->(:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false
        WITH TOFLOAT(count(DISTINCT s)) AS full_count

        ${matchClause}
        // Step A: Collect metadata first to avoid row multiplication
        OPTIONAL MATCH (authors:Author)-[]->(s1)
        OPTIONAL MATCH (classes:Class)-[:TAGS]->(s1)
        WITH s1, full_count, collect(DISTINCT authors) AS authorList, collect(DISTINCT classes) AS classList

        // Step B: Match Editions and Torrents specifically for this s1
        MATCH (s1)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) 
        WHERE t.deleted = false
        OPTIONAL MATCH (e)-[:PUBLISHED_BY]->(p:Publisher)
        
        // Step C: Collect the edition info
        // We use DISTINCT here to ensure Torrent A doesn't appear under Edition B
        WITH s1, full_count, authorList, classList, 
             collect(DISTINCT {publisher: p, edition: e, torrent: t}) AS edition_torrents
        RETURN s1, authorList, edition_torrents, classList, full_count ORDER BY ` + orderBy + ` , s1.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit)`;

    try {
        const result = await session.run(cypherQuery, {
            uuid: uuid,
            skip: start || 0,
            limit: length || 10
        });

        const total = result.records[0]._fields[4]
         
        result.records.forEach(function(record){
            console.log(record._fields[2].edition)
        })
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

    // We define the standard "Live Torrent" path suffix here
    // This ensures we only see nodes connected to non-deleted files
    const liveFilter = "-[:PUB_AS]->(:Edition)-[:DIST_AS]->(t:Torrent {deleted: false})";

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
            // Publishers connect to Edition, so the path to Torrent is shorter from here
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

    // Determine the full path based on whether the starting node connects to Source or Edition
    // Authors/Classes -> Source -> Edition -> Torrent
    // Publishers -> Edition -> Torrent
    const fullPathSuffix = (ward === "publishers") 
        ? `${relationshipLabel}(e:Edition)-[:DIST_AS]->(t:Torrent {deleted: false})`
        : `${relationshipLabel}(s:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent {deleted: false})`;

    // --- Dynamic Sort Logic (unchanged) ---
    let orderByClause = `${nodeVar}.name ASC`;
    if (order && order.length > 0) {
        const colIndex = order[0].column;
        const dir = order[0].dir.toUpperCase();
        switch (colIndex) {
            case '0': orderByClause = `${nodeVar}.name ${dir}`; break;
            case '1': orderByClause = `${countAlias} ${dir}`; break;
            case '2': orderByClause = `snatches ${dir}`; break;
        }
    }

    // 1. Updated Count Query: Filters by the presence of a non-deleted Torrent
    const countQuery = 
        `MATCH (n:${nodeLabel})${fullPathSuffix} ` +
        `WHERE n.name <> '' ` +
        `RETURN count(DISTINCT n) AS count`;

    // 2. Updated Data Query: Aggregates based on the live paths only
    const dataQuery = 
        `MATCH (${nodeVar}:${nodeLabel})${fullPathSuffix} ` +
        `WHERE ${nodeVar}.name <> '' ` +
        `WITH ${nodeVar}, ` +
        // We count the unique Sources or Editions connected to the live torrents
        `count(DISTINCT ${connectedNodeLabel.split(':')[0]}) AS ${countAlias}, ` +
        `coalesce(${nodeVar}.snatches, 0) AS snatches ` +
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
            console.error(`Cypher Error:`, error);
            res.status(500).send("Internal Error");
        });
});

app.post("/torrents/adv_search", check("res").trim().escape().isLength({max : 256}), check("all").not().isEmpty().trim().escape().isLength({max:100}), check("title").trim().escape().isLength({max: 400}),
 check("author").trim().escape().isLength({max: 200}), check("classes").trim().escape().isLength({max:1251}).toLowerCase(),
  check("publisher").trim().escape().isLength({max: 612}), check("type").trim().escape().isLength({max:200}), check("media").trim().escape().isLength({max:350}),
  check("format").trim().escape().isLength({max:360}), function(req,res){
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.json({ errors: errors.array() }); }

    // 1. Define the Escape Helper
    function escapeLucene(val) {
        if (!val) return "";
        // Escapes reserved Lucene characters while keeping spaces
        return val.replace(/([\+\-\!\(\)\{\}\[\]\^\~\\\"\*\?\:\/]|&&|\|\|)/g, "\\$1").trim();
    }

    // 2. Initial cleanup
    let rawTitle = req.body.title || "";
    let rawAuthor = req.body.author || "";
    let rawPub = req.body.publisher || "";

    // 3. Apply your stopword and character filters
    let title = remove_stopwords(rawTitle.toLowerCase()).replace(/[:!#;]/g, "");
    let author = remove_stopwords(rawAuthor.toLowerCase().replace(/[:!#;]/g, ""));
    let publisher = remove_publisher_stopwords(rawPub.toLowerCase().replace(/[:!]/g, ""));

    if (publisher === "propagate" || publisher === "propagateinfo") {
        publisher = "propagate.info";
    }

    // 4. THE CRITICAL STEP: Lucene Escape for all searchable strings
    // This prevents the "-" crash in fulltext CALLs
    let sTitle = escapeLucene(title);
    let sAuthor = escapeLucene(author);
    let sPublisher = escapeLucene(publisher);

    // 5. Handle empty cases to prevent <EOF> errors
    // If a field was JUST a hyphen, we treat it as empty
    if (sTitle === "\\-") sTitle = "";
    if (sAuthor === "\\-") sAuthor = "";
    if (sPublisher === "\\-") sPublisher = "";

    const session = driver.session();
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
    
    sTitle = remove_stopwords(sTitle.toLowerCase()).replace(":", ' ').replace("!", "").replace("#", "").replace(";", "");
    sAuthor = remove_stopwords(sAuthor.toLowerCase().replace(":", ' ').replace("!", "").replace("#", "").replace(";", ""));
    sPublisher = remove_publisher_stopwords(sPublisher.toLowerCase().replace(':', ' ').replace("!", ""));
    if(req.body.publisher.toLowerCase() === "propagate" || req.body.publisher.toLowerCase() === "propagateinfo"){
      req.body.publisher = "propagate.info"
    }

    var query = ""


 if (req.body.all === "true") {
    if (req.body.type && req.body.type !== "all") {
        query += "MATCH (s:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false AND s.type = $type ";
    }
    if (sTitle) {
        query += "CALL db.index.fulltext.queryNodes('source_name', $title) YIELD node AS nodeTitle " +
                 "MATCH (s:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false AND s.uuid = nodeTitle.uuid ";
    } else {
        query += "MATCH (s:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false ";
    }

    if (sAuthor) {
        query += "WITH s CALL db.index.fulltext.queryNodes('authorSearch', $author) YIELD node AS nodeAuthor " +
                 "MATCH (a1:Author)-[:AUTHOR]->(s) WHERE a1.uuid = nodeAuthor.uuid ";
    }

    if (req.body.classes) {
        query += "WITH s MATCH (c1:Class) WHERE c1.name IN $classes " +
                 "WITH s, collect(c1) as cList " +
                 "MATCH (s)<-[:TAGS]-(head) WHERE head IN cList " +
                 "AND ALL(c in cList WHERE (s)<-[:TAGS]-(c)) ";
    }

    if (sPublisher) {
        query += "WITH s CALL db.index.fulltext.queryNodes('publisherName', $publisher) YIELD node AS nodePub " +
                 "MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s) " +
                 "WHERE p.uuid = nodePub.uuid ";
    }
    query += "WITH DISTINCT s "; 

    // 2. Calculate the total count of these unique sources
    query += "WITH collect(s) as allSources, count(s) as totalCount ";

    // 3. Unwind to turn them back into rows, but keep the totalCount attached to every row
    query += "UNWIND allSources as s " +
    "WITH s, totalCount as count ";

} else {
    if (req.body.type && req.body.type !== "all") {
        query += "MATCH (s:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false AND s.type = $type ";
    } else {
        query += "MATCH (s:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false ";
    }

    const hasSearchTerm = 
        (req.body.title && req.body.title.trim().length > 0) || 
        (req.body.author && req.body.author.trim().length > 0) || 
        (req.body.publisher && req.body.publisher.trim().length > 0) || 
        (req.body.classes && req.body.classes.length > 0);

    if (hasSearchTerm) {
        // --- START OF CALL BLOCK ---
        // We MUST pass 's' into the subquery using 'WITH s'
        query += " WITH s CALL { WITH s "; 

        // --- TITLE MATCH ---
        query += (sTitle && sTitle.trim().length > 0) ? `
            CALL db.index.fulltext.queryNodes('source_name', $title) YIELD node AS titleNode
            WHERE titleNode = s
            RETURN s AS result
        ` : 'RETURN null AS result ';

        query += " UNION ";

        // --- AUTHOR MATCH ---
        query += (sAuthor && sAuthor.trim().length > 0) ? `
            WITH s
            CALL db.index.fulltext.queryNodes('authorSearch', $author) YIELD node AS a
            MATCH (a)-[:AUTHOR]->(authorSource:Source)
            WHERE authorSource = s
            RETURN s AS result
        ` : 'RETURN null AS result ';

        query += " UNION ";

        // --- PUBLISHER MATCH ---
        query += (sPublisher && sPublisher.trim().length > 0) ? `
            WITH s
            CALL db.index.fulltext.queryNodes('publisherName', $publisher) YIELD node AS p
            MATCH (p)<-[:PUBLISHED_BY]-(:Edition)<-[:PUB_AS]-(pubSource:Source)
            WHERE pubSource = s
            RETURN s AS result
        ` : 'RETURN null AS result ';

        query += " UNION ";

        // --- CLASS MATCH ---
        query += (req.body.classes && req.body.classes.length > 0) ? `
            WITH s
            MATCH (c:Class)-[:TAGS]->(classSource:Source) 
            WHERE c.name IN $classes AND classSource = s
            RETURN s AS result
        ` : 'RETURN null AS result ';

        // --- END OF CALL BLOCK ---
        query += " } ";
        
        // Filter out sources that didn't match any of the UNION branches
        query += " WITH s WHERE result IS NOT NULL ";
    }

    // --- COUNT BRIDGE ---
    // This collects the remaining 's' nodes, counts them, and then lets you continue
    // 1. Filter and lock in the unique sources that match all criteria
    query += "WITH DISTINCT s "; 

    // 2. Calculate the total count of these unique sources
    query += "WITH collect(s) as allSources, count(DISTINCT s) as totalCount ";

    // 3. Unwind to turn them back into rows, but keep the totalCount attached to every row
    query += "UNWIND allSources as s " +
    "WITH s, totalCount as count ";
}


// --- FINAL DATA COLLECTION ---
query += "MATCH (s)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false " +
    (req.body.res !== "all" && req.body.res ? "AND t.res = $res " : "") +
    (req.body.media !== "all" && req.body.media ? "AND t.media = $media " : "") +
    (req.body.format !== "all" && req.body.format ? "AND t.format = $format " : "")
query += "WITH s, e, t, count " +
    "OPTIONAL MATCH (a:Author)-[:AUTHOR]->(s) " +
    "OPTIONAL MATCH (c:Class)-[:TAGS]->(s) " +    
    "OPTIONAL MATCH (e)-[:PUBLISHED_BY]->(p:Publisher) " +
    "WITH s, count, collect(DISTINCT a) AS authors, " +
    "collect(DISTINCT {edition: e, publisher: p, torrent: t}) AS edition_torrents, " +
    "collect(DISTINCT c) as classes " 
    var column = 0;
    if(req.body.order){
        column = req.body.order[0].column;
    }
  switch(column){
    case '0':
      query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.updated DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      break;
    case '1':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.name ASC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.name DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      break;
    case '2':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY TOINTEGER(s.snatches) ASC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY TOINTEGER(s.snatches) DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      }
      break;
    case '3':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.adjDate ASC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.adjDate DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      break;    
    case '4':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.updated ASC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.updated DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      }
      break;
    default :
      query += "RETURN s, authors, edition_torrents, classes, count ORDER BY s.updated DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      break;

  }

 var params = {
        skip: req.body.start,
        limit: req.body.length,
        title: sTitle, // Use sanitized version
        author: sAuthor, // Use sanitized version
        classes: classes,
        publisher: sPublisher, // Use sanitized version
        type: he.encode(he.decode(he.decode(req.body.type))),
        media: req.body.media,
        format: req.body.format,
        res: req.body.res
    };

  session.run(query , params).then(data => {
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

app.post("/graph_search", 
  check("all").trim().escape().isLength({max:100}), 
  check("title").trim().escape().isLength({max: 400}),
  check("author").trim().escape().isLength({max: 200}), 
  check("classes").trim().escape().isLength({max:1251}).toLowerCase(),
  check("publisher").trim().escape().isLength({max: 612}), 
  check("type").trim().escape().isLength({max:200}), 
  check("media").trim().escape().isLength({max:350}),
  check("format").trim().escape().isLength({max:360}), 
  check("res").trim().escape().isLength({max : 256}),
  function(req,res){   
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.json({ errors: errors.array() });
        let classes = null; 
        if(req.body.classes){
            try {
                classes = JSON.parse(he.decode(req.body.classes)).split(",");
                classes = classes[0] === '' ? [] : classes.map(c => he.decode(c.trim()).replace(/['"]+/g, ''));
            } catch (e) { 
                classes = []; 
            }
        }

    // 1. Centralized Escape Function
    function escapeLucene(val) {
        if (!val) return "";
        return val.replace(/([\+\-\!\(\)\{\}\[\]\^\~\\\"\*\?\:\/]|&&|\|\|)/g, "\\$1").trim();
    }

    // 2. Pre-process and Sanitize
    let title = remove_stopwords(req.body.title || "").replace(/[:!#;]/g, " ");
    let author = remove_stopwords(req.body.author || "").replace(/[:!#;]/g, " ");
    let publisher = remove_publisher_stopwords(req.body.publisher || "").replace(/[:!]/g, " ");

    let sTitle = escapeLucene(title);
    let sAuthor = escapeLucene(author);
    let sPublisher = escapeLucene(publisher);

    // 3. Early Exit if search is broken (e.g., searching just "-")
    const hasActiveSearch = (sTitle && sTitle !== "\\-") || 
                            (sAuthor && sAuthor !== "\\-") || 
                            (sPublisher && sPublisher !== "\\-") || 
                            (req.body.classes && req.body.classes.length > 2); // Assuming JSON array string length

    // If "all" is false (OR logic) and there's no valid search term, 
    // we should still allow the "rand()" discovery logic to run, 
    // but we must ensure the individual CALLs don't receive empty strings.


    const session = driver.session();
    let query = "";

    // --- 1. SEARCH LOGIC ---
    if(req.body.all === "true"){
        // AND Logic: Narrow down results sequentially
        if(sTitle){
            query += "CALL db.index.fulltext.queryNodes('source_name', $title) YIELD node " +
                     "MATCH (s:Source)-[:PUB_AS]->(:Edition)-[:DIST_AS]->(t_check:Torrent) " +
                     "WHERE s.uuid = node.uuid AND t_check.deleted = false ";
        } else {
            query += "MATCH (s:Source)-[:PUB_AS]->(:Edition)-[:DIST_AS]->(t_check:Torrent) " +
                     "WHERE t_check.deleted = false ";
        }

        if (req.body.media !== "all" && req.body.media) query += " AND t_check.media = $media ";
        if (req.body.format !== "all" && req.body.format) query += " AND t_check.format = $format ";
        if (req.body.res !== "all" && req.body.res) query += " AND t_check.res = $res ";
        if (req.body.type && req.body.type !== "all") query += " AND s.type = $type ";

        query += "WITH s ";

        if(sAuthor){
        query += "CALL db.index.fulltext.queryNodes('authorSearch', $author) YIELD node AS authorNode " +
                 "MATCH (authorNode)-[:AUTHOR]->(s) " + 
                 "WITH s "; 
        }

        // 3. Publisher Search (Lucene)
        if(sPublisher){
            query += "CALL db.index.fulltext.queryNodes('publisherName', $publisher) YIELD node AS pubNode " +
                     "MATCH (s)-[:PUB_AS]->(:Edition)-[:PUBLISHED_BY]->(pubNode) " +
                     "WITH s ";
        }

        if(req.body.classes && req.body.classes.length > 0){
            query += "MATCH (c1:Class)-[:TAGS]->(s) WHERE c1.name IN $classes "+ 
                     "WITH s, count(c1) as cCount WHERE cCount = " + classes.length + " ";
        }

        query += "WITH s ";
    }
    else {
        // OR Logic: Find hits from various fields within the filtered set
        query += "MATCH (s:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) " +
                 "WHERE t.deleted = false ";
        
        if (req.body.media !== "all" && req.body.media) query += " AND t.media = $media ";
        if (req.body.format !== "all" && req.body.format) query += " AND t.format = $format ";
        if (req.body.res !== "all" && req.body.res) query += " AND t.res = $res ";
        if (req.body.type && req.body.type !== "all") query += " AND s.type = $type ";

         const hasSearchTerm = 
        (req.body.title && req.body.title.trim().length > 0) || 
        (req.body.author && req.body.author.trim().length > 0) || 
        (req.body.publisher && req.body.publisher.trim().length > 0) || 
        (req.body.classes && req.body.classes.length > 0);

    if (hasSearchTerm) {
        // --- START OF CALL BLOCK ---
        // We MUST pass 's' into the subquery using 'WITH s'
        query += " WITH s CALL { WITH s "; 

        // --- TITLE MATCH ---
        query += (sTitle && sTitle.trim().length > 0) ? `
            CALL db.index.fulltext.queryNodes('source_name', $title) YIELD node AS titleNode
            WHERE titleNode = s
            RETURN s AS result
        ` : 'RETURN null AS result ';

        query += " UNION ";

        // --- AUTHOR MATCH ---
        query += (sAuthor && sAuthor.trim().length > 0) ? `
            WITH s
            CALL db.index.fulltext.queryNodes('authorSearch', $author) YIELD node AS a
            MATCH (a)-[:AUTHOR]->(authorSource:Source)
            WHERE authorSource = s
            RETURN s AS result
        ` : 'RETURN null AS result ';

        query += " UNION ";

        // --- PUBLISHER MATCH ---
        query += (sPublisher && sPublisher.trim().length > 0) ? `
            WITH s
            CALL db.index.fulltext.queryNodes('publisherName', $publisher) YIELD node AS p
            MATCH (p)<-[:PUBLISHED_BY]-(:Edition)<-[:PUB_AS]-(pubSource:Source)
            WHERE pubSource = s
            RETURN s AS result
        ` : 'RETURN null AS result ';

        query += " UNION ";

        // --- CLASS MATCH ---
        query += (req.body.classes && req.body.classes.length > 0) ? `
            WITH s
            MATCH (c:Class)-[:TAGS]->(classSource:Source) 
            WHERE c.name IN $classes AND classSource = s
            RETURN s AS result
        ` : 'RETURN null AS result ';

        // --- END OF CALL BLOCK ---
        query += " } ";
        
        // Filter out sources that didn't match any of the UNION branches
        query += " WITH s WHERE result IS NOT NULL ";
    }
}
    // 4. Data Hydration Logic
/*query += `
    WITH DISTINCT s LIMIT 137
    MATCH (t:Torrent)<-[:DIST_AS]-(e:Edition)-[]-(s) 
    WHERE t.deleted = false 
`;


query += `
    WITH s, t
    OPTIONAL MATCH (s)<-[:AUTHOR]-(a:Author)-[:AUTHOR]->(s2:Source)<-[:AUTHOR]-(a2:Author)
    OPTIONAL MATCH (s)<-[:TAGS]-(c:Class)-[:TAGS]->(s2:Source)<-[:TAGS]-(c2:Class)
    OPTIONAL MATCH (p:Publisher)<-[:PUBLISHED_BY]-(:Edition)<-[:PUB_AS]-(s)-[:PUB_AS]->(:Edition)-[:PUBLISHED_BY]->(p2:Publisher)<-[:PUBLISHED_BY]-(:Edition)<-[:PUB_AS]-(s2:Source)
    MATCH (s2)-[:PUB_AS]->(e2:Edition)-[:DIST_AS]->(t2:Torrent) WHERE t2.deleted = false
    
    RETURN s, a, c, p, s2, a2, c2, p2
    ORDER BY rand() 
    LIMIT 333
`;*/

// 4. Seed Selection & Immediate Shuffle
query += `
    MATCH (s)-[:PUB_AS]->(:Edition)-[:DIST_AS]->(torrent:Torrent) WHERE torrent.deleted = false
    WITH DISTINCT s AS s_seed
    WHERE s_seed IS NOT NULL
    WITH s_seed ORDER BY rand() LIMIT 178

    // Find related sources through different paths (OR logic)
    CALL {
      WITH s_seed
      // Path A: Same Author
      MATCH (s_seed)<-[:AUTHOR]-(a:Author)-[:AUTHOR]->(s2:Source)
      RETURN s2 LIMIT 1337
      UNION
      // Path B: Same Class/Tag
      MATCH (s_seed)<-[:TAGS]-(c:Class)-[:TAGS]->(s2:Source)
      RETURN s2 LIMIT 1337
      UNION
      // Path C: Same Publisher
      MATCH (s_seed)-[:PUB_AS]->(:Edition)-[:PUBLISHED_BY]->(p:Publisher)<-[:PUBLISHED_BY]-(:Edition)<-[:PUB_AS]-(s2:Source) WHERE p.name <> ''
      RETURN s2 LIMIT 1337
    }

    // Ensure s2 is not the original seed and has a valid torrent
    MATCH (s2)-[:PUB_AS]->(e2:Edition)-[:DIST_AS]->(t2:Torrent) 
    WHERE t2.deleted = false AND s2 <> s_seed

    // Collect metadata for the second-degree source
    OPTIONAL MATCH (s2)<-[:AUTHOR]-(a2:Author)
    OPTIONAL MATCH (s2)<-[:TAGS]-(c2:Class)
    OPTIONAL MATCH (e2)-[:PUBLISHED_BY]->(p2:Publisher) WHERE p2.name <> ''

    // Also get metadata for the original s_seed if needed for the RETURN
    OPTIONAL MATCH (s_seed)<-[:AUTHOR]-(a:Author)
    OPTIONAL MATCH (s_seed)<-[:TAGS]-(c:Class)
    OPTIONAL MATCH (s_seed)-[:PUB_AS]->(e:Edition)-[:PUBLISHED_BY]->(p:Publisher) WHERE p.name <> ''


    RETURN DISTINCT s_seed AS s, a, c, p, s2, a2, c2, p2
    ORDER BY rand()
    LIMIT 555
`;




 /*   query += `
        // BRIDGE: Consolidate hits and SHUFFLE them immediately
        // This stops the "Most Recent" books from always being the starting point.
        WITH DISTINCT s 
        WHERE s IS NOT NULL 
        WITH s ORDER BY rand() LIMIT 60

        CALL {
            WITH s
            // Neighbors via same Author
            MATCH (s)<-[:AUTHOR]-(a:Author)-[:AUTHOR]->(s2:Source)
            RETURN s2, a, null AS c, null AS p LIMIT 40
            UNION
            // Neighbors via same Class
            MATCH (s)<-[:TAGS]-(c:Class)-[:TAGS]->(s2:Source)
            RETURN s2, null AS a, c, null AS p LIMIT 77
            UNION
            // Neighbors via same Publisher
            MATCH (s)-[:PUB_AS]->(:Edition)-[:PUBLISHED_BY]->(p:Publisher)<-[:PUBLISHED_BY]-(:Edition)<-[:PUB_AS]-(s2:Source)
            RETURN s2, null AS a, null AS c, p LIMIT 40
        }

        // Hydrate s2 metadata
        MATCH (s2)-[:PUB_AS]->(e2:Edition)-[:DIST_AS]->(t2:Torrent)
        WHERE t2.deleted = false
        
        OPTIONAL MATCH (s2)<-[:AUTHOR]-(a2:Author)
        MATCH (s2)<-[:TAGS]-(c2:Class)
        OPTIONAL MATCH (e2)-[:PUBLISHED_BY]->(p2:Publisher)

        RETURN s2, a2, c2, p2, s, a, c, p
        ORDER BY rand()
        LIMIT 333`

// Pass s and t into the final segment
    */
    



    var params = {
      title : sTitle, 
      author : sAuthor, 
      classes: classes, 
      publisher : sPublisher, 
      type : req.body.type, 
      media: req.body.media, 
      format : req.body.format,
      res: req.body.res
    };

    session.run(query, params).then(data => {
      session.close();
      console.log(data.records.length)
      return res.json({gData: data.records});

    }).catch(err => {
      session.close();
      console.error("Neo4j Error:", err);
      res.status(500).json({error: err.message});
    });
});

app.get("/search", check("term").trim().escape(), check("field").not().isEmpty().trim().escape(), check("upload").trim().escape(), function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ errors: errors.array() });
    }

    // 1. Process the term
    let term = req.query.term || "";
    
    if (req.query.field === "search_publishers") {
        term = remove_publisher_stopwords(term);
    } else {
        term = remove_stopwords(term);
    }

    if (term.toLowerCase() === "propagate" || term.toLowerCase() === "propagateinfo") {
        term = "propagate.info";
    }

    // 2. Clean and Sanitize
    term = term.replace(/[:!;]/g, "");

    function escapeLucene(val) {
        return val.replace(/([\+\-\!\(\)\{\}\[\]\^\~\\\"\*\?\:\/]|&&|\|\|)/g, "\\$1");
    }

    let sanitizedTerm = escapeLucene(term).trim();

    // 3. THE CRITICAL GUARD: Stop if empty or just an escaped hyphen
    if (!sanitizedTerm || sanitizedTerm === "\\-") {
        return res.json([]); // Return empty list instead of hitting the DB
    }

    // 4. Build Query
    const session = driver.session();
    var query = "";

    switch (req.query.field) {
        case "search_sources":
            query = "CALL db.index.fulltext.queryNodes('source_name', $sourceName) YIELD node " +
                    "MATCH (s:Source)-[]->(e:Edition)-[]->(t:Torrent {deleted : false}) WHERE s.uuid = node.uuid " +
                    "RETURN DISTINCT s";
            break;
        case "search_authors":
            query = "CALL db.index.fulltext.queryNodes('authorSearch', $authorName) YIELD node " +
                    "MATCH (a:Author)-[:AUTHOR]->(:Source) ";
            if (req.query.upload !== "true") {
                query += "-[]->(e:Edition)-[]->(t:Torrent {deleted : false}) ";
            }
            query += "WHERE a.uuid = node.uuid RETURN DISTINCT a";
            break;
        case "search_classes":
            query = "CALL db.index.fulltext.queryNodes('classes', $className) YIELD node " +
                    "MATCH (c:Class)-[]->(s:Source)-[]->(e:Edition)-[]->(t:Torrent {deleted : false}) WHERE c.uuid = node.uuid " +
                    "RETURN DISTINCT c";
            break;
        case "search_publishers":
            query = "CALL db.index.fulltext.queryNodes('publisherName', $publisherName) YIELD node " +
                    "MATCH (p:Publisher)<-[]-(e:Edition)-[]->(t:Torrent {deleted : false}) WHERE p.uuid = node.uuid " +
                    "RETURN DISTINCT p";
            break;
        default:
            session.close();
            return res.status(400).send("Invalid field");
    }

    var params = {
        sourceName: sanitizedTerm, 
        authorName: sanitizedTerm, 
        publisherName: sanitizedTerm,
        className: sanitizedTerm, // Already handled in your code
    };

    session.run(query, params).then(data => {
        session.close();
    
        // Map the Neo4j records back to the format the autocomplete expects
        var recordData = [];
        if (data.records) {
            data.records.forEach(function(record) {
                // Reaching into the first field returned (s, a, c, or p)
                const node = record._fields[0];
                recordData.push({
                    label: node.properties.name,
                    value: node.properties.uuid
                });
            });
        }
        return res.json(recordData); // Return the array directly
    }).catch(err => {
        session.close();
        console.error("Search Error:", err);
        res.status(500).json([]); // Return empty array on error so frontend doesn't crash
    });
});

var torrentQuery = "OPTIONAL MATCH (a:Author)-[]->(s) " + 
  "OPTIONAL MATCH (e:Edition)<-[:PUB_AS]-(s) " +
  "MATCH (e)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false " +
  "OPTIONAL MATCH (e)-[:PUBLISHED_BY]->(p:Publisher) WHERE t.deleted = false " +
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
  query += "MATCH (s:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) " +
         "WHERE t.deleted = false " +
         "WITH count(DISTINCT s) as totalCount " + // Standardize variable name
         "MATCH (s:Source) " + // Re-match sources
         "WHERE (s)-[:PUB_AS]->(:Edition)-[:DIST_AS]->(:Torrent {deleted: false}) " +
         "WITH s, totalCount as count "; // Pass 'count' into the next part of the query

query += torrentQuery;
var column = '0';
if(req.body.order){
    column = req.body.order[0].column;
}
  switch(column){
    case '0':
      query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.updated DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      break;
    case '1':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.title ASC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.title DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      break;
    case '3':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.adjDate ASC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.adjDate DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      break;    
    case '2':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.snatches ASC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.snatches DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      }
      break;
    case '4':
      if(req.body.order[0].dir === 'asc'){
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.updated ASC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "

      }
      else{
        query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.updated DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
      }
      break;
    default :
      query += "RETURN s, collect(DISTINCT a), edition_torrents, collect(DISTINCT c), count ORDER BY s.updated DESC, s.uuid DESC SKIP TOINTEGER($skip) LIMIT TOINTEGER($limit) "
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

app.post("/rev/:infoHash", check("infoHash").trim().escape().not().isEmpty(), function(req,res){
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.json({ errors: errors.array() });
    }
    const session = driver.session()

    var query = "MATCH (t:Torrent{infoHash:$infoHash}) " + 
                "SET t.snatches = toFloat(t.snatches + 1) " +
                "WITH t " + 
                "OPTIONAL MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)-[:DIST_AS]->(t) " +
                "SET e.snatches = toFloat(e.snatches + 1), p.snatches = toFloat(p.snatches + 1) " +
                "WITH t, e " +
                "MATCH (s:Source)-[:PUB_AS]->(e) " +
                "SET s.snatches = toFloat(s.snatches + 1) " +
                "SET s.lastSnatched = DATETIME() " +
                "WITH s, t, e " +
                "OPTIONAL MATCH (c:Class)-[:TAGS]-(s) " +
                "SET c.snatches = toFloat(c.snatches + 1), c.updated = DATETIME() " +
                "WITH s,t " +
                "OPTIONAL MATCH (a:Author)-[:AUTHOR]->(s) " +
                "SET a.snatches = toFloat(a.snatches +1) " +
                "WITH t, s " +
                "SET s.count = s.count + 1" 

    var params = {infoHash: req.params.infoHash}

    session.run(query,params).then(async data => {
      session.close();
      
      return res.end();
    })
})

var top10Query = "WITH s, count ORDER BY s.snatches DESC LIMIT 250 " +
    "OPTIONAL MATCH (a:Author)-[]->(s)-[]-(e:Edition)-[]-(t:Torrent) WHERE t.deleted = false " + 
    "WITH s, a, count " +  
    "OPTIONAL MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s) " +
    "WITH s, a, count " +
    "OPTIONAL MATCH (s)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false " +
    "OPTIONAL MATCH (e)-[:PUBLISHED_BY]->(p:Publisher) " +
    "WITH s, a, e, t, p, count " +  
    "OPTIONAL MATCH (c:Class)-[:TAGS]->(s) " +
    "WITH s, a, collect(DISTINCT CASE WHEN e IS NOT NULL AND t IS NOT NULL THEN {publisher: p, edition: e, torrent: t} END) AS raw_editions, c, count " +
    "WITH s, a, [x IN raw_editions WHERE x IS NOT NULL] AS edition_torrents, c, count ";

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
      /*case "alltime":
        params.time = "P99Y";
        break;
      */
    }

    var query = "WITH DATETIME() - duration($time) AS threshold " +
                "MATCH (t:Torrent)<-[]-(e:Edition)<-[]-(s:Source) WHERE t.deleted = false " + 
                "AND s.lastSnatched > threshold " + // set to s.top10 > threshold for top10 based on upload date
                "WITH s LIMIT 250 " +
                "WITH count(DISTINCT s) AS count " +
                "WITH DATETIME() - duration($time) AS threshold, count " + // set to s.top10 > threshold for top10 based on upload date
                "MATCH (t:Torrent)<-[]-(e:Edition)<-[]-(s:Source) WHERE t.deleted = false " + 
                "AND s.lastSnatched >threshold "

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


app.post("/create_author", check("name").trim().escape().not().isEmpty().isLength({max : 256}).withMessage("Author must be <= 256 characters"), function(req,res){
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({ errors: errors.array() });
    }
    const session = driver.session()
    var searchableDecoded = he.decode(req.body.name);
    var searchable = he.encode(searchableDecoded.split(",")[0]);
    session.run('MERGE (a:Author {name : $authorName, searchable : $searchable, snatches : toFloat(0)}) ' +
    'ON CREATE SET a.uuid = randomUUID() ' +
    'RETURN a.uuid AS uuid, a.name AS name' ,{authorName : he.encode(req.body.name), searchable : searchable}).then(data => {
        session.close()
        return res.json({uuid : data.records[0].get('uuid'), name : data.records[0].get('name')});
    })    
})

app.post("/add_author", check("name").trim().escape().not().isEmpty().isLength({max : 256}).withMessage("Author must be <= 256 characters"), function(req,res){
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array())
      return res.json({ errors: errors.array() });
    }
    const session = driver.session()
    session.run('MATCH (a:Author {name : $authorName}) ' +
      'RETURN a.uuid AS uuid, a.name AS name', {authorName : he.decode(req.body.name)}).then(data => {
        session.close()
        if(data.records[0]){
          return res.json({uuid : data.records[0].get('uuid'), name : data.records[0].get('name')});
        }
        else{
          return res.json({});
        }
      })  
})


app.get("/upload/:uuid", check("uuid").trim().escape().isLength({max:256}), function(req,res){
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(util.inspect(errors.array()));
    return res.json({ errors: errors.array() });
  }
  const session = driver.session()

  var query = '';
  var params = {};

  query += "MATCH (s:Source {uuid : $uniqueID}) " +
  "WITH s " +
  "OPTIONAL MATCH (a:Author)-[]->(s) " +
  "WITH s, a " +
  "OPTIONAL MATCH (c:Class)-[]->(s) " +
  "WITH s, a, c " +
  "MATCH (e:Edition)<-[:PUB_AS]-(s) " +
  "OPTIONAL MATCH (p:Publisher)<-[:PUBLISHED_BY]-(e) " +
  "WITH s,p,a,e,c, {title : e.title, date: e.date, pages : e.pages, img: e.img, uuid: e.uuid, publisher: p.name} AS edition " +
  "OPTIONAL MATCH (t:Torrent)<-[:DIST_AS]-(e) " +
  "RETURN s.name AS title, COLLECT(DISTINCT {uuid: a.uuid, name : a.name}) AS author, COLLECT(DISTINCT c.name) AS classes, s.date AS date, " +
  "collect(DISTINCT edition) AS editions, COLLECT(DISTINCT t) AS torrents, s.type AS type"

  params["uniqueID"] = req.params.uuid;

  session.run(query , params).then(data => {
    session.close();

    return res.json({record : data.records[0], captcha: res.recaptcha, atlsd: req.user ? req.user.atlsd : ""});
  })
})


app.post("/upload/:uuid", check("APA").trim().escape(), check("type").trim().escape(), 
  check("edition_no").trim().escape().isLength({max: 256}), check("edition_pages").trim().escape().isLength({max :256}), 
  check("edition_publisher").trim().escape().isLength({max:256}), 
  check("uuid").trim().escape().isLength({max:256}), check("edition_date").trim().escape().isLength({max:256}), 
  check("date").trim().escape().isLength({max:256}), check("classes").trim().escape().toLowerCase().isLength({max:3000}), 
  check("torrent").trim().escape(),
   check("edition_title").trim().escape().isLength({max:256}), check("authors").trim().escape().isLength({max : 9000}), 
   check("edition_uuid").trim().escape(),
   check("title").trim().escape().not().isEmpty().isLength({max : 256}).withMessage("Primary Source Title must be >0<= 256 characters"), async function(req,res){
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(util.inspect(errors.array()));
      return res.json({ errors: errors.array() });
    }

/*    if(req.body.copyrighted === "true" && !req.body.ETH_address){
      return res.json({errors : [{msg: "You must enter an ETH address if your work is copyrighted."}]});
    }
    if(!req.body.public_domain && !req.body.payment){
      return res.json({errors: [{msg: "You must legally certify that you have the copyrights to this work, or that it is in the public domain!"}]})
    }

    if(req.body.copyrighted === "false" && req.body.public_domain === "false"){
      req.body.public_domain = true;
    }

*/
    if(req.body.authors){
      var authors = JSON.parse(he.decode(req.body.authors));
    }


    var torrent = JSON.parse(he.decode(req.body.torrent));

    if(!torrent.infoHash){
        return res.json({errors : [{msg: "No infoHash found, please upload a legal file to be processed by WebTorrent!"}]})
    }

    if(req.params.uuid === "undefined" && torrent && !torrent.infoHash){
      return res.json({errors : [{msg : "You must upload a torrent file."}]})
    }

    const session = driver.session()

    var query = '';
    var params = {};

    var edition;
    if(req.body.edition_title.length === 0){
      edition = ""
    }
    else{
      edition = req.body.edition_title;
    }

    var classes = JSON.parse(he.decode(req.body.classes));
    if(classes[0] === ['']){
      classes = []
    }
    else{
      for (var i = 0; i < classes.length; i++) {
       classes[i] = he.encode(classes[i].trim())
      }  
    }

    var date = req.body.date;
    var adjDate = 0;

    if(date){
       if(date.indexOf("B.C.") > -1 || date.indexOf("BC") > -1 || date.indexOf("BCE") > -1 || date.indexOf("B.C.E.") > -1 ){
        if(date.indexOf("Century") === -1 && date.indexOf("century") === -1){
          if(date.indexOf("-") > -1){
            adjDate = date.substring(0, date.indexOf("-"))
          }
          adjDate = date.replace(/\D/g, "");
          adjDate = (parseFloat(adjDate) * -1) * 100;
        }
        else{
          if(date.indexOf("-") > -1){
            adjDate = date.substring(0, date.indexOf("-"))
          }
          adjDate = date.replace(/\D/g, "");
          adjDate = parseFloat(adjDate) * -1;
        }
      }
      else if(date.indexOf("Century") === -1 || date.indexOf("century") === -1){
        if(date.indexOf("-") > -1){
            adjDate = date.substring(0, date.indexOf("-"))
        }
        adjDate = date.replace(/\D/g, "");
        adjDate = parseFloat(adjDate);
      }
      else{
        if(date.indexOf("-") > -1){
            adjDate = date.substring(0, date.indexOf("-"))
        }
        adjDate = date.replace(/\D/g, "");
        let parsed = parseFloat(adjDate);

        if (!isNaN(parsed)) {
            // It's a number (or starts with one), so multiply
            adjDate = parsed * 100;
        } else {
            // It's fully text, like "Cold War Era", so keep it as is
            adjDate = adjDate; 
        }

      }
    }
    if(req.params.uuid === "undefined"){

      async function newUpload(){

          query += 'MERGE (s:Source {name : $sourceTitle, snatches: toFloat(0), top10: DATETIME(), count : 0, ' +
          'type: $sourceType, date: $sourceDate, adjDate : $adjDate, uuid : randomUUID(), updated : toFloat(TIMESTAMP()), ' +
          'created_at: toFloat(TIMESTAMP())}) ' +

            'FOREACH( ' + 
              'class IN $classes | MERGE (c:Class {name : class}) ' +
              'ON CREATE SET c.uuid = randomUUID(), c.snatches = toFloat(0) ' +
              'MERGE (s)<-[:TAGS]-(c) ' + 
            ') ' +

            'MERGE (e:Edition {title : $editionTitle, snatches: toFloat(0), publisher: $editionPublisher, uuid : randomUUID()})<-[:PUB_AS]-(s) ' +
            'SET e.pages = $editionPages, e.no = $editionNo, e.date = $editionDate, e.img = $editionIMG, e.created_at = toFloat(TIMESTAMP()) '     
            if(req.body.edition_publisher){
                 query += 'MERGE (p:Publisher {name : $editionPublisher}) ' +
                'ON CREATE SET p.uuid = randomUUID(), p.snatches = TOFLOAT(0) ' +
                'MERGE (p)<-[:PUBLISHED_BY]-(e) '
            }
            
            query += 'CREATE (t:Torrent {size : $size, res: $res, infoHash: $infoHash, media : $media, format: $format})<-[:DIST_AS]-(e) ' +
            'SET t.snatches = toFloat(0), t.uuid = randomUUID(), t.created_at = toFloat(TIMESTAMP()), t.deleted = false, t.created_at = toFloat(TIMESTAMP()) '

          params["sourceTitle"] = he.encode(req.body.title);
          params["sourceDate"] = he.encode(req.body.date);
          params["adjDate"] = adjDate;
          params["editionTitle"] = he.encode(edition);
          params["editionIMG"] = req.body.edition_img ? he.encode(req.body.edition_img) : null;
          params["editionPublisher"] = he.encode(req.body.edition_publisher).toLowerCase();
          params["editionPages"] = he.encode(req.body.edition_pages);
          params["editionDate"] = he.encode(req.body.edition_date);
          params["editionNo"] = he.encode(req.body.edition_no);
          params["classes"] = classes;
          params["sourceType"] = he.encode(req.body.type);
          params["size"] = torrent.size;
          params["infoHash"] = torrent.infoHash;
          params["media"] = torrent.media;
          params["format"] = torrent.format;
          params["res"] = torrent.res;

          if(authors && authors.length > 0){
            authors.forEach(function(author, i){  
               query += 'WITH s ' + 
              'OPTIONAL MATCH (a:Author {uuid : $authorUUID' + i + '}) ' +
              'WITH s, a ' + 
              'MERGE (s)<-[au:AUTHOR]-(a) '
              params["authorUUID" + i] = author.uuid;
            })
          }
          query += 'RETURN s.uuid AS uuid '

          session.run(query , params).then(async data => {
                session.close()
                var classTags = ""
                classes.forEach(function(c, i){
                  classTags += "#" + he.decode(camelize(c))
                  if(i !== classes.length - 1){
                    classTags += ", "
                  }
                })
                /*setTimeout(function(){
                  postTweet(he.decode(req.body.APA.substring(0, 180)) + " " + params.format +
                       " Torrent at propagate.info/#source?uuid=" + data.records[0]._fields[0] + " " +
                      classTags)
                },1000)*/
                
                if(req.user){

                  promote(data.records[0]._fields[1].properties)

                }
               
                return res.json({"uuid" : data.records[0]._fields[0]});
            })  
          .catch(function(err){
            if(err.code === "Neo.ClientError.Schema.ConstraintValidationFailed"){
              err = "Torrent infoHash already exists on the site."
            }
            console.log("NEO4J ERROR: " + err);
            return res.json({errors: [{msg : err}]})
          })
      }

      newUpload();

    }
    //existing upload condition
    else{
      var edition_uuid;
      //edition not selected in dropdown
      if(req.body.edition_uuid === "null"){
        edition_uuid = "null";
      }
      else{
        edition_uuid = req.body.edition_uuid;
      }

       if(torrent.infoHash){
            query += 'MATCH (s:Source {uuid : $uniqueID}) ' +
            "SET s.updated = toFloat(TIMESTAMP()), s.top10 = DATETIME() " +
            'WITH s '
            // 1. Find or create the node based on the UUID provided
           query += "MERGE (e:Edition {uuid: coalesce($edition_uuid, 'temporary_null_key')})"

           //empty in dropdown, since coalesce null is not an edition.uuid
            query += 'ON CREATE SET ' +
                     'e.uuid = randomUUID(), e.snatches = 0.0, e.no = $editionNo, ' +
                     'e.date = $editionDate, e.created_at = TOFLOAT(TIMESTAMP()), ' +
                     'e.pages = $editionPages, e.title = $editionTitle, e.publisher = $editionPublisher '              

            query += 'WITH s, e ';
            query += 'MERGE (s)-[pu:PUB_AS]->(e) ';
            if(req.body.edition_publisher){
                query += 'MERGE (p:Publisher {name : $editionPublisher}) ' +
                'ON CREATE SET p.uuid = randomUUID(), p.snatches = TOFLOAT(0) ' +
                'MERGE (p)<-[:PUBLISHED_BY]-(e) '
            }
            query += "WITH s, e MERGE (t:Torrent {snatches: toFloat(0), created_at: toFloat(TIMESTAMP()), "+
            "deleted : false, uuid: randomUUID(), media : $torrentMedia, format: $torrentFormat, "+
            "res : $torrentRes, size: $torrentSize, infoHash: $torrentInfoHash" +
            "})<-[di:DIST_AS]-(e) " 
        }
        //(:Source)->(:Edition)->(:Torrent), also (:Publisher)->(:Edition). A Publisher is distinct from an Edition (since one publisher may connect to multiple Editions)
       

      params["uniqueID"] = req.params.uuid;
      params["classes"] = classes;
      params["sourceTitle"] = he.encode(req.body.title)
      params["sourceDate"] = he.encode(req.body.date)
      params["editionPublisher"] = he.encode(req.body.edition_publisher).toLowerCase();
      params["editionPages"] = he.encode(req.body.edition_pages);
      params["editionDate"] = he.encode(req.body.edition_date);
      params["editionTitle"] = he.encode(req.body.edition_title);
      params["editionNo"] = he.encode(req.body.edition_no);
      params["torrentInfoHash"] = torrent.infoHash;
      params["torrentMedia"] = torrent.media; //media is ebook/audiobook/album/concert/tv episode (as in documentary, which is an s.type)
      params['torrentFormat'] = torrent.format; //media and format are held on the torrent, since the same :Edition node can have both an Ebook and an Audiobook, as when H.L. Mencken translates the Antichrist, and there is a PDF and mp3 of his translation. If you understand this, you know the magic of Gazelle
      params["torrentRes"] = torrent.res;
      params["torrentSize"] = torrent.size;
      params["sourceType"] = he.encode(req.body.type)
      params["edition_uuid"] = edition_uuid; //do not mess with this, most fragile

      var authors = JSON.parse(he.decode(req.body.authors));

      query += 'RETURN s.uuid AS uuid, t.infoHash AS infoHash '
      session.run(query , params).then(async data => {
            session.close()
            var classTags = ""
            classes.forEach(function(c, i){
              classTags += "#" + he.decode(camelize(c))
              if(i !== classes.length - 1){
                classTags += ", "
              }
            })
            /*postTweet(he.decode(req.body.APA.substring(0, 180)) + " " + params.torrentFormat + 
                 " Torrent at propagate.info/#source?uuid=" + data.records[0]._fields[0] + " " +
                classTags)*/

            
            return res.json({"uuid" : data.records[0].get("uuid")});
        })  
      .catch(function(err){
        if(err.code === "Neo.ClientError.Schema.ConstraintValidationFailed"){
          err = "Torrent infoHash already exists on the site."
        }
        console.log("ERROR: " + err);
        return res.json({errors: [{msg : err}]})
      })
    }
})

app.get('*', function(req, res, next) {

  res.sendFile(path.join(__dirname, '/static/index.html'));

});

app.listen(3000, "0.0.0.0");
console.log('Server started at http://localhost:3000');