var tableData;
var dataTable;
var dtRecs; //for DataTable records[]

function refreshDTRecs(){
	dtRecs = [];
}

function insertTableData(data){
	tableData = data;
}

var types = ["Nonfiction", "Fiction", "Classical Music", "Holy Book", "Codex", "Encyclopedia", "Textbook", "Short Story", "Poetry", "Children Book", "Essay", "Journal Article", "Chant" ]
var media = ["Ebook", "Audiobook", "Single", "Album", "EP", "Performance"]
var formats = ["PDF", "mp3"]
