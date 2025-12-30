/**
 * THE TEMPLAR ENGINE: Multi-file Queue and Interval Management
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

    if ($bar) $bar.style.width = percent + '%';
    if ($down) $down.innerHTML = prettyBytes(globalReceived);
    if ($total) $total.innerHTML = prettyBytes(globalTotal);
    if ($speed) $speed.innerHTML = prettyBytes(torrent.downloadSpeed || 0) + '/s';

    const allDone = Array.from(uniqueFiles.values()).every(f => f.done);
    if (allDone && globalTotal > 0) {
        if ($rem) $rem.innerHTML = "Done.";
        stopGlobalProgressHeartbeat();
    } else if (torrent.downloadSpeed > 0) {
        const secondsLeft = (globalTotal - globalReceived) / torrent.downloadSpeed;
        if ($rem) $rem.innerHTML = moment.duration(secondsLeft, 'seconds').humanize() + ' remaining.';
    }
}

// --- INITIALIZE CLIENT & TORRENT ---
function initializeMagnets() {
    if (window.client) return; // Prevent multiple client instances
    client = new WebTorrent();
    $(".show-seed, .show-leech, #numPeers").hide();
    $("#anonymous").hide();    
    $(".show-connecting").show();

    torrent = client.add(magnetURI, function(t){
        t.deselect(0, t.pieces.length - 1, false);
    });

    torrent.on('ready', function() {
        $(".show-connecting").hide();
        $(".show-leech, #numPeers").fadeIn(1337);

        assertWTEnabled();
        
        // Only trigger background queue processing if NOT on the specific file page
        // (The router handles the active file page)
        if(TEMPLAR.pageREC() !== "file"){
            queue.forEach(QFILE => selectFile(QFILE));
        } else {
            $("#anonymous").fadeIn(1337);
            selectFile(Q_FILE());
        }

        document.querySelector("#numPeers").innerHTML = torrent.numPeers + " Peers.";
    });
}

// --- SINGLE FILE HANDLER ---
function onFileDone(file, QFILE) {
    const $remaining = document.querySelector("#remaining");
    const $output = document.querySelector("#output");
    if ($remaining) $remaining.innerHTML = "Done.";
    file.getBlobURL((err, url) => {
        if (err) return;
        if ($output) $output.innerHTML = ''; 
        const btn = document.createElement('a');
        btn.href = url;
        btn.download = file.name; 
        btn.innerText = "Download Full File: " + file.name;
        btn.className = "download-button-main";
        btn.style.cssText = "display:inline-block; padding:12px 20px; margin-bottom:20px; background:#2ea44f; color:white; text-decoration:none; border-radius:6px; font-weight:bold;";
        $output.appendChild(btn);
        file.appendTo("#output");
    });
    console.log(file.length)
    if(!QFILE.recorded) $.post("/rev/" + file.length);
    QFILE.recorded = true;

}

// --- MAIN SELECTION ENTRY POINT ---
function selectFile(QFILE) {    
    if (!QFILE) return;
    if (!QFILE.fileRefs) QFILE.fileRefs = [];

    if (QFILE.media === "Ebook") {
        const file = torrent.files.find(f => f.length === QFILE.id);
        if (file) {
            file.select();
            if (!QFILE.fileRefs.some(ref => ref.length === file.length)) {
                QFILE.fileRefs.push(file);
            }
            file.on('done', () => onFileDone(file, QFILE));
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
            if (container) container.innerHTML = `<h3 style="margin-bottom:15px; color: #fff;">Audiobook: ${toTitleCase(fileSet.prefix)}</h3>`;

            toSelect.forEach((file, index) => {
                if (container) {
                    const slot = document.createElement('div');
                    slot.className = 'audio-part';
                    slot.style.cssText = "background: rgba(255,255,255,0.05); padding:15px; border-radius:8px; margin-bottom:12px; border: 1px solid rgba(255,255,255,0.1);";
                    slot.innerHTML = `<div class="part-label"><strong>Part ${index + 1}:</strong> <span class="status" style="color:#aaa;">Downloading...</span></div>`;
                    container.appendChild(slot);
                }

                file.select();
                if (!QFILE.fileRefs.some(ref => ref.name === file.name)) {
                    QFILE.fileRefs.push(file);
                }

                // Listener for individual parts of the Audiobook
                file.on('done', () => {
                    // CHECK: Are all parts in this Audiobook set done?
                    const allPartsDone = toSelect.every(f => f.done);
                    if (allPartsDone) {
                        console.log("[TEMPLAR] Audiobook fully downloaded. Posting /rev/.");
                        if(!QFILE.recorded) $.post("/rev/" + QFILE.id); 
                        QFILE.recorded = true;

                    }
                });

                file.getBlob((err, blob) => {
                    if (err || !container) return;
                    const url = URL.createObjectURL(blob);
                    const slots = container.querySelectorAll('.audio-part');
                    const slot = slots[index];
                    const statusSpan = slot.querySelector('.status');
                    statusSpan.innerHTML = `${file.name}`;
                    statusSpan.style.color = "#2ea44f";
                    
                    const player = document.createElement('audio');
                    player.controls = true;
                    player.src = url;
                    player.style.cssText = "width:100%; margin-top:10px; display:block;";
                    slot.appendChild(player);

                    player.onended = () => {
                        const nextPart = slot.nextElementSibling;
                        if (nextPart) {
                            const nextPlayer = nextPart.querySelector('audio');
                            if (nextPlayer) nextPlayer.play();
                        }
                    };
                });
            });
        }
    }
    startGlobalProgressHeartbeat();
}