var Obelisk = {
	nodes : [
	],
	links : [
	]
}

function renewObelisk(){
	Obelisk = {
		nodes :[],
		links: []
	}
}

var graphParams = {
	"source" : "",
	"author" : "",
	"classes" : "",
	"publisher" : ""
}

function walkGraph(label, name){
	switch(label.toLowerCase()){
		case "source":
			graphParams.source = graphParams.source ? graphParams.source + " " + name : name;
			break;
		case "author":
			graphParams.author = graphParams.author ? graphParams.author + " " + name : name;
			break;
		case "class":
			graphParams.classes = graphParams.classes ? ('"' + graphParams.classes.replace(/"/g, "") + "," + name + '"') : '"' + name + '"';
			break;
		case "publisher":
			graphParams.publisher = graphParams.publisher ? graphParams.publisher + " " + name : name;
			break;
	}

    TEMPLAR.paramSET({
    	"search" : "true", 
    	"all" : TEMPLAR.paramREC() && TEMPLAR.paramREC().all ? TEMPLAR.paramREC().all : "false",
    	"title" : graphParams.source,
		"author" : graphParams.author,
		"classes" : graphParams.classes,
		"publisher" : graphParams.publisher
	})
    TEMPLAR.routeParams("#torrents");
}

