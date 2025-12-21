$(document).ready(function(){
	ANCHOR._hide_partial();

	//routes the path on load

	/*$(".ANCHOR").click(function(e){
		e.preventDefault();

		ANCHOR.route("#" + this._anchorPath($(this)) + this._anchorParams($(this)))
	})*/
	$(document).on("click", ".ANCHOR", function(e){
		e.preventDefault();
		ANCHOR.route("#" + ANCHOR._anchor_path($(this)) + ANCHOR._anchor_params($(this)))
	})
})


window.addEventListener('popstate', function(event){

	var origin = event.state;

	//route(path);
	if(origin !== null){	
		var link = ANCHOR._get_link(origin);
		ANCHOR._hide_partial();
		//router(link.path, link.params);	
		ANCHOR._show_div(link.path);

		//TODO : shouldn't this use ANCHORED route?
		$(document).trigger("ANCHOR");
	}									
})

var ANCHOR = {
	load : function(){
		var that = this;
		ANCHOR._hide_partial();
		this.route(window.location.hash + window.location.search)

		//routes the path on load

		$(".ANCHOR").click(function(e){
			e.preventDefault();

			that.route("#" + that._anchor_path($(this)) + that._anchor_params($(this)))
		})
	}
	,
	buffer : function(){
		var that = this;
		$(".ANCHOR").off("click");
		$(document).off("click", ".ANCHOR")
		$(document).on("click", ".ANCHOR", function(e){
			e.preventDefault();
			ANCHOR.route("#" + that._anchor_path($(this)) + that._anchor_params($(this)))
		})
	}
	,
	page : function(){
		return this._get_link(window.location.hash).path
	}
	,
	count : 0
	,
	route : function(origin){		
		this._hide_partial();
		if(origin === "#undefined"){
			origin = "#"
		}
		var link = this._get_link(window.location.pathname + origin);			
		history.pushState(origin, '', origin)
		$(document).trigger("ANCHOR");
		this.count++
		this._show_div(link.path);
	}
	,
	/*setParams : function(param,value){
		var url = window.location.href;
		var hash = url.indexOf('#');
		if(hash==-1)hash=url.length;
		var partOne = url.substring(0,hash);
		var partTwo = url.substring(hash,url.length);
		var newURL = partOne+'&'+param+'='+value+partTwo
		return window.location.replace(newURL);
	}*/
	setParams : function(param,value){
		if (history.pushState) {
		    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash + (!ANCHOR.getParams() ? 
		    '?' : "&") + param + "=" + value;
		    window.history.pushState({path:newurl},'',newurl);
		}
	}
	,
	removeParams : function(param){
		var url = window.location.href;
		const params = new URLSearchParams(window.location.hash.split("?")[1]);
		params.delete(param)
		
		window.history.replaceState(null, '', window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash.split("?")[0] 
			+ (params.length > 0 ? "?" : "") + params);

	}
	,
	getParams : function(){
		  var search = window.location.hash.split("?")[1]
		  if(!search){
		  	return undefined;
		  }
		  if(search){
		  	  if(search.indexOf('?') > -1){
			    search = search.split('?')[1];
			  }
			  var pairs = search.split('&');
			  var result = {};
			  pairs.forEach(function(pair) {
			    pair = pair.split('=');
			    result[pair[0]] = decodeURIComponent(pair[1] || '');
			  });
			  return result;
		  }
	}
	,
	getParamsString : function(name, url = window.location.href) {
	    return window.location.hash.split("?")[1]

	}
	,
	_hyperlink:  function(hyperlink){
		window.location.replace(hyperlink);
	}
	,
	_get_link : function(origin){		
		var params = origin.split("?")
		var path = params[0].split("#");
		return {
			path : path[1],
			params : params
		}
	}
	,
	_get_href : function(){
		return window.location.href;
	}
	,
	_show_div : function(path){
		if(!path){
			path = this._default;
		}
		$("div." + path).fadeIn(777);;
	}
	,
	_anchor_path : function(href){
		return href.attr("class").split(/\s+/)[1];
	}
	,
	_anchor_params(a){
		return a.attr("href").split('?')[1] ? "?" + a.attr("href").split('?')[1] : "";
	}
	,
	_hide_partial : function(){
		$(".ANCHOR_partial").fadeOut(222);
	},
	setDefault : function(page){
		this._default = page;
	},
	_default : ""
}
