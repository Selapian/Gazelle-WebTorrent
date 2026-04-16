function initializeGraph(){
    if ($("#graph-container").children().length > 0) return; // Already sailed!
	if(TEMPLAR.pageREC() === "torrents" && TEMPLAR.paramREC() && TEMPLAR.paramREC().search){
		$.post("/graph_search",  {title : TEMPLAR.paramREC() ? TEMPLAR.paramREC().title : "",
		author : TEMPLAR.paramREC() ? TEMPLAR.paramREC().author : "",
		classes : TEMPLAR.paramREC() ? TEMPLAR.paramREC().classes : "",
		all : TEMPLAR.paramREC() ? TEMPLAR.paramREC().all : "",
		publisher : TEMPLAR.paramREC() ? TEMPLAR.paramREC().publisher : "",
		type : TEMPLAR.paramREC() ? TEMPLAR.paramREC().type : "",
		media : TEMPLAR.paramREC() ? TEMPLAR.paramREC().media : "",
		format : TEMPLAR.paramREC() ? TEMPLAR.paramREC().format : "",
        res: TEMPLAR.paramREC() ? TEMPLAR.paramREC().res : "",
		search : TEMPLAR.paramREC() ? TEMPLAR.paramREC().search : ""}, 
        function(data){
			graph(data)
		})
	}
}

function graph(data) {
    nodeUUIDs = [];
    renewObelisk();

    var titles = [];
    if (TEMPLAR.paramREC() && TEMPLAR.paramREC().title) {
        // Clean the entire string of stopwords FIRST
        let cleanedTitleStr = remove_stopwords(decodeEntities(decodeEntities(TEMPLAR.paramREC().title)));
        
        // Split the remaining meaningful words
        titles = cleanedTitleStr.split(" ").filter(t => t.length > 0); 

        titles.forEach(function(t, j) {
            // Now perform character-level sanitization on meaningful tokens
            titles[j] = t.trim().toLowerCase().replace(/\s/g, '').replace(/[!,:]/g, "");
        });
    }

    // --- YOUR EXACT SANITIZATION LOGIC (Moved to top for efficiency) ---
    var classes2 = [];
    if (TEMPLAR.paramREC() && TEMPLAR.paramREC().classes) {
        classes2 = JSON.parse(decodeEntities(decodeEntities(TEMPLAR.paramREC().classes))).split(",");
        classes2.forEach(function(c, j) {
            classes2[j] = decodeEntities(decodeEntities(classes2[j].trim().toLowerCase())).replace(/\s/g, '');
        });
    }

    var publishers = [];
    if (TEMPLAR.paramREC() && TEMPLAR.paramREC().publisher) {
        // Clean the entire publisher string FIRST
        let cleanedPubStr = remove_publisher_stopwords(decodeEntities(decodeEntities(TEMPLAR.paramREC().publisher)));
        
        // Filter out empty strings after the split
        publishers = cleanedPubStr.split(" ").filter(p => p.length > 0);

        publishers.forEach(function(t, j) {
            publishers[j] = t.trim().toLowerCase().replace(/\s/g, '').replace(/[!,:]/g, "");
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
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Source" : "Source", name: decodeEntities(decodeEntities(field.properties.name)), count: 1, color: isMatch ? "darkgoldenrod" : "#17627C" });
                } else if (field.labels[0] === "Author") {

                    let isMatch = TEMPLAR.paramREC()?.author && TEMPLAR.paramREC().author.toLowerCase().includes(field.properties.searchable.toLowerCase());
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Author" : "Author", name: decodeEntities(decodeEntities(field.properties.name)), count: 1, color: isMatch ? "darkgoldenrod" : "blue" });
                } else if (field.labels[0] === "Class") {
                    let isMatch = classes2.includes(field.properties.name.toLowerCase().replace(/\s/g, ''));
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Class" : "Class", name: decodeEntities(field.properties.name), count: 1, color: isMatch ? "darkgoldenrod" : "darkgoldenrod" });
                } else if (field.labels[0] === "Publisher") {
                    let isMatch = publishers.some(t => field.properties.name.includes(t));
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Publisher" : "Publisher", name: toTitleCase(decodeEntities(decodeEntities(field.properties.name))), count: 1, color: isMatch ? "darkgoldenrod" : "mediumvioletred" });
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
    const height = 324;

    container.innerHTML = ''; 
    const canvas = d3.select(container).append("canvas")
        .attr("width", width)
        .attr("height", height)
        .node();

    const ctx = canvas.getContext("2d");

    /** * Precise Modification: 
     * Calculate scale for 7 clicks out (1/1.3^7 ≈ 0.159)
     */
    const initialScale = 0.0185; 
    
    // Create the identity and center it
    const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2) 
        .scale(initialScale)
        .translate(-width / 2, -height / 2); 

    let transform = initialTransform;
    
    const simulation = d3.forceSimulation(Obelisk.nodes)
    // 1. Increase link distance to push connected nodes further apart
    .force("link", d3.forceLink(Obelisk.links).id(d => d.id).distance(8888)) 
    
    // 2. Stronger negative charge (repulsion). -1000 to -1500 is better for high-density text
    .force("charge", d3.forceManyBody().strength(-7777))
    
    // 3. Collision force prevents text labels from sitting directly on top of each other
    // Add padding so labels don't touch edges

    .force("collide", d3.forceCollide().radius(d => {
        // If text width isn't measured yet, use a safe default
        const width = d.__textWidth || 500; 
        return (width / 2) + 1250;
    }))
        
    .force("center", d3.forceCenter(width / 2, height / 2));

    setTimeout(() => {
        simulation.stop();
    }, 4500);

    // --- ZOOM only for DOUBLE-FINGER ---
    const zoom = d3.zoom()
    .scaleExtent([0.0001, 20])
    // THE FILTER: Only allow zoom/pan if it's NOT a single-touch gesture
    .filter(event => {
        // Allow all mouse events (wheel, etc.)
        if (event.type === 'wheel') return true;
        if (event.type === 'mousedown') return true;
        
        // On mobile: ONLY allow if there are 2 or more touches (pinch/pan)
        if (event.touches && event.touches.length > 1) return true;
        
        // Block everything else (single-finger touch)
        return false;
    })
    .on("zoom", (event) => {
        transform = event.transform;
        render(); 
    });
    // Prevent default browser scrolling when the wheel is used over the canvas
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
    }, { passive: false });

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
                ctx.strokeStyle = "#555"; // Subtle gray
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
                ctx.strokeStyle = "gold"; // Gold
                ctx.lineWidth = 2 / transform.k;
                ctx.shadowColor = "gold"; // Glow
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
        ctx.font = `${currentFontSize}px Pirata One`;

        Obelisk.nodes.forEach(d => {
            if (d.group.includes("Find")) {
                ctx.fillStyle = "blue";
            } else {
                switch (d.group) {
                    case "Source": ctx.fillStyle = "white"; break;
                    case "Author": ctx.fillStyle = "yellow"; break;
                    case "Class": ctx.fillStyle = "green"; break;
                    case "Publisher": ctx.fillStyle = "red"; break;
                    default: ctx.fillStyle = "palegoldenrod"; break;
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

    function handleNormalClick(clickedNode){
        if (clickedNode) {
            const d = clickedNode;
            const routeMap = { "Source": "source", "Author": "author", "Class": "class", "Publisher": "publisher", "Find Source" : "source", "Find Author" : "author", "Find Class" : "class", "Find Publisher" : "publisher" };
            const label = routeMap[d.group] || d.group.toLowerCase();
            TEMPLAR.route(`#node?label=${label}&uuid=${d.id}`);
        }
    }
let startX, startY, startTime;
let startClientX, startClientY; // Add variables to store the actual starting coords
const canvasNode = d3Canvas.node();
canvasNode.addEventListener('touchstart', function(e) {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    // Store these specifically for the node lookup later
    startClientX = t.clientX; 
    startClientY = t.clientY;
    startTime = Date.now();
}, { passive: false });

canvasNode.addEventListener('touchend', function(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const duration = Date.now() - startTime;

    // 1. GESTURE: PECHA UNROLL (Swipe Right)
    if (dx > 70 && Math.abs(dy) < 40) {
        // USE startClientX/Y so we find the node we started on!
        processInput(startClientX, startClientY, true);
    } 
    else if (dx < -70 && Math.abs(dy) < 40) {
        processInput(startClientX, startClientY, true, true);
    }
    // 2. GESTURE: SNAP TAP
    else if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && duration < 300) {
        processInput(t.clientX, t.clientY, false, false);
    }
    
    startX = null;
}, { passive: false });

/**
 * processInput handles both swipes and taps by converting 
 * screen coords to the current D3 Transform space.
 * * @param {number} clientX - The x-coordinate from the touch event
 * @param {number} clientY - The y-coordinate from the touch event
 * @param {boolean} isSwipe - Whether the detected gesture was a swipe
 * @param {boolean} reset - Whether the swipe was a 'Reset' (Left) or 'Walk' (Right)
 */
function processInput(clientX, clientY, isSwipe, reset) {
    if (!canvasNode || !transform) return;

    const rect = canvasNode.getBoundingClientRect();
    
    // 1. Convert Screen space to Canvas space
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    // 2. Invert the transform to find the 'Graph Space' coordinate
    // This accounts for your current zoom (transform.k) and pan (transform.x, transform.y)
    const point = transform.invert([canvasX, canvasY]);
    const graphX = point[0];
    const graphY = point[1];

    // 3. Define the proximity radius
    // We scale the hitbox so that it remains a consistent "physical" size 
    // on the screen regardless of zoom level. 
    // Increasing 50 to 60-80 makes it easier to hit nodes when zoomed out.
    const hitRadius = 60 / transform.k; 

    // 4. Find the closest node within the hitRadius
    let closestNode = null;
    let minDistance = Infinity;

    Obelisk.nodes.forEach(d => {
        const dx = graphX - d.x;
        const dy = graphY - d.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < hitRadius && distance < minDistance) {
            minDistance = distance;
            closestNode = d;
        }
    });

    // 5. Execute Graph Logic
    if (closestNode) {
        if (isSwipe) {
            if (reset) {
                // GESTURE: PECHA UNROLL (Swipe Left)
                console.log("Tibetan Library: Unrolling Pecha " + closestNode.name);
                // Lowercase the group for URL consistency, encode name for safety
                const groupKey = closestNode.group ? closestNode.group.toLowerCase() : "";
                traverseGraph(groupKey, encodeURIComponent(closestNode.name));
            } else {
                // GESTURE: WALK GRAPH (Swipe Right)
                console.log("Tibetan Library: Walking Path " + closestNode.name);
                walkGraph(closestNode.group, closestNode.name);
            }
        } else {
            // GESTURE: SNAP TAP (Single Click)
            // Handle standard node selection or focusing here
            console.log("Node Tapped: " + closestNode.name);
            // Example: focusNode(closestNode);
        }
    } else {
        console.warn("Touch detected, but no node found within radius at graph coords:", graphX, graphY);
    }
}

 d3Canvas.on("click", (event) => {
        // Desktop Shift + Click
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

        if (clickedNode && event.shiftKey) {
            const searchable = encodeURIComponent(clickedNode.name)
            traverseGraph(clickedNode.group.toLowerCase(), searchable);
        }
        else if(clickedNode && event.ctrlKey){
            walkGraph(clickedNode.group.toLowerCase(), clickedNode.name)
        } else if (clickedNode){
            // Your existing normal click logic here
            handleNormalClick(clickedNode);
        }
    });

// 4. THE EXECUTION CORE
function handleExecution(clientX, clientY) {
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Use Obelisk node detection
    const node = Obelisk.nodes.find(d => Math.hypot(x - d.x, y - d.y) < 45);

    if (node) {
        const group = node.group.toLowerCase();
        const searchable = encodeURIComponent(node.name);
        
        console.log(`Unrolling ${node.name} via ${group}`);
        if (navigator.vibrate) navigator.vibrate(20);
        
        traverseGraph(group, searchable);
    }
}
    simulation.alphaTarget(1.337).restart();
}

