/**
 * THE TEMPLAR LOG: A fusion of maritime discipline and existential clarity.
 * We resolve to make the code sail by ensuring its properties are 'Ready-to-hand'.
 */

// SMEE: This here listener is the lookout! 
// If it ain't lookin' for the trigger, the ship won't move!
$(document).on("TEMPLAR", function() {
    let page = TEMPLAR.pageREC();
    TEMPLAR.render(page);
});

var TEMPLAR = { 
    _dir: "client/partials",
    _fade: true,
    _helm: [],
    _page : "home",
    _pages : [],
    _default: "home", 

    count: 0, // We disclose the count so it may exist!
    initialize: function(options = {}, cb) {
        const {
            helm = [],
            defaultPage = "home",
            dir = "client/partials",
            fade = false,
            pages = []
        } = options;

        this._helm = helm;
        this._dir = dir;
        this._fade = fade;
        this._pages = pages;
        this._default = defaultPage;

        var that = this;

        $.get("../" + this._dir + "/header.html", function(data) {
            $("header").html(data);

            // 1. POPSTATE: The ship's response to the 'Back' and 'Forward' currents.
            window.addEventListener('popstate', (event) => {
                // We render directly from the URL truth without re-triggering 'route'
                const target = that.pageREC();
                $(document).trigger("TEMPLAR");
                that.render(target); 
            });

            // 2. INITIAL HORIZON
            var currentHash = window.location.hash.split('?')[0].substring(1);
            var startingPage = currentHash || that._default;

            $(document).trigger("TEMPLAR")
            that.DOM();
            if (cb) cb();
        });
    },

    route: function(origin) {
        // PRECISE INSTRUCTION: Update the History Hold first.
        // The origin should be a full hash string, e.g., "#home?id=1"
        history.pushState({ path: origin }, '', origin);

        // Instead of triggering an event that might loop, we call the Lookout directly.
        // This ensures the signal only travels one way.
        const page = this._link_rec(origin).path;
        //this.render(page);
        $(document).trigger("TEMPLAR");
    },
    render: function(page) {
        var that = this;
        if (!page) page = this._default;
        var fileTarget = page + ".html";

        this._pages.forEach(p => $("div." + p).hide());

        $.get(this._dir + "/" + fileTarget, function(data) {
            // 1. Write to the DOM
            $("div." + page).html(data);
            
            // 2. The Asynchronous Breath:
            // requestAnimationFrame ensures the browser has rendered the HTML
            // before we start the 'helm' rituals which may trigger heavy reflows.
            requestAnimationFrame(() => {
                that._visible_page(page);
                // Use a slight delay if DataTables is still complaining
                setTimeout(() => {
                    that.helm(page);
                }, 0);
            });
           
        });
    }
    ,
    helm: function(targetPage) {
        this.currentPage = targetPage; 

        this._helm.forEach((item) => {
            if (item.page === targetPage) {
                item.fn(targetPage);                
            }
        });
    }
    ,
    DOM: function() {
        var that = this;
        
        // GUARD: Only bind the lookout once!
        if (this._isBound) return; 

        $(document).off("click", "a.TEMPLAR").on("click", "a.TEMPLAR", function(e) {
            const $target = $(this);
            const href = $target.attr("href");

            
            // GHOST FILTER: Don't route if there's no map!
            if (!href || href === "#" || href.includes("undefined")) return;

            e.preventDefault();
            e.stopImmediatePropagation(); 

            var path = that._path($target);
            var params = that._params($target);
            
            if (path) {
                that.route("#" + path + params);
            }
        });

        this._isBound = true; 
    },

    pageREC: function() {
        return this._link_rec(window.location.hash).path;
    },
    
    pageSet : function(page){
        this._page = page;
    }
    ,

   /* --- paramRemove: THE RITUAL OF PURGING THE THROWN ---
   We take a key, we find its existence in the hash-horizon, 
   and we cast it into the abyss so that it may no longer 
   burden the 'Being-in-the-URL'! */
    paramRem: function(param) {
        // 1. We disclose the horizon by splitting the path from the search-silt
        const parts = window.location.hash.split("?");
        const pathPart = parts[0];       // e.g., "#torrents"
        const searchPart = parts[1] || ""; // e.g., "id=123&type=source"

        // 2. We employ the 'Equipment' of the browser to hunt the specific key
        const params = new URLSearchParams(searchPart);
        
        // SMEE: If the key exists, we keelhaul it! 
        params.delete(param);

        // 3. We reconstruct the 'Truth' of the new hash
        const newQuery = params.toString();
        const newHash = pathPart + (newQuery ? "?" + newQuery : "");

        // 4. THE REPLACEMENT: We overwrite the history-hold without 
        // triggering a 'Popstate' storm that would capsize the engine!
        window.history.replaceState(
            null, 
            '', 
            window.location.protocol + "//" + 
            window.location.host + 
            window.location.pathname + 
            newHash
        );
        
        // HEIDEGGER: The URL has been 'Cleared'. The Nothing now stands 
        // where the Parameter once resided.
    },
    /* --- sParams: THE BUNDLED INSCRIPTION --- 
   To prevent the History-Stack from splintering into redundant moments,
   we update multiple Truths before the final Inscription. */
    paramSET: function(kvPairs, createNewEntry = false) {
        const parts = window.location.hash.split("?");
        const pathPart = parts[0] || "#";
        const searchPart = parts[1] || "";
        const params = new URLSearchParams(searchPart);

        // Batch update the Equipment
        for (const [key, value] of Object.entries(kvPairs)) {
            params.set(key, value);
        }

        const newHash = pathPart + "?" + params.toString();
        const newUrl = window.location.origin + window.location.pathname + newHash;

        if (createNewEntry) {
            window.history.pushState({ path: newUrl }, '', newUrl);
        } else {
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
    },
    /* paramREC, paramRemove, sParams maintained in their original 'Thrown-ness' */
    paramREC: function() {
        var search = window.location.hash.split("?")[1];
        if (!search) return undefined;
        var pairs = search.split('&');
        var result = {};
        pairs.forEach(function(pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });
        return result;
    },

    _link_rec: function(origin) {        
        var parts = origin.split("?");
        var pathPart = parts[0].split("#");
        return {
            path: pathPart[1] || "",
            params: parts[1] || ""
        };
    },

    _visible_page: function(path) {
        if (!path) path = this._default;
        var target = $("div." + path);
        // HEIDEGGER: The Fade is but a gradual un-concealment of Truth.
        this._fade ? target.fadeIn() : target.show();
    },

    _invisible_page: function(page) {
        $(".TEMPLAR div." + page).hide();
    },

    _show_div: function(path) {
        this._visible_page(path);
    },

    _path: function(el) {
        const href = el.attr("href") || "";
        // We strip the hash, then take the part before the question mark.
        const content = href.startsWith('#') ? href.substring(1) : href;
        return content.split('?')[0];
    },

    _params: function(el) {
        const href = el.attr("href") || "";
        const parts = href.split('?');
        return parts.length > 1 ? "?" + parts[1] : "";
    }
};