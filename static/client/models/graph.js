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

function walkGraph(label, name, route=true){
	resetGraphParams();

	switch(label.toLowerCase()){
		case "source":
			graphParams.source = name;
			break;
		case "author":
			graphParams.author = name;
			break;
		case "class":
			graphParams.classes = "[" + name + "]";
			break;
		case "publisher":
			graphParams.publisher = name;
			break;
	}
	
	if(route){
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
}

function resetGraphParams(){
	graphParams.source = "";
	graphParams.author = "";
	graphParams.classes = "";
	graphParams.publisher = "";
}

