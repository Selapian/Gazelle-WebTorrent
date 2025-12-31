/**
 * THE TEMPLAR ENGINE: Multi-file Queue and State Management
 */

// --- GLOBAL SINGLETON INTERVAL MANAGEMENT ---
function startGlobalProgressHeartbeat() {
    if (window.globalProgressInterval) return;
    console.log("[TEMPLAR] Heartbeat Start.");
    window.globalProgressInterval = setInterval(updateUnifiedProgress, 500);
}

function stopGlobalProgressHeartbeat() {
    if (window.globalProgressInterval) {
        clearInterval(window.globalProgressInterval);
        window.globalProgressInterval = null;
    }
}

// --- UNIFIED GLOBAL PROGRESS HANDLER ---
function updateUnifiedProgress() {
    if (!queue || queue.length === 0) return;

    let globalTotal = 0;
    let globalReceived = 0;
    const uniqueFiles = new Map();

    queue.forEach(QItem => {
        if (QItem.fileRefs) {
            QItem.fileRefs.forEach(f => {
                const key = f.name + f.length;
                if (!uniqueFiles.has(key)) {
                    uniqueFiles.set(key, f);
                    globalTotal += f.length;
                    const safeProgress = Math.max(0, Math.min(1, f.progress || 0));
                    const liveBytes = f.downloaded > 0 ? f.downloaded : (safeProgress * f.length);
                    globalReceived += (Number(liveBytes) || 0);
                }
            });
        }
    });

    globalReceived = Math.min(globalReceived, globalTotal);
    const percent = globalTotal > 0 ? Math.round((globalReceived / globalTotal) * 100) : 0;

    const $bar = document.querySelector("#progressBar");
    const $down = document.querySelector("#downloaded");
    const $total = document.querySelector("#total");
    const $speed = document.querySelector("#downloadSpeed");
    const $rem = document.querySelector("#remaining");
    const $numPeers = document.querySelector("#numPeers");
    const $leechSpans = document.querySelectorAll(".show-leech");
    const $seedSpans = document.querySelectorAll(".show-seed");

    if ($bar) $bar.style.width = percent + '%';
    if ($down) $down.innerHTML = prettyBytes(globalReceived);
    if ($total) $total.innerHTML = prettyBytes(globalTotal);
    if ($speed) $speed.innerHTML = prettyBytes(torrent.downloadSpeed || 0) + '/s';

    const allDone = Array.from(uniqueFiles.values()).every(f => f.done);

    if (allDone && globalTotal > 0) {
        if ($rem) $rem.innerHTML = "Done.";
        $leechSpans.forEach(el => el.style.display = 'none');
        $seedSpans.forEach(el => {
            el.style.display = 'inline';
            if (el.innerText.includes("Connected")) el.innerText = "Seeding ";
        });
        if ($numPeers) $numPeers.innerHTML = torrent.numPeers + " Peers.";
        stopGlobalProgressHeartbeat();
    } else {
        $seedSpans.forEach(el => el.style.display = 'none');
        $leechSpans.forEach(el => {
            el.style.display = 'inline';
            if (el.innerText.includes("Connected") || el.innerText.includes("Appending")) el.innerText = "Downloading ";
        });
        if (torrent.downloadSpeed > 0) {
            const secondsLeft = (globalTotal - globalReceived) / torrent.downloadSpeed;
            if ($rem) $rem.innerHTML = moment.duration(secondsLeft, 'seconds').humanize() + ' remaining.';
        }
        if ($numPeers) $numPeers.innerHTML = torrent.numPeers + " Peers.";
    }
}

// --- INITIALIZE CLIENT & TORRENT ---
function initializeMagnets() {
    if (window.client) return; 
    client = new WebTorrent();
    $(".show-seed, .show-leech, #numPeers").hide();
    $("#anonymous").hide();    
    $(".show-connecting").show();

    torrent = client.add(magnetURI, function(t){
        t.deselect(0, t.pieces.length - 1, false);
    });

    torrent.on('ready', function() {
        $(".show-connecting").hide();
        $(".show-seed, #numPeers").fadeIn(1337);
        assertWTEnabled();
        
        // Handling the #file route refresh specifically
        if(TEMPLAR.pageREC() === "file") {
            const currentId = parseInt(TEMPLAR.paramREC().id);
            // Locate the item in the queue that matches the URL param
            let QFILE = queue.find(Q => Q.id === currentId);
            
            // Fallback if queue is empty (fresh refresh)
            if(!QFILE) {
                QFILE = Q_FILE(); // Ensure Q_FILE() is capable of reading params
            }
            
            if(QFILE) {
                $("#anonymous").fadeIn(1337);
                selectFile(QFILE); // This will handle the appendTo("#output")
            }
        } else {
            // Background processing for other pages
            queue.forEach(QFILE => selectFile(QFILE));
        }

        if (document.querySelector("#numPeers")) {
            document.querySelector("#numPeers").innerHTML = torrent.numPeers + " Peers.";
        }
    });
}

// --- COMPLETION HANDLER ---
function onFileDone(file, QFILE) {
    const $remaining = document.querySelector("#remaining");
    const $output = document.querySelector("#output");
    if ($remaining) $remaining.innerHTML = "Done.";
    
    file.getBlobURL((err, url) => {
        if (err) return;
        if ($output && QFILE.media === "Ebook" && parseInt($(".academic").val() === file.length)) $output.innerHTML = ''; 
        
        const btn = document.createElement('a');
        btn.href = url;
        btn.download = file.name; 
        btn.innerText = "Download Full File: " + file.name;
        btn.className = "download-button-main";
        btn.style.cssText = "display:inline-block; padding:12px 20px; margin-bottom:20px; background:slategray; color:goldenrod; text-decoration:none; border-radius:6px; font-weight:bold;";
        
        if ($output && parseInt($(".academic").val()) === file.length) {
            $output.appendChild(btn);            
            file.appendTo("#output");
        }
    });

    if(!QFILE.recorded) $.post("/rev/" + file.length);
    QFILE.recorded = true;
}

// --- MAIN SELECTION ENTRY POINT ---
function selectFile(QFILE) {   
    if (!QFILE) return;
    if (!QFILE.fileRefs) QFILE.fileRefs = [];

    const $output = $("#output");
    
    // 1. DETERMINE "DONE" STATE Synchronously
    let isDone = false;
    if (QFILE.media === "Ebook") {
        const file = torrent.files.find(f => f.length === QFILE.id);
        isDone = file ? file.done : false;
    } else if (QFILE.media === "Audiobook") {
        const audioFiles = torrent.files.filter(f => f.name.toLowerCase().endsWith(".mp3"));
        const prefixMap = {};
        audioFiles.forEach(f => {
            const prefix = f.name.split(/[_-]/)[0];
            if (!prefixMap[prefix]) prefixMap[prefix] = { total: 0, files: [] };
            prefixMap[prefix].total += f.length;
            prefixMap[prefix].files.push(f);
        });
        const fileSet = Object.values(prefixMap).find(a => a.total === QFILE.id);
        isDone = fileSet ? fileSet.files.every(f => f.done) : false;
    }

    // 2. REWRITE HERO TEXT (Avoids the "Double Downloading" string issue)
    $(".show-seed").hide();
    $(".show-leech").show().css("display", "inline"); // Ensure it's visible
    // Directly set the text to avoid appending to existing text
    const $leech = document.querySelector(".show-leech");
    $leech.innerHTML = isDone ? "Appending" : "Downloading";
    // 3. SELECTION & APPEND LOGIC
    if (QFILE.media === "Ebook") {
        const file = torrent.files.find(f => f.length === QFILE.id);
        if (file) {
            file.select();
            if (!QFILE.fileRefs.some(ref => ref.length === file.length)) QFILE.fileRefs.push(file);
            
            if ($output.length) {
                $output.empty(); 
                file.appendTo("#output");
                
                // CRITICAL: If already done, the 'done' event won't fire. Call it manually.
                if (file.done) {
                    onFileDone(file, QFILE);
                } else {
                    file.on('done', () => onFileDone(file, QFILE));
                }
            }
        }
    } else if (QFILE.media === "Audiobook") {
        const id = QFILE.id;
        const container = document.querySelector('#output');
        const audioFiles = torrent.files.filter(f => f.name.toLowerCase().endsWith(".mp3"));

        const arrAudio = [];
        audioFiles.forEach(f => {
            const prefix = f.name.split(/[_-]/)[0]; 
            let ab = arrAudio.find(a => a.prefix === prefix);
            if (!ab) { ab = { prefix, total_size_bytes: 0, files: [] }; arrAudio.push(ab); }
            ab.total_size_bytes += f.length;
            ab.files.push(f);
        });

        const fileSet = arrAudio.find(a => a.total_size_bytes === id);
        if (fileSet) {
            const toSelect = fileSet.files.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
            
            if (container) {
                container.innerHTML = `<h3 style="margin-bottom:15px; color: #fff;">Audiobook: ${toTitleCase(fileSet.prefix)}</h3>`;
                toSelect.forEach((file, index) => {
                    const slot = document.createElement('div');
                    slot.className = 'audio-part';
                    slot.style.cssText = "background: rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-bottom:12px; border: 1px solid rgba(255,255,255,0.1);";
                    
                    // Also update the individual slot status if it's already done
                    const statusText = file.done ? "Appending..." : "Downloading...";
                    slot.innerHTML = `<div class="part-label"><strong>Part ${index + 1}:</strong> <span class="status" style="color:#aaa;">${statusText}</span></div>`;
                    container.appendChild(slot);

                    file.select();
                    if (!QFILE.fileRefs.some(ref => ref.name === file.name)) QFILE.fileRefs.push(file);

                    file.on('done', () => {
                        const allPartsDone = toSelect.every(f => f.done);
                        if (allPartsDone) {
                            if(!QFILE.recorded) $.post("/rev/" + QFILE.id); 
                            QFILE.recorded = true;
                        }
                    });

                    file.getBlob((err, blob) => {
                        if (err) return;
                        
                        // Validate current route context before DOM injection
                        if (parseInt($(".academic").val()) === QFILE.id) {
                            const url = URL.createObjectURL(blob);
                            const statusSpan = slot.querySelector('.status');
                            
                            // 1. Create the Download Link (Matching Ebook style but inline)
                            const downloadLink = document.createElement('a');
                            downloadLink.href = url;
                            downloadLink.download = file.name;
                            downloadLink.innerText = file.name;
                            downloadLink.style.cssText = "color: goldenrod; text-decoration: underline; font-weight: bold; cursor: pointer;";
                            
                            // 2. Update the status span
                            statusSpan.innerHTML = ''; // Clear "Appending..."
                            statusSpan.appendChild(downloadLink);
                            
                            // 3. Append the Audio Player
                            const player = document.createElement('audio');
                            player.controls = true;
                            player.src = url;
                            player.style.cssText = "width:100%; margin-top:10px; display:block;";
                            slot.appendChild(player);
                        }
                    });
                });
            } else {
                toSelect.forEach(file => {
                    file.select();
                    if (!QFILE.fileRefs.some(ref => ref.name === file.name)) QFILE.fileRefs.push(file);
                });
            }
        }
    }
    updateUnifiedProgress();
    startGlobalProgressHeartbeat();
}