**WELCOME**

Gazelle-WebTorrent is a BitTorrent indexer for WebTorrent based on Project Gazelle. (WebTorrent will be added once qBitTorrent adds their WebTorrent support; as of 3/26/26, there is no client that can seed >1000 WebTorrents.)

Please note that the organizer of this code has no association with any members of Project Gazelle. It is simply an Open Source JQuery/WebTorrent Library generated based on their very innovative and secretive architecture. Here's the genius of Gazelle for library organization: PDFs and mp3s of the same Edition/Translation are listed under the same DataTable heading, and my style was to list two Editions of the same Source Title under the same dataTable dtrg-group heading. 

Classes (tags), Authors, and Publishers all have their own page, what is a corresponding DataTable of Source->Edition->Torrent. 

My site is propagate.info, meant for public domain, educational Ebooks, Audiobooks, Classical Music, Documentaries, and Renaissance Art. Starting with an educational use-case, I have decided to Open-Source this Software, because the way that Gazelle structures Libraries could be very innovative for research, ethics, and scholarship. My work on this began in December 2013. 

Fully built in and plug-in play is a Quantum Random Neo4J Recommendation Engine, which also works on mobile, making this the first quantum mobile app. There is also graph visualization using D3.js, which coheres with an Advanced Search feature, so that users can search by title, author, class, publisher, source type, media, format, and resolution. If you search, say, Russell, Hume in the authors input, you will see them connected in a graph by "All is Quiet on the Western Front," almost like magic.  

**GETTING STARTED**

The server is express/node.js, and the Database is Neo4j; downloads are to work using WebTorrent in the Browser. The Library renders a paginated JQuery DataTable and a D3.js graph to the client (under the search-condition). I have developed an in-house client-side SPA-router called TEMPLAR, which routes using #anchors and uriParams, as a lightweight alternative to AngularJS. You will find the TEMPLAR router on my GitHub page.

This should be literally plug-and-play, all you have to do to get a fully working WebTorrent Indexer is 1) Set up a Neo4J Database, 2) Input your Neo4J credentials into config.js, and 3) Edit the torrents.js model to suit the types, media, formats, and resolutions of your public domain media. 

To get started, you will need to:

*Start a Neo4j Aura Database, or host your own* (they have a free Community Edition up to 200,000 or so nodes)!

*Edit config.js and enter your Neo4j credentials.*

*Edit the Torrents model under static/client/models* Insert Source types (such as Documentary, or Renaissance Art), edition_torrent media (such as Ebook or Concert), and edition_torrent format (such as PDF or mp3), and resolution (such as v0, 720p or 1080x720) For perspective, an Ebook vs Audiobook would be [media] and a PDF vs djvu would be [format]. If you want x264, I recommend setting mkv (x264) as a [format], and then using the Resolutions array to add SD, 720p, 4k, etc. 

*Host server.js, config.js, static/, and js/ on a node.js platform; you might have to work out the express port on certain platforms*

**ABOUT THE ARCHITECTURE**

This BitTorrent Indexer uses the very innovative and profound Gazelle Methodology for Organization, with (Source)-[]->(Edition)->[]->(Torrent). Two editions, with different translators, are listed under the same Datatable dtrg-group, called a Source (as in, "Primary Source"). If there exists both an audiobook (mp3) and an Ebook (PDF) for a particular translator (Edition), the two torrents are listed under that edition in a 'torrentsTable'.  

I have also added Graph Visualization based on Gazelle's "Similar Artists" web, using the powerful Neo4j Java database.

I am currently waiting for qBitTorrent and libTorrent to add WebTorrent support, so that I can seed 4,000 files to Browsers, since BiglyBT and WebTorrent Desktop become unstable after ~1,000 torrents. After libTorrent pushes WebTorrent to stable, and qBitTorrent adds WebTorrent support, I will update the code with WebTorrent enabled.

**AMAZON-APACHE-TEMPLAR**

I use **Apache** as a reverse proxy and **TEMPLAR** as a client-side router. The Apache reverse-proxy and express app are hosted on an **Amazon** EC2 micro-instance.

