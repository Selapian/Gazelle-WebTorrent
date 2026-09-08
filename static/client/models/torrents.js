var tableData;
var dataTable;
var dtRecs; //for DataTable records[]

function refreshDTRecs(){
	dtRecs = [];
}

function insertTableData(data){
	tableData = data;
}

const types = ["Nonfiction", "Fiction", "Classical Music", "Renaissance Art", "Documentary", "Holy Book", "Codex", "Play", "Lecture", "Letter", "Encyclopedia", "Textbook", "Short Story", "Poetry", "Children Book", "Essay", "Journal Article", "Chant" ]
const media = ["Ebook", "Audiobook", "Sheet Music", "Single", "Album", "EP", "Performance", "Canvas", "Sculpture", "Photography", "TV Episode", "Video Short", "Feature Film"]
const formats = ["PDF", "mp3", "FLAC", "JPEG", "png", "mkv", "mp4"]
const music_resolutions = ["Unknown kbps", "64kbps", "128kbps", "192kbps", "VBR", "320kbps", "CD", "Vinyl"]
const video_resolutions = ["SD", "720p", "1080p", "4k", "8k"]
const pdf_resolutions = ["Digital", "Scan"]