export default {
	//science as alchemy
	//theology of language
	//science as alchemy (NOT)
	recommendSource : function(driver, uuid, cb){
		var query = "MATCH (s:Source {uuid: $uuid})<-[:TAGS]-(c1:Class)-[:TAGS]->(coSource:Source)<-[:TAGS]-(c2:Class)-[:TAGS]->(coCoSource:Source)-[:PUB_AS]->(e:Edition)-[:DIST_AS]->(t:Torrent) WHERE t.deleted = false " +
	    "AND s <> coCoSource " + 
	    "WITH coCoSource LIMIT 373 " + /* PYRAMID */
		"RETURN coCoSource"
		console.log(uuid);
		var params = {uuid : uuid};
		var session = driver.session()
		  session.run(query, { uuid: uuid })
        .then(data => {
            session.close(); // CRITICAL: Always close sessions
            cb(data);
        })
        .catch(err => {
            session.close();
            console.error("Neo4j Recommend Error:", err);
        });
	}
}