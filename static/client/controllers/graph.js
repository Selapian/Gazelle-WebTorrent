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
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Source" : "Source", name: decodeEntities(decodeEntities(field.properties.name)), count: 1, color : "white" });
                } else if (field.labels[0] === "Author") {

                    let isMatch = TEMPLAR.paramREC()?.author && TEMPLAR.paramREC().author.toLowerCase().includes(field.properties.searchable.toLowerCase());
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Author" : "Author", name: decodeEntities(decodeEntities(field.properties.name)), count: 1, color: "gold" });
                } else if (field.labels[0] === "Class") {
                    let isMatch = classes2.includes(field.properties.name.toLowerCase().replace(/\s/g, ''));
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Class" : "Class", name: decodeEntities(field.properties.name), count: 1, color: "#50C777" });
                } else if (field.labels[0] === "Publisher") {
                    let isMatch = publishers.some(t => field.properties.name.includes(t));
                    Obelisk.nodes.push({ id: field.properties.uuid, group: isMatch ? "Find Publisher" : "Publisher", name: toTitleCase(decodeEntities(decodeEntities(field.properties.name))), count: 1, color: "mediumvioletred" });
                }
            }
        });
    });

 
data.gData.forEach(function(record) {

    // Record structure based on your current backend RETURN:

    // s, a, c, p, s2, a2, c2, p2

    var s1 = record._fields[0], a1 = record._fields[1], c1 = record._fields[2], p1 = record._fields[3];

    var s2 = record._fields[4], a2 = record._fields[5], c2 = record._fields[6], p2 = record._fields[7];



    const isGoldLink = (n1, n2) => {

        const findLabels = ["Find Source", "Find Author", "Find Class", "Find Publisher"];

        const node1 = Obelisk.nodes.find(n => n.id === n1.properties.uuid);

        const node2 = Obelisk.nodes.find(n => n.id === n2.properties.uuid);

        return (node1 && findLabels.includes(node1.group)) || (node2 && findLabels.includes(node2.group));

    };

    

    const addSafeLink = (nodeA, nodeB) => {

        if (!nodeA || !nodeB || !nodeA.properties || !nodeB.properties) return;

        let idA = nodeA.properties.uuid, idB = nodeB.properties.uuid;

        if (!Obelisk.links.some(l => (l.source === idA && l.target === idB) || (l.source === idB && l.target === idA))) {

            Obelisk.links.push({ source: idA, target: idB, isGold: isGoldLink(nodeA, nodeB) });

        }

    };



    // Link Seed Node (s1) to its metadata

    addSafeLink(a1, s1);

    addSafeLink(s1, c1);

    addSafeLink(s1, p1);



    // Link Neighbor Node (s2) to its metadata

    addSafeLink(a2, s2);

    addSafeLink(s2, c2);

    addSafeLink(s2, p2);



    // CRITICAL: Link the Seed (s1) to the Neighbor (s2) through the bridge metadata

    // This is what prevents the "disconnected islands" effect

    if (a1 && a2 && a1.properties.uuid === a2.properties.uuid) addSafeLink(a1, s2);

    if (c1 && c2 && c1.properties.uuid === c2.properties.uuid) addSafeLink(c1, s2);

    if (p1 && p2 && p1.properties.uuid === p2.properties.uuid) addSafeLink(p1, s2);

});
    graphRenderVR(".graph_search");
}

// 1. Initialize variables
let isShiftPressed = false;
let isCtrlPressed = false;

// 2. Updated onNodeClick logic
function graphRenderVR(selector) {

    const container = document.querySelector(selector);
    if (!container) return;
    assertScrollPause();

    const Graph = ForceGraphVR()(container)
    .width(container.clientWidth)
    .height(500)
    .graphData({ nodes: Obelisk.nodes, links: Obelisk.links })
    
    // --- Node Styling ---
    .nodeRelSize(7)               // Visual size
    .nodeColor(d => d.color)

    .nodeThreeObject(node => {
      // Create a group to hold both the visible node and a "ghost" hitbox
      const group = new THREE.Group();

      // 1. The Visible Node
      const visibleMesh = new THREE.Mesh(
        new THREE.SphereGeometry(7), 
        new THREE.MeshLambertMaterial({ color: node.color })
      );
      group.add(visibleMesh);

      // 2. The Invisible Hitbox (Make this large enough to poke through the links)
      const hitbox = new THREE.Mesh(
        new THREE.SphereGeometry(19), // 12 is much larger than the link width
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      group.add(hitbox);

      return group;
    })
    // --- Link Styling ---
    .linkColor(d => d.isGold ? "cyan" : '#555') // Static value is faster than a function check
    .linkWidth(1.7)
    .nodeLabel(node => node.name)
    .onNodeClick((node) => {
        const group = node.group.toLowerCase();
        
        handleNormalClick(node);
        
    })
  Graph.d3Force('charge').strength(-333)
  Graph.d3Force('link').distance(d => d.isGold ? 110 : 35)
  Graph.d3Force('center').strength(0.07);
    // ... (Arrows prevention and VR/Mobile logic
  setupMobileFullscreen(Graph);
}
function handleNormalClick(clickedNode){
    if (clickedNode) {
        const d = clickedNode;
        const routeMap = { "Source": "source", "Author": "author", "Class": "class", "Publisher": "publisher", "Find Source" : "source", "Find Author" : "author", "Find Class" : "class", "Find Publisher" : "publisher" };
        const label = routeMap[d.group] || d.group.toLowerCase();
        TEMPLAR.route(`#node?label=${label}&uuid=${d.id}`);        
    }
}
function setupMobileFullscreen(Graph) {
    const container = document.querySelector(".graph_search");
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouch && TEMPLAR.paramREC() && TEMPLAR.paramREC().search) {
        $("#mobile_fullscreen").show();
        $("#mobile_fullscreen").off("click").on("click", () => { // Use .off to prevent duplicate listeners
            const canvasContainer = document.querySelector('.graph_search'); 
            
            if (!document.fullscreenElement) {
                // Request fullscreen on the CONTAINER, not just the canvas
                const requestMethod = canvasContainer.requestFullscreen || canvasContainer.webkitRequestFullscreen;
                if (requestMethod) {
                    requestMethod.call(canvasContainer);
                }
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });

        // This listener is key: it fires when entering OR exiting
        window.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                // Set to current screen dimensions
                Graph.width(window.innerWidth);
                Graph.height(window.innerHeight);
            } else {
                // Reset to your original non-fullscreen size (e.g., 500px)
                Graph.width(container.clientWidth);
                Graph.height(500); 
            }
        });
    } else {
        $("#mobile_fullscreen").hide();
    }
}

// Update your initializeGraph to call the VR version
function initializeGraph() {
    if ($("#graph-container").children().length > 0) return;
    if(TEMPLAR.pageREC() === "torrents" && TEMPLAR.paramREC()?.search){
        $.post("/graph_search", TEMPLAR.paramREC(), function(data){
            // Prepare Obelisk.nodes/links exactly as you do now
            graph(data); 
            // Then render the VR version
            graphRenderVR("#graph-container");
        });
    }
}