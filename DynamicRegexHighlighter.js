/* <![CDATA[ */
/* File:		DynamicRegexHighlighter.js
 * Version:		20100903_1300
 * Copyright:	(c) 2010 Jeff Roberson - http://jmrware.com
 * MIT License:	http://www.opensource.org/licenses/mit-license.php
 *
 * Summary: This script provides web page dynamic highlighting of regular
 * expressions enclosed within HTML elements marked up with class="regex".
 *
 * Usage:	See example page: DynamicRegexHighlighter.html
 */
// Global functions:
var reHighlightElement;		// Process an element containing a regex.
var rePutElemContents;		// Write text to element's innerHTML.
var reGetElemsByKlassNames;	// Get child elements having specified classes.
var reHideHtmlSpecialChars;	// Convert "&<>" to &amp;, &lt; and &gt;.
var reAddLoadEventFirst;	// Add function to head of window.onload chain.
var reAddLoadEvent;			// Add function to end of window.onload chain.
var reAddUnloadEvent;		// Add function to end of window.onunload chain.
// Global variables:
var reAutoLoad = true; // If true, will prepare all elements on document load.
(function () { // Don't bother with first indentation level.
var re_elems; // Node list of elements with class "regex" or "regex_x".
// Global exported functions:
reHighlightElement = function (elem) {
	var cc_cnt = 0;			// [character classes].
	var cmt_cnt = 0;		// # comments.
	var cmtgrp_cnt = 0; 	// (?# comment groups).
	var grp_cnt = 0;		// (?: PCRE groups).
	var brgrp_cnt = 0;		// (?|(branch)|(reset)) groups.
	var capgrp_cnt = 0;		// (capture groups).
	var span;				// Current DOM span node.
	var title;				// Current node's title attribute.
	var sibs;				// Array of sibling span nodes.
	var str;				// Temp string.
	var el;					// Temp node element.
	var i, j;				// Loop indexes.
// Phase 1: - Markup character classes, comments and comment groups
//	 and hide any enclosed regex delimiters as HTML entities.
	var re_1_cmt = /([^[(#<\\]+(?:\\[\S\s][^[(#<\\]*)*|(?:\\[\S\s][^[(#<\\]*)+)|(\[\^?)(\]?[^[\]\\]*(?:\\[\S\s][^[\]\\]*)*(?:\[(?::\^?\w+:\])?[^[\]\\]*(?:\\[\S\s][^[\]\\]*)*)*)\]((?:<\/?\w+\b[^>]*>)*)((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)|(\((?!\?#))|(\(\?#[^)]*\))|((?:<\/?\w+\b[^>]*>)+)|(#.*)/g;
	var re_1_nocmt = /([^[(<\\]+(?:\\[\S\s][^[(<\\]*)*|(?:\\[\S\s][^[(<\\]*)+)|(\[\^?)(\]?[^[\]\\]*(?:\\[\S\s][^[\]\\]*)*(?:\[(?::\^?\w+:\])?[^[\]\\]*(?:\\[\S\s][^[\]\\]*)*)*)\]((?:<\/?\w+\b[^>]*>)*)((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)|(\((?!\?#))|(\(\?#[^)]*\))|((?:<\/?\w+\b[^>]*>)+)/g;
	var callback1 = function(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9) {
		if (m1) { // Group 1: Not char class, comment group, comment or HTML tag(s).
			// Hide any/all escaped "()|" delimiters - convert to HTML entities.
			return m1.replace(/([^\\]+(?:\\[^()|][^\\]*)*|(?:\\[^()|][^\\]*)+)|(\\[()|])/g,
				function (m0, m1, m2) {
					if (m1) return m1;
					return {'\\(': '\\&#40;', '\\)': '\\&#41;', '\\|': '\\&#124;'}[m2];
				} );
		}
		if (m2) { // Groups 2,3,4,5: [character class], contents, HTML tags and quantifier.
			++cc_cnt;
			m3 = reHideDelims(m3);
			if (m4) m4 = reHideDelims(m4);
			// Let m1 = common return prefix string.
			m1 = '<span title="c' + cc_cnt + '">' + m2 + '<\/span>' + m3 + '<span title="c' + cc_cnt + '">]';
			if (m4 && m5) { // If there is an HTML tag between "]" and quantifier, wrap each separately.
				return m1 + '<\/span>' + m4 + '<span title="c' + cc_cnt + '">' + m5 + '<\/span>';
			} else if (m4) { // There is an HTML tag but no quantifier. Append it to the end.
				return m1 + '<\/span>' + m4;
			} else { // No HTML tag. Wrap end "]" together with any quantifier.
				return m1 + m5 + '<\/span>';
			}
		}
		if (m6) return m6;	// Group 6: Opening "(" (non comment group).
		if (m7) {			// Group 7: (?# comment group).
			++cmtgrp_cnt;
			return '<span title="n' + cmtgrp_cnt + '">' + reHideDelims(m7) + '<\/span>';
		}
		if (m8) {			// Group 8: HTML <open> and </close> tags.
			return reHideDelims(m8);
		}
		if (m9) {			// Group 9: # comment.
			++cmt_cnt;
			return '<span title="m' + cmt_cnt + '">' + reHideDelims(m9) + '<\/span>';
		}
		return '';
	};
// Phase 2: - Markup matching parentheses and pipe OR symbols from inside out
//	 and hide their regex delimiters as HTML entities.
	var re_2 = /\((\?(?:[:|>=!]|&gt;|&lt;[=!]|<[=!]|P?&lt;\w+&gt;|P?<\w+>|'\w+'|(?=<span[^>]*>&#40;)|\((?:[+\-]?\d+|&lt;\w+&gt;|<\w+>|'\w+'|R&amp;\w+|R&\w+|\w+)\)|(?:R|(?:-?[iJmsUx])+|[+\-]?\d+|&amp;\w+|&\w+|P&gt;\w+|P>\w+|P=\w+)(?=\))))?([^()]*)\)((?:<\/?\w+\b[^>]*>)*)((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)/g;
	var callback2 = function(m0, m1, m2, m3, m4) {
		var gtype;	// "bnn", "gnn", or "pnn".
		if (m1) {	// Non-zero for special group types.
			if (m1 == "?|") {
				brgrp_cnt++;
				gtype = "b" + brgrp_cnt;
			} else {
				grp_cnt++;
				gtype = "g" + grp_cnt;
			}
			m1 = reHideDelims(m1);
		} else {	// Numbered capture group.
			capgrp_cnt++;
			gtype = "p" + capgrp_cnt;
			m1 = "";
		}
		// Markup/hide all ORs (?:between | parentheses).
		m2 = m2.replace(/\|/g, '<span title="' + gtype + '">&#124;<\/span>');
		if (m3) m3 = reHideDelims(m3);
		// Let m1 = common return prefix string.
		m1 = '<span title="' + gtype + '">&#40;' + m1 + '<\/span>' + m2 + '<span title="' + gtype + '">&#41;';
		if (m3 && m4) { // HTML tag between ")" and quantifier. Wrap each separately.
			return m1 + '<\/span>' + m3 + '<span title="' + gtype + '">' + m4 + '<\/span>';
		} else if (m3) { // HTML tag but no quantifier. Append it to the end.
			return m1 + '<\/span>' + m3;
		} else { // No HTML tag. Wrap end ")" together with any quantifier.
			return m1 + m4 + '<\/span>';
		}
	};
// Process DOM element having class: "regex" or "regex_x".
	var text = elem.innerHTML;
	if (text.length === 0) return elem;
	// Hide all regex delimiters within any HTML opening tag attribute values.
	text = text.replace(/<\w+\b[^>]+>/g, reHideDelims);
	if (/\bregex_x\b/.test(elem.className)) {	// Phase 1.
		text = text.replace(re_1_cmt, callback1);
	} else {
		text = text.replace(re_1_nocmt, callback1);
	}
	while (text.search(re_2) != -1) {	// Phase 2.
		text = text.replace(re_2, callback2);
	}
	// Markup global/outermost | OR alternatives.
	text = text.replace(/\|/g, '<span title="o">&#124;<\/span>');
	// Any parentheses left at this point represent errors.
	text = text.replace(/[()]/g, '<span class="regex_err" title="e">$&<\/span>');
	// Reflow the document with the new markup.
	elem = rePutElemContents(elem, text); // With PRE's, this is a bit tricky.
// Phase 3: Add mouse event highlighting handlers.
	capgrp_cnt = 0;	// Reset capture group number.
	brgrp_cnt = 0;	// Reset branch reset group count.
	var spans = elem.getElementsByTagName('span');
	var span_cnt = spans.length;
	for (i = 0; i < span_cnt; i++) {
		span = spans[i];
		if (!span.sibs && (/^(?:[cnmbgp]\d+|[oe])$/.test(span.title))) {
			sibs = []; // Gather array of all sibling spans.
			title = span.title;
			for (j = 0; j < span_cnt; j++) {
				el = spans[j];
				if (!el.sibs && el.title == title) {
					sibs.push(el);
				}
			}
			for (j = 0; j < sibs.length; j++) { // Loop through sibling spans.
				el = sibs[j];
				el.sibs = sibs;
				el.removeAttribute("title");
				el.onmouseover = reOnMouseover;
				el.onmouseout  = reOnMouseout;
			}
			if (title.charAt(0) == "b") {
				brgrp_cnt++;
			} else if (title.charAt(0) == "p") {
				capgrp_cnt++;
				str = "Capture group";
				// If there are no (?|(branch)(reset)) groups yet, then
				// we know the capture group number. Otherwise we don't.
				if (brgrp_cnt === 0) str += " $" + capgrp_cnt;
				for (j = 0; j < sibs.length; j++) {
					sibs[j].title = str;
				}
			} else if (title == "e") {
				for (j = 0; j < sibs.length; j++) {
					sibs[j].title = "Error: Unbalanced parentheses";
				}
			}
		}
	}
	sibs = null;
	return elem;
};
rePutElemContents = function (elem, text) {
	if (navigator.userAgent.indexOf('MSIE') != -1) { // IE.
		// IE does not respect PRE's whitespace when writing innerHTML.
		// We use outerHTML instead, which replaces the old node with
		// a new one (old one goes to DOM limbo). We find the new one
		// by using a non-empty node ID attribute.
		if (elem.nodeName == 'PRE') {
			var m = elem.outerHTML.match(/^(<PRE[^>]*)>/i);
			var id = elem.id;		// ID value to be restored.
			var idfind = id;		// Non-empty ID for getElementById().
			if (id.length > 0) {	// Case 1: Element has ID.
				elem.outerHTML = m[1] + '>' + text + '<\/PRE>';
			} else { 				// Case 2: No ID.
				idfind = "xREx";	// Set non-empty ID so we can find it.
				elem.outerHTML = m[1] + ' id="xREx">' + text + '<\/PRE>';
			}
			elem = document.getElementById(idfind);
			elem.id = id;			// Restore original ID.
		} else {
			elem.innerHTML = text;	// IE non PRE.
		}
	} else { // Not IE.
		// See: http://blog.stevenlevithan.com/archives/faster-than-innerhtml
		var el_new = elem.cloneNode(false);
		el_new.innerHTML = text;
		elem.parentNode.replaceChild(el_new, elem);
		elem = el_new;
		el_new = null;
	}
	return elem;
};
reGetElemsByKlassNames = function(base_el /*, class1[, class2, ...] */) {
	var nk = arguments.length - 1; // Count of passed classes.
	if (nk < 1) return null;
	var el, kl_els = [];
	var elems = base_el.getElementsByTagName('*');
	var len = elems.length;
	var str = "\\b(?:"; // Assemble regex to find any passed class.
	for (var i = 1; i < nk; i++) str += arguments[i] + "|";
	str += arguments[i] + ")\\b"; // Append OR to all but last.
	var re = RegExp(str, "i");
	for (i = 0; i < len; i++) {
		el = elems[i];
		if (el.className && re.test(el.className)) {
			kl_els.push(el);
		}
	}
	return kl_els;
};
reHideHtmlSpecialChars = function(text) {
	return text.replace(/[&<>]/g,
		function (m0) {return {"&": "&amp;", "<": "&lt;", ">": "&gt;"}[m0];});
};
reAddLoadEventFirst = function(newf) {
	if (typeof(window.onload) != 'function') {
		window.onload = newf;
	} else {
		var oldf = window.onload;
		window.onload = function () {
			newf();
			oldf();
		};
	}
};
reAddLoadEvent = function(newf) {
	if (typeof(window.onload) != 'function') {
		window.onload = newf;
	} else {
		var oldf = window.onload;
		window.onload = function () {
			oldf();
			newf();
		};
	}
};
reAddUnloadEvent = function(newf) {
	if (typeof(window.onunload) != 'function') {
		window.onunload = newf;
	} else {
		var oldf = window.onunload;
		window.onunload = function () {
			oldf();
			newf();
		};
	}
};
// Local support functions:
function reHideDelims(text) {
	return text.replace(/[()|[\]]/g,
		function (m0) {return {
			"(": "&#40;",
			")": "&#41;",
			"|": "&#124;",
			"[": "&#91;",
			"]": "&#93;" }[m0];
		});
}
function reOnMouseover() { // Add "regex_hl" class to all siblings.
	for (var i = 0; i < this.sibs.length; i++) {
		if (!this.sibs[i].className) {
			this.sibs[i].className = "regex_hl";
		} else if (!(/\bregex_hl\b/.test(this.sibs[i].className))) {
			this.sibs[i].className += " regex_hl";
		}
	}
}
function reOnMouseout() { // Remove "regex_hl" class from all siblings.
	for (var i = 0; i < this.sibs.length; i++) {
		if (this.sibs[i].className) {
			this.sibs[i].className = this.sibs[i].className.replace(/\s*\bregex_hl\b/, "");
		}
	}
}
function rePrepareAllMarkup() {
	for (var i = 0; i < re_elems.length; i++) {
		reHighlightElement(re_elems[i]);
		re_elems[i] = null;
	}
	window.status = "";
	re_elems = null;
}
function reOnload() {
	if (!reAutoLoad) return; // No autoload? Exit now.
	re_elems = reGetElemsByKlassNames(document, 'regex', 'regex_x');
	if (re_elems.length > 0) {
		window.status = "Marking up " + re_elems.length + " regex elements...";
		setTimeout(rePrepareAllMarkup, 0);
	}
}
function reOnunload() {
	// Remove references to avoid IE memory leaks.
	re_elems = reGetElemsByKlassNames(document, 'regex', 'regex_x');
	var spans, span;
	for (var i = 0; i < re_elems.length; i++) {
		spans = re_elems[i].getElementsByTagName('span');
		for (var j = 0; j < spans.length; j++) {
			span = spans[j];
			if (span.sibs) span.sibs = null;
			span.onmouseover = null;
			span.onmouseout = null;
		}
	}
	re_elems = null;
}
// Load/unload only if we have needed DOM methods.
if (document.getElementById && document.getElementsByTagName) {
	reAddLoadEvent(reOnload);
	reAddUnloadEvent(reOnunload);
}
})();
/* ]]> */
