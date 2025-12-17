With this webapp code you can make your own public BitTorrent indexer using WebTorrent, totally free. WebTorrent allows torrents to be downloaded in the Browser.

This code was created with the intention of a substantial non-infringing usecase: Graph Search for educational public domain torrents.

The database uses Neo4j and there is a graph visualizer on the front-end. Plus a Quantum Recommendation engine, provided APIs stay up.

My site is hosted at propagate.info, with an original educational use case, a "SEARCH_WRAPPER" for PDFs found on Google.

To start your own Public BitTorrent indexer, create a new Neo4J Database. There is a free instance available up to 100,000 nodes. Then log into the Neo4J Browser and
```
  CREATE (b:Buoy {uuid : randomUUID())
```
Now add Source Genuses (called Types; I did Nonfiction, Fiction, Children Book, etc.) as an array to the Buoy:
```
  MATCH (b:Buoy {uuid : your_uuid]) 
  SET b.types = ["Documentary", "Feature Film", "TV Episode"]
```

Now set up a file config.js in your server root, the same folder the server is in:
```
  export const uri = "your_ neo4j_uri"
  export const user = "your_neo4j_user"
  export const password = "your_neo4j_password"
  export const SESSION_SECRET = "generate_a_cookie_session_secret"
```
Work in progress.
