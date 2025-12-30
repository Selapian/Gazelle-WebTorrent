var client;
var torrent = null;
var magnetURI = "magnet:?xt=urn:btih:2f5847f71c1f2baf143830dea0c7316d72dbe8c6&tr=wss%3A%2F%2Ftracker.openwebtorrent.com%2Fannounce&tr=wss%3A%2F%2Ftracker.btorrent.xyz%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337%2Fannounce&tr=udp%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tag=ebooks&tag=audibooks"
var interval = null;

var queue = [];

function Q_FILE() {
    // 1. Create the file object
    let fileObj = {
    	//this is where webtorrent controller gets the id, which is set in queue.forEach(currentFile = )
        id: parseInt(TEMPLAR.paramREC().id),
        media: TEMPLAR.paramREC().media,
        format: TEMPLAR.paramREC().format,
        release: TEMPLAR.paramREC().release,
        apa: decodeURIComponent(TEMPLAR.paramREC().apa),
        interval: null, // Placeholder for the progress timer
        fileRefs: []      // Placeholder for the WebTorrent file object
    };
    if(queue.find(Q => Q.id === parseInt(TEMPLAR.paramREC().id))) return fileObj;

    // 2. Push to queue
    queue.push(fileObj);

    return fileObj;    

}