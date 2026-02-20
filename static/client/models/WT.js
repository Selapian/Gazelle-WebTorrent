const WT = new WebTorrent();

function getMagnetURI(infoHash){
	return "magnet:?xt=urn:btih:" + infoHash + "&tr=wss%3A%2F%2Ftracker.openwebtorrent.com%2Fannounce&tr=wss%3A%2F%2Ftracker.btorrent.xyz%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337%2Fannounce&tr=udp%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce";
}