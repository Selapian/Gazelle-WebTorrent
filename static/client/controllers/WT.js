function DL(infoHash){
	const $body = document.body
    const $progressBar = document.querySelector('#progressBar')
    const $numPeers = document.querySelector('#numPeers')
    const $downloaded = document.querySelector('#downloaded')
    const $total = document.querySelector('#total')
    const $remaining = document.querySelector('#remaining')
    const $uploadSpeed = document.querySelector('#uploadSpeed')
    const $downloadSpeed = document.querySelector('#downloadSpeed')

	WT.add(getMagnetURI(infoHash), function(torrent){	
	 // Trigger statistics refresh
	  torrent.on('done', onDone)
	  const interval = setInterval(onProgress, 500)
	  onProgress()

	  //sorts audiobook by _int
	  torrent.files.sort(function(a, b) {
	    // Extract the first number found in the filename
	    const matchA = a.name.match(/_(\d+)_/) || a.name.match(/(\d+)/);
	    const matchB = b.name.match(/_(\d+)_/) || b.name.match(/(\d+)/);
	    
	    const valA = matchA ? parseInt(matchA[1], 10) : 0;
	    const valB = matchB ? parseInt(matchB[1], 10) : 0;
	    
	    return valA - valB;
		});
	    torrent.files.forEach(function(file){
			file.getBlobURL((err, url) => {
		        if (err) return;		        
		        
		        const btn = document.createElement('a');
		        btn.href = url;
		        btn.download = file.name; 
		        btn.innerText = "Download Full File: " + file.name;
		        btn.className = "download-button-main";
		        btn.style.cssText = "display:inline-block; padding:12px 20px; margin-bottom:20px; background:slategray; color:goldenrod; text-decoration:none; border-radius:6px; font-weight:bold;";
		        		       
		        $("#output").append(btn);            
		        file.appendTo("#output");		        
	   		});		
		})
	})

		function onProgress () {
		  // Peers
		    $numPeers.innerHTML = torrent.numPeers + (torrent.numPeers === 1 ? ' peer' : ' peers')

		    // Progress
		    const percent = Math.round(torrent.progress * 100 * 100) / 100
		    $progressBar.style.width = percent + '%'
		    $downloaded.innerHTML = prettyBytes(torrent.downloaded)
		    $total.innerHTML = prettyBytes(torrent.length)

		    // Remaining time
		    let remaining
		    if (torrent.done) {
		      remaining = 'Done.'
		    } else {
		      remaining = moment.duration(torrent.timeRemaining / 1000, 'seconds').humanize()
		      remaining = remaining[0].toUpperCase() + remaining.substring(1) + ' remaining.'
		    }
		    $remaining.innerHTML = remaining

		    // Speed rates
		    $downloadSpeed.innerHTML = prettyBytes(torrent.downloadSpeed) + '/s'
		    $uploadSpeed.innerHTML = prettyBytes(torrent.uploadSpeed) + '/s'
		}

		function onDone () {			
			onProgress()
			clearInterval(interval);
		}			
}

