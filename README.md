**WELCOME**

Gazelle-WebTorrent is a BitTorrent indexer for WebTorrent based on Project Gazelle. Please note that the organizer of this code has no association with any members of Project Gazelle. It is simply an Open Source JQuery/WebTorrent Library generated based on their architecture.

My site is propagate.info, meant for public domain PDFs and audiobooks. Starting with an original educational use-case, I have decided to Open-Source this Software, because the way that Gazelle structures Libraries could be very innovative for research, ethics, and scholarship.

**GETTING STARTED**

The server is express/node.js, and the Database is Neo4j; downloads work using WebTorrent in the Browser (different from web-seeds). The Library renders JQuery DataTables and a d3 graph to the client. I have developed a lightweight #ANCHOR client-side SPA-router called TEMPLAR as an alternative to AngularJS.

To get started, you will need to:

*Start a Neo4j Aura Database, or host your own* (they have a free Community Edition up to 200,000 or so nodes)!

*Edit config.js and enter your Neo4j credentials.*

*Edit the Torrents model under static/client/models* Insert Source types (such as Documentary, or Renaissance Art), edition_torrent media (such as Ebook or Concert), and edition_torrent format (such as PDF or mp3). We do not currently support codecs or bitrates, so I would recommend editing your formats to be more specific, like mp3 (192kbps), mp3 (V0), x264 (1080p HD), etc. For perspective, an Ebook would be [media] and a PDF vs djvu would be [format]. The way Gazelle works is, PDFs and djvus of the same Edition are listed under the same DataTable heading.

*I am not currently providing the code to produce uploads*. I may create a Neo4j uploader based on file names in the future. If you want to write the code yourself, you need to save the file.length in TOFLOAT(bytes) to t:Torrent.size, and set :Torrent.release = "random_sounding_release_name". All the files for one magnetURI should have the same Release Name. Now if you want to have multiple releases, you must have various magnetURIs with different release names, and TODO: edit the webTorrent.js controller to add the torrent based on release pulled from the URL search params (TEMPLAR.paramREC().release). 

*You must add Author nodes and Class nodes connected to every Source.* (a:Author)-[:AUTHOR]->(s:Source)<-[:TAGS]-(c:Class). The :Publisher logic is (p:Publisher)<-[:PUBLISHED_BY]-(e:Edition)<-[:PUB_AS]-(s:Source). Torrent Logic is (:Edition)-[:DIST_AS]->(:Torrent). Existing Sources, Authors, Classes and Publishers must be Matched by name before running MERGE. Source.name, Author.searchable, Class.name, and Publisher.name all need Indexes, the names of which you may find in the /search REST API route. 

*Editions must be matched based on edition.title*, so multiple edition_torrent.torrent rows show up under their corresponding :Edition. *Set :Torrent.deleted = false on new files.* Note that, as my workaround, a Torrent is more of a File, as there is only one Torrent on the whole site, with all the Files. Editions show up in the DataTable as edition_torrents, which have an edition, torrent, and publisher attached to them.

*Create a WebTorrent with all the files you uploaded with your code.*

*Edit the magnetURI in static/client/controllers/webTorrent.js*

*Edit the magnetURI in static/client/partials/header.html*; **there are two, one for mobile, and one for desktop.**

*Host server.js, config.js, static/, and js/ on a node.js platform*

**ABOUT THE ARCHITECTURE**

This BitTorrent Indexer uses the very innovative and profound Gazelle Methodology for Organization, with (Source)-[]->(Edition)->(Torrent). Two editions, with different translators, are listed under the same Datatable dtrg-group, called a Source (as in, "Primary Source"). If there exists both an audiobook (mp3) and an Ebook (PDF) for a particular translator (Edition), the two torrents are listed under that edition in a 'torrentsTable'.  

I have also added Graph Visualization based on Gazelle's "Similar Artists" web, using the powerful Neo4j Java database.

Finally, downloads work as follows. While qBitTorrent is the only client capable of handling thousands of individual torrents, and libtorrent has added support for WebTorrent in v2.0, qBitTorrent's implementation of the WebTorrent architecture has been delayed for several years. After struggling for literally years with getting thousands of Torrents to seed on WebTorrent Desktop and BiglyBT (which has a WebTorrent plugin), I realized I could seed one Torrent with thousands of files. Now WebTorrent.js begins with all pieces of the torrent deselected, then matches the "length" (size) of the file in bytes from the DB to the metadata of torrent.files[], and runs file.select on the file.length that matches the "id" (Torrent).size stored from Neo4j. 

Indiviudal files currently do not have their own torrent infoHash, unfortunately, because of the arbitrary delay in torrent-client support for WebTorrent. I simply could not seed 4000 individual torrents. So there is one torrent infoHash, which includes all your files.

**AMAZON-APACHE-TEMPLAR**
I use **Apache** as a reverse proxy and **TEMPLAR** as a client-side router. The Apache reverse-proxy and express app are hosted on an **Amazon** EC2 micro-instance.

