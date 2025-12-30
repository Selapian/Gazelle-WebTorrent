import WebTorrent from 'webtorrent';
import fs from 'fs';
import path from 'path';
import os from 'os';

const client = new WebTorrent();

const folderToSeed = 'C:\\Users\\pjp73\\Downloads\\propagate-info [Audiobooks] (new-years-resolution)';
const fileName = 'propagate-info [Audiobooks] (new-years-resolution).torrent';
const outputTorrentFile = path.join(os.homedir(), 'Downloads', fileName);

console.log(`Target Folder: ${folderToSeed}`);

client.seed(folderToSeed, { 
    name: 'propagate-info [Audiobooks] (new-years-resolution)' 
}, function (torrent) {
    console.log('\n--- Hashing Complete ---');
    
    fs.writeFile(outputTorrentFile, torrent.torrentFile, (err) => {
        if (err) console.error('Error:', err);
        else console.log(`SUCCESS: Created at ${outputTorrentFile}`);
    });
});

// Progress tracking remains the same logic
const progressInterval = setInterval(() => {
    if (!client.torrents[0]) return;
    const torrent = client.torrents[0];
    const progress = (torrent.progress * 100).toFixed(2);
    process.stdout.write(`Creating Torrent: ${progress}% \r`);

    if (torrent.ready) {
        const uploadSpeed = (torrent.uploadSpeed / 1024 / 1024).toFixed(2);
        process.stdout.write(`Seeding Active | Upload: ${uploadSpeed} MB/s | Peers: ${torrent.numPeers} \r`);
    }
}, 500);