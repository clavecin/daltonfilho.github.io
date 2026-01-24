jQuery(document).ready(function() {	
	$(".pre-title[collapsible=true]").append('<a href="#">Show</a>').attr("collapsed", true);
	$(".pre-title[collapsible=true] + *").hide();
	$(".pre-title[collapsible=true] a").click(
		function(event) {
			event.preventDefault();	
			var $this = $(this);
			var $parent = $this.parent();
			var collapsed = $parent.attr("collapsed") == "true";
			
			if (collapsed) {
				$this.text("Hide");
				$parent.next().show().removeAttr("style");
			} else {
				$this.text("Show");	
				$parent.next().hide();
			}
			
			$parent.attr("collapsed", !collapsed);	
		}
	);
	
	$("pre.urlparams").before('<p class="urlparams-links"><a target="_blank">Open URL</a></p>');
	$(".urlparams-links a").each(function() {
		var link = $(this);
		var url = link.parent().next().text().replace(/(\r\n|\n|\r|\s)/gm,"");
		link.attr("href", url);
	});
	
	hljs.initHighlightingOnLoad();
});