function initializeGraph(){
	if(TEMPLAR.pageREC() === "titles" && TEMPLAR.paramREC() && TEMPLAR.paramREC().search){
		$.post("/graph_search",  {title : TEMPLAR.paramREC() ? TEMPLAR.paramREC().title : "",
		author : TEMPLAR.paramREC() ? TEMPLAR.paramREC().author : "",
		classes : TEMPLAR.paramREC() ? TEMPLAR.paramREC().classes : "",
		class_all : TEMPLAR.paramREC() ? TEMPLAR.paramREC().class_all : "",
		publisher : TEMPLAR.paramREC() ? TEMPLAR.paramREC().publisher : "",
		type : TEMPLAR.paramREC() ? TEMPLAR.paramREC().type : "",
		media : TEMPLAR.paramREC() ? TEMPLAR.paramREC().media : "",
		format : TEMPLAR.paramREC() ? TEMPLAR.paramREC().format : "",
		search : TEMPLAR.paramREC() ? TEMPLAR.paramREC().search : ""}, function(data){
			graph(data)
		})
	}
}

function graph(data) {
    nodeUUIDs = [];
    renewObelisk();

    // --- YOUR EXACT SANITIZATION LOGIC (Moved to top for efficiency) ---
    var classes2 = [];
    if (TEMPLAR.paramREC() && TEMPLAR.paramREC().classes) {
        classes2 = JSON.parse(decodeEntities(decodeEntities(TEMPLAR.paramREC().classes))).split(",");
        classes2.forEach(function(c, j) {
            classes2[j] = decodeEntities(decodeEntities(classes2[j].trim().toLowerCase())).replace(/\s/g, '');
        });
    }

    var titles = [];
    if (TEMPLAR.paramREC() && TEMPLAR.paramREC().title) {
        titles = decodeEntities(decodeEntities(TEMPLAR.paramREC().title)).split(" ");
        titles.forEach(function(t, j) {
            titles[j] = remove_stopwords(titles[j]);
            // Precise fix: removed quotes so regex actually works
            titles[j] = decodeEntities(decodeEntities(titles[j].trim().toLowerCase())).replace(/\s/g, '');
            titles[j] = titles[j].replace(/[!,:]/g, "");
        });
    }

    var publishers = [];
    if (TEMPLAR.paramREC() && TEMPLAR.paramREC().publisher) {
        publishers = decodeEntities(decodeEntities(TEMPLAR.paramREC().publisher)).split(" ");
        publishers.forEach(function(t, j) {
            publishers[j] = remove_publisher_stopwords(publishers[j]);
            // Precise fix: removed quotes so regex actually works
            publishers[j] = decodeEntities(decodeEntities(publishers[j].trim().toLowerCase())).replace(/\s/g, '');
            publishers[j] = publishers[j].replace(/[!,:]/g, "");
        });
    }

    // --- PASS 1: NODES ---
    data.gData.forEach(function(record) {
        record._fields.forEach(function(field) {
            if (!field) return;
            let checkNodes = Obelisk.nodes.some(n => n.id === field.properties.uuid);
            if (checkNodes) {
                var foundIndex = Obelisk.nodes.findIndex(x => x.id == field.properties.uuid);
                Obelisk.nodes[foundIndex].count++;
            } else {
                if (field.labels[0] === "Source") {
                    nodeUUIDs.push(field.properties.uuid);
                    let isMatch = titles.some(t => field.properties.name.toLowerCase().includes(t));
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Source" : "Source", name: decodeEntities(decodeEntities(field.properties.name)), count: 1, color: isMatch ? "#F8F8F8" : "#17627C" });
                } else if (field.labels[0] === "Author") {
                    let isMatch = TEMPLAR.paramREC()?.author && TEMPLAR.paramREC().author.toLowerCase().includes(field.properties.searchable.toLowerCase());
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Author" : "Author", name: decodeEntities(decodeEntities(field.properties.name)), count: 1, color: isMatch ? "#F8F8F8" : "blue" });
                } else if (field.labels[0] === "Class") {
                    let isMatch = classes2.includes(field.properties.name.toLowerCase().replace(/\s/g, ''));
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Class" : "Class", name: decodeEntities(field.properties.name), count: 1, color: isMatch ? "#F8F8F8" : "darkgoldenrod" });
                } else if (field.labels[0] === "Publisher") {
                    let isMatch = publishers.some(t => field.properties.name.toLowerCase().includes(t));
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Publisher" : "Publisher", name: toTitleCase(decodeEntities(decodeEntities(field.properties.name))), count: 1, color: isMatch ? "#F8F8F8" : "mediumvioletred" });
                }
            }
        });
    });

    // --- PASS 2: LINKS ---
    data.gData.forEach(function(record) {
        var source = record._fields[0];
        var author = record._fields[1];
        var classs = record._fields[2];
        var publisher = record._fields[3];

        const isGoldLink = (n1, n2) => {
            const findLabels = ["Find Source", "Find Author", "Find Class", "Find Publisher"];
            const node1 = Obelisk.nodes.find(n => n.id === n1.properties.uuid);
            const node2 = Obelisk.nodes.find(n => n.id === n2.properties.uuid);
            return (node1 && findLabels.includes(node1.group)) || (node2 && findLabels.includes(node2.group));
        };

        if (source && author) {
            if (!Obelisk.links.some(l => l.source === author.properties.uuid && l.target === source.properties.uuid)) {
                Obelisk.links.push({ source: author.properties.uuid, target: source.properties.uuid, isGold: isGoldLink(source, author) });
            }
        }
        if (source && classs) {
            if (!Obelisk.links.some(l => l.source === source.properties.uuid && l.target === classs.properties.uuid)) {
                Obelisk.links.push({ source: source.properties.uuid, target: classs.properties.uuid, isGold: isGoldLink(source, classs) });
            }
        }
        if (source && publisher && publisher.properties.name) {
            if (!Obelisk.links.some(l => l.source === source.properties.uuid && l.target === publisher.properties.uuid)) {
                Obelisk.links.push({ source: source.properties.uuid, target: publisher.properties.uuid, isGold: isGoldLink(source, publisher) });
            }
        }
    });

    graphRender(".graph_search");
}

function graphRender(selector) {
    const container = document.querySelector(selector);
    if (!container) return;

    const width = container.clientWidth || $(container).width();
    const height = 333;

    container.innerHTML = ''; 
    const canvas = d3.select(container).append("canvas")
        .attr("width", width)
        .attr("height", height)
        .node();

    const ctx = canvas.getContext("2d");

    /** * Precise Modification: 
     * Calculate scale for 7 clicks out (1/1.3^7 ≈ 0.159)
     */
    const initialScale = Math.pow(1 / 1.3, 7); 
    
    // Create the identity and center it
    const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2) 
        .scale(initialScale)
        .translate(-width / 2, -height / 2); 

    let transform = initialTransform;
    
    const simulation = d3.forceSimulation(Obelisk.nodes)
    // 1. Increase link distance to push connected nodes further apart
    .force("link", d3.forceLink(Obelisk.links).id(d => d.id).distance(1337)) 
    
    // 2. Stronger negative charge (repulsion). -1000 to -1500 is better for high-density text
    .force("charge", d3.forceManyBody().strength(-2900))
    
    // 3. Collision force prevents text labels from sitting directly on top of each other
    .force("collide", d3.forceCollide().radius(512)) 
    
    .force("center", d3.forceCenter(width / 2, height / 2));

    setTimeout(() => {
        simulation.stop();
    }, 5000);

    const zoom = d3.zoom()
        .scaleExtent([0.03, 7]) // Lowered minimum extent to accommodate the new zoom out
        .on("zoom", (event) => {
            transform = event.transform;
            render(); 
        });

    const d3Canvas = d3.select(canvas);
    
    // Sync the internal zoom behavior with our starting transform
    d3Canvas.call(zoom);
    d3Canvas.call(zoom.transform, initialTransform);

    function render() {
        ctx.save();
        ctx.clearRect(0, 0, width, height);
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);

        // --- PASS 1: DRAW NORMAL LINKS (BOTTOM LAYER) ---
        Obelisk.links.forEach(d => {
            if (d.source && d.target && !d.isGold) {
                ctx.beginPath();
                ctx.strokeStyle = "#CDCDCD"; // Subtle gray
                ctx.lineWidth = 1 / transform.k;
                ctx.shadowBlur = 0;
                ctx.moveTo(d.source.x, d.source.y);
                ctx.lineTo(d.target.x, d.target.y);
                ctx.stroke();
            }
        });

        // --- PASS 2: DRAW GOLD LINKS (MIDDLE LAYER) ---
        Obelisk.links.forEach(d => {
            if (d.source && d.target && d.isGold) {
                ctx.beginPath();
                ctx.strokeStyle = "#FFD700"; // Gold
                ctx.lineWidth = 2 / transform.k;
                ctx.shadowColor = "#FFD700"; // Glow
                ctx.shadowBlur = 4;
                ctx.moveTo(d.source.x, d.source.y);
                ctx.lineTo(d.target.x, d.target.y);
                ctx.stroke();
                ctx.shadowBlur = 0; // Reset for next iteration
            }
        });

        // --- PASS 3: DRAW NODES/TEXT (TOP LAYER) ---
        const baseFontSize = 15;
        const currentFontSize = baseFontSize / transform.k;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${currentFontSize}px Red Rose`;

        Obelisk.nodes.forEach(d => {
            if (d.group.includes("Find")) {
                ctx.fillStyle = "#F8F8F8";
            } else {
                switch (d.group) {
                    case "Source": ctx.fillStyle = "#17627C"; break;
                    case "Author": ctx.fillStyle = "blue"; break;
                    case "Class": ctx.fillStyle = "darkgoldenrod"; break;
                    case "Publisher": ctx.fillStyle = "mediumvioletred"; break;
                    default: ctx.fillStyle = "#F8F8F8"; break;
                }
            }
            const metrics = ctx.measureText(d.name);
            d.__textWidth = metrics.width;
            d.__fontSize = currentFontSize;
            ctx.fillText(d.name, d.x, d.y);
        });

        ctx.restore();
    }

    simulation.on("tick", render);

    d3Canvas.on("click", (event) => {
        const point = transform.invert([event.offsetX, event.offsetY]);
        const mouseX = point[0];
        const mouseY = point[1];

        const clickedNode = Obelisk.nodes.find(d => {
            const textWidth = d.__textWidth || 0;
            const textHeight = d.__fontSize || 0;
            const padding = 5; 
            const left = d.x - (textWidth / 2) - padding;
            const right = d.x + (textWidth / 2) + padding;
            const top = d.y - (textHeight / 2) - padding;
            const bottom = d.y + (textHeight / 2) + padding;
            return mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom;
        });

        if (clickedNode) {
            const d = clickedNode;
            const routeMap = { "Source": "source", "Author": "author", "Class": "class", "Publisher": "publisher", "Find Source" : "source", "Find Author" : "author", "Find Class" : "class", "Find Publisher" : "publisher" };
            const label = routeMap[d.group] || d.group.toLowerCase();
            TEMPLAR.route(`#node?label=${label}&uuid=${d.id}`);
        }
    });

    simulation.alphaTarget(.0087).restart();
}

