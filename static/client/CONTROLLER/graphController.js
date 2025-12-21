function initializeGraph(){
	if(ANCHOR.page() === "titles" && ANCHOR.getParams() && ANCHOR.getParams().search){
		$.post("/graph_search",  {title : ANCHOR.getParams() ? ANCHOR.getParams().title : "",
		author : ANCHOR.getParams() ? ANCHOR.getParams().author : "",
		classes : ANCHOR.getParams() ? ANCHOR.getParams().classes : "",
		class_all : ANCHOR.getParams() ? ANCHOR.getParams().class_all : "",
		publisher : ANCHOR.getParams() ? ANCHOR.getParams().publisher : "",
		type : ANCHOR.getParams() ? ANCHOR.getParams().type : "",
		media : ANCHOR.getParams() ? ANCHOR.getParams().media : "",
		format : ANCHOR.getParams() ? ANCHOR.getParams().format : "",
		search : ANCHOR.getParams() ? ANCHOR.getParams().search : ""}, function(data){
			graph(data)
		})
	}
}

function graph(data){
  nodeUUIDs = [];
  renewObelisk();
	data.data.forEach(function(record){

		record._fields.forEach(function(field, i, arr){
			
			var source = arr[0]
			var author = arr[1]
			var classs = arr[2]			
			
			if(ANCHOR.getParams() && ANCHOR.getParams().classes && ANCHOR.getParams().classes !== "undefined"){
			    var classes2 = JSON.parse(decodeEntities(decodeEntities(ANCHOR.getParams().classes))).split(",");
			  
			   	classes2.forEach(function(c, j){
			     classes2[j] = decodeEntities(decodeEntities(classes2[j].trim().toLowerCase())).replace(/\s/g,'')				   		
			   	})  
			  
			  
			}
			
			if(ANCHOR.getParams() && ANCHOR.getParams().title && ANCHOR.getParams().title !== "undefined"){
				var titles = decodeEntities(decodeEntities(ANCHOR.getParams().title)).split(" ");
				titles.forEach(function(t, j){
					titles[j] = remove_stopwords(titles[j]);
					titles[j] = decodeEntities(decodeEntities(titles[j].trim().toLowerCase())).replace("/\s/g, ''")
					titles[j] = titles[j].replace(/[!,:]/g, "");
				})
			}

			var publisher = arr[3]



			let checkNodes = Obelisk.nodes.some(n => field && n.id === field.properties.uuid);
			if(checkNodes && field.labels[0] !== "Edition"){
				var foundIndex = Obelisk.nodes.findIndex(x => x.id == field.properties.uuid);
				Obelisk.nodes[foundIndex].count++;
			}
			else if(checkNodes){
				var foundIndex = Obelisk.nodes.findIndex(x => x.id == field.properties[publisher]);
				Obelisk.nodes[foundIndex].count++;
			}				
			else if(!checkNodes && field){
				
				if(field.labels[0] === "Source"){
					nodeUUIDs.push(field.properties.uuid);
					if(ANCHOR.getParams() && ANCHOR.getParams().title &&   titles.some(element => field.properties.title.toLowerCase().includes(element))){
						Obelisk.nodes.push({id: field.properties.uuid, group: "Find Source", name :decodeEntities(decodeEntities(field.properties.title)), count : 1, color: "darkcyan"});
					}
					else{
						Obelisk.nodes.push({id: field.properties.uuid, group: "Source", name :decodeEntities(decodeEntities(field.properties.title)), count : 1, color:"darkcyan"});

					}

				}
				else if(field.labels[0] === "Author"){
					console.log(field.properties.searchable)
					if(ANCHOR.getParams()  && ANCHOR.getParams().author && ANCHOR.getParams().author.toLowerCase().includes(field.properties.searchable.toLowerCase())){
						Obelisk.nodes.push({id: field.properties.uuid, group: "Find Author", name : decodeEntities(decodeEntities(field.properties.author)), count :1, color:"blue"})
					}
					else{
						Obelisk.nodes.push({id: field.properties.uuid, group: "Author", name : decodeEntities(decodeEntities(field.properties.author)), count :1, color:"blue"})

					}

				}
				else if(field.labels[0] === "Class"){
					if(ANCHOR.getParams() && ANCHOR.getParams().classes && classes2 && classes2.includes(field.properties.name.toLowerCase())){
						Obelisk.nodes.push({id: field.properties.uuid, group: "Find Class", name :decodeEntities(decodeEntities(field.properties.name)), count :1, color: "darkgoldenrod"});

					}

					else{
						Obelisk.nodes.push({id: field.properties.uuid, group: "Class", name :decodeEntities(decodeEntities(field.properties.name)), count :1, color: "darkgoldenrod"});

					}				
				}
				else if(field.labels[0] === "Publisher"){
					var publisherSearch = decodeEntities(decodeEntities(ANCHOR.getParams().publisher))

					if(ANCHOR.getParams() && ANCHOR.getParams().publisher && field.properties.name && !publisher && publisherSearch.toLowerCase().includes(decodeEntities(decodeEntities(field.properties.name.toLowerCase())))){
						Obelisk.nodes.push({id: field.properties.uuid, group: "Find Publisher", name :toTitleCase(decodeEntities(decodeEntities(field.properties.name))), count: 1, color:"#F8F8F8"})
					}		
					else if(field.properties.name){
						Obelisk.nodes.push({id: field.properties.uuid, group: "Publisher", name :toTitleCase(decodeEntities(decodeEntities(field.properties.name))), count: 1, color:"mediumvioletred"})					}
				}
			}
			
			
			if(i===0){
					//Source to Author
					if(field && author){
						var checkLinks = Obelisk.links.some(l => author && l.source === author.properties.uuid && l.target === field.properties.uuid)
						if(!checkLinks){
							Obelisk.links.push({source: author.properties.uuid, target: field.properties.uuid, value : 1})
						}	
					}
					//source to Class
					if(field && classs){
						var checkLinks = Obelisk.links.some(l => classs && l.source === field.properties.uuid && l.target === classs.properties.uuid)
						if(!checkLinks){
							Obelisk.links.push({source: field.properties.uuid, target: classs.properties.uuid, value : 1})
						}
					}

					//source to PUBLISHER
					if(field && publisher && publisher.properties.name){ //only if publisher has a name
						var checkLinks = Obelisk.links.some(l => publisher && l.source === field.properties.uuid && l.target === publisher.properties.uuid)
						if(!checkLinks){
							Obelisk.links.push({source: field.properties.uuid, target: publisher.properties.uuid, value : 1})
						}
					}
			}			
		})
	})


	
	if(ANCHOR.page() === "titles"){
		graphRender("search_graph")
	}

}

function graphRender(selector) {
    // 1. Setup Dimensions and Canvas Container
    const width = $(window).width() - 25;
    const height = 333;
    const container = document.getElementById(selector);

    container.innerHTML = ''; 
    const canvas = d3.select(container).append("canvas")
        .attr("width", width)
        .attr("height", height)
        .node();

    const ctx = canvas.getContext("2d");
    let transform = d3.zoomIdentity;
    
    // 2. Initialize the Force Simulation
    const simulation = d3.forceSimulation(Obelisk.nodes)
        .force("link", d3.forceLink(Obelisk.links).id(d => d.id).distance(137))
        .force("charge", d3.forceManyBody().strength(-373))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // 3. Define the Zoom/Pan Behavior
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4]) 
        .on("zoom", (event) => {
            transform = event.transform;
            // Redraw with new transform
            simulation.tick(); 
        });

    d3.select(canvas).call(zoom);

    // 4. Tick Function (Draws the graph and calculates text metrics)
    simulation.on("tick", () => {
        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);
        
        // Draw Links
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 1 / transform.k;
        Obelisk.links.forEach(d => {
            if (d.source && d.target) {
                ctx.beginPath();
                ctx.moveTo(d.source.x, d.source.y);
                ctx.lineTo(d.target.x, d.target.y);
                ctx.stroke();
            }
        });

        // Draw Text Labels (Nodes) and Measure Text Width
        const baseFontSize = 16;
        const currentFontSize = baseFontSize / transform.k;
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${currentFontSize}px Bitcount Prop Single`; 
        
        Obelisk.nodes.forEach(d => {
            // Set the fill style
            switch(d.group){
                case "Source":
                    ctx.fillStyle = "darkcyan";
                    break;
                case "Author":
                    ctx.fillStyle = "blue";
                    break;
                case "Class":
                    ctx.fillStyle = "darkgoldenrod";
                    break;
                case "Publisher":
                    ctx.fillStyle = "mediumvioletred";
                    break;
                default:
                    ctx.fillStyle = "#F8F8F8"
                    break;
            }
            
            
            // Measure the text and store it for click detection
            const metrics = ctx.measureText(d.name);
            d.__textWidth = metrics.width;
            d.__fontSize = currentFontSize;
            
            // Draw the text
            ctx.fillText(d.name, d.x, d.y);
        });

        ctx.restore();
    });
    
    // 5. Click Handler (Hit Testing the Text Bounding Box)
    d3.select(canvas).on("click", (event) => {
        // Invert the mouse coordinates to get the unscaled, untranslated position
        const point = transform.invert([event.offsetX, event.offsetY]);
        const mouseX = point[0];
        const mouseY = point[1];

        const clickedNode = Obelisk.nodes.find(d => {
            // Use stored metrics to define a bounding box for the text
            const textWidth = d.__textWidth || 0;
            const textHeight = d.__fontSize || 0;
            const padding = 5; // Add a small padding around the text box
            
            // Text is center-aligned at (d.x, d.y)
            const left = d.x - (textWidth / 2) - padding;
            const right = d.x + (textWidth / 2) + padding;
            const top = d.y - (textHeight / 2) - padding;
            const bottom = d.y + (textHeight / 2) + padding;
            
            // Check if the click point (mouseX, mouseY) is inside the bounding box
            return mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom;
        });

        if (clickedNode) {
            const d = clickedNode;
            // Your ANCHOR routing logic
            if(d.group === "Source" || d.group === "Find Source"){
                ANCHOR.route("#source?uuid=" + d.id);
            } else if(d.group === "Author" || d.group === "Find Author"){
                ANCHOR.route("#author?uuid=" + d.id);
            } else if(d.group === "Class" || d.group === "Find Class"){
                ANCHOR.route("#class?uuid=" + d.id);
            } else if(d.group === "Publisher" || d.group === "Find Publisher"){
                ANCHOR.route("#publisher?uuid=" + d.id);
            }
        }
    });

    //ORGANON: AlterIdeal
    simulation.alphaTarget(0.07).restart();
}

