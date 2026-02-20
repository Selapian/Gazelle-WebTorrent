**WELCOME**

Gazelle-WebTorrent is a BitTorrent indexer for WebTorrent based on Project Gazelle. Please note that the organizer of this code has no association with any members of Project Gazelle. It is simply an Open Source JQuery/WebTorrent Library generated based on their architecture.

My site is propagate.info, meant for public domain PDFs and audiobooks. Starting with an original educational use-case, I have decided to Open-Source this Software, because the way that Gazelle structures Libraries could be very innovative for research, ethics, and scholarship.

**GETTING STARTED**

The server is express/node.js, and the Database is Neo4j; downloads work using WebTorrent in the Browser (different from web-seeds). The Library renders JQuery DataTables and a d3 graph to the client. I have developed a lightweight #ANCHOR client-side SPA-router called TEMPLAR as an alternative to AngularJS.

To get started, you will need to:

*Start a Neo4j Aura Database, or host your own* (they have a free Community Edition up to 200,000 or so nodes)!

*Edit config.js and enter your Neo4j credentials.*

*Edit the Torrents model under static/client/models* Insert Source types (such as Documentary, or Renaissance Art), edition_torrent media (such as Ebook or Concert), and edition_torrent format (such as PDF or mp3). We do not currently support codecs or bitrates, so I would recommend editing your formats to be more specific, like mp3 (192kbps), mp3 (V0), x264 (1080p HD), etc. For perspective, an Ebook would be [media] and a PDF vs djvu would be [format]. The way Gazelle works is, PDFs and djvus of the same Edition are listed under the same DataTable heading.

*Host server.js, config.js, static/, and js/ on a node.js platform*

**ABOUT THE ARCHITECTURE**

This BitTorrent Indexer uses the very innovative and profound Gazelle Methodology for Organization, with (Source)-[]->(Edition)->[]->(Torrent). Two editions, with different translators, are listed under the same Datatable dtrg-group, called a Source (as in, "Primary Source"). If there exists both an audiobook (mp3) and an Ebook (PDF) for a particular translator (Edition), the two torrents are listed under that edition in a 'torrentsTable'.  

I have also added Graph Visualization based on Gazelle's "Similar Artists" web, using the powerful Neo4j Java database.

I am currently waiting for qBitTorrent and libTorrent to add WebTorrent support, so that I can seed 4,000 files to Browsers, since BiglyBT and WebTorrent Desktop become unstable after ~1,000 torrents. After libTorrent pushes WebTorrent to stable, and qBitTorrent adds WebTorrent support, I will update the code with WebTorrent enabled.

**AMAZON-APACHE-TEMPLAR**
I use **Apache** as a reverse proxy and **TEMPLAR** as a client-side router. The Apache reverse-proxy and express app are hosted on an **Amazon** EC2 micro-instance.

