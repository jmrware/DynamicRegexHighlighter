/* <![CDATA[ */
/* File:		DynamicRegexHighlighter.js
 * Version:		20100831_1800
 * Copyright:	(c) 2010 Jeff Roberson - http://jmrware.com
 * MIT License:	http://www.opensource.org/licenses/mit-license.php
 *
 * Summary: This script provides web page dynamic highlighting of regular
 * expressions enclosed within HTML elements marked up with class="regex".
 *
 * Usage:	See example page: DynamicRegexHighlighter.html
 */
// Exported global functions:
var reAddLoadEvent;
var reGetElemsByKlassName;
var reHighlightElement;
var reHideHtmlSpecialChars;
var rePutElemContents;
(function () {
	var re_elems; // Pseudo-global node list of all elements with class="regex".
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
// Phase 1: - Mark character classes, comments and comment groups
//	 and hide their parentheses and pipe symbols as HTML entities.
	var re_1_cmt = /([^[(#\\]+(?:\\[\S\s][^[(#\\]*)*|(?:\\[\S\s][^[(#\\]*)+)|(\[\^?)(\]?[^\][\\]*(?:\\[\S\s][^\][\\]*)*(?:\[(?::\^?\w+:\])?[^\][\\]*(?:\\[\S\s][^\][\\]*)*)*)\]((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)|(\((?!\?#))|(\(\?#[^)]*\))|(#.*)/g;
	var re_1_nocmt = /([^[(\\]+(?:\\[\S\s][^[(\\]*)*|(?:\\[\S\s][^[(\\]*)+)|(\[\^?)(\]?[^\][\\]*(?:\\[\S\s][^\][\\]*)*(?:\[(?::\^?\w+:\])?[^\][\\]*(?:\\[\S\s][^\][\\]*)*)*)\]((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)|(\((?!\?#))|(\(\?#[^)]*\))/g;
	var callback1 = function(m0, m1, m2, m3, m4, m5, m6, m7) {
		if (m1) { // Group 1: Everything other than char classes, comments and comment groups.
			return m1.replace(/([^\\]+(?:\\[^()|][^\\]*)*|(?:\\[^()|][^\\]*)+)|(\\\()|(\\\))|(\\\|)/g,
				function (m0, m1, m2, m3, m4) {
					if (m1) return m1;
					if (m2) return '\\&#40;';
					if (m3) return '\\&#41;';
					if (m4) return '\\&#124;';
				} );
		}
		if (m2) { // Groups 2,3,4: [character class], contents and quantifier.
			++cc_cnt;
			m3 = reHideGroupDelims(m3);
			return '<span title="c' + cc_cnt + '">' + m2 + '<\/span>' + m3 + '<span title="c' + cc_cnt + '">]' + m4 + '<\/span>';
		}
		if (m5) return m5;	// Group 5: Opening "(" (non comment group).
		if (m6) {			// Group 6: (?# comment group).
			++cmtgrp_cnt;
			m6 = reHideGroupDelims(m6);
			return '<span title="n' + cmtgrp_cnt + '">' + m6 + '<\/span>';
		}
		if (m7) {			// Group 7: # comment.
			++cmt_cnt;
			m7 = reHideGroupDelims(m7);
			return '<span title="m' + cmt_cnt + '">' + m7 + '<\/span>';
		}
		return '';
	};
// Phase 2: - Mark matching parentheses and pipe OR symbols from inside out
//	 and hide their parentheses and pipe symbols as HTML entities.
	var re_2 = /\((\?(?:[:|>=!]|&gt;|&lt;[=!]|<[=!]|P?&lt;\w+&gt;|P?<\w+>|'\w+'|(?=<span[^>]*>&#40;)|\((?:[+\-]?\d+|&lt;\w+&gt;|<\w+>|'\w+'|R&amp;\w+|R&\w+|\w+)\)|(?:R|(?:-?[iJmsUx])+|[+\-]?\d+|&amp;\w+|&\w+|P&gt;\w+|P>\w+|P=\w+)(?=\))))?([^()]*)\)((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)/g;
	var callback2 = function(m0, m1, m2, m3) {
		var gtype;	// "bnn", "gnn", or "pnn".
		if (m1) {	// Non-zero for special group types.
			if (m1 == "?|") {
				brgrp_cnt++;
				gtype = "b" + brgrp_cnt;
			} else {
				grp_cnt++;
				gtype = "g" + grp_cnt;
			}
			m1 = reHideGroupDelims(m1);
		} else {	// Numbered capture group.
			capgrp_cnt++;
			gtype = "p" + capgrp_cnt;
			m1 = "";
		}
		str = '<span title="' + gtype + '">&#124;<\/span>';
		m2 = m2.replace(/\|/g, str); // Mark & hide ORs (between | parentheses).
		return '<span title="' + gtype + '">&#40;' + m1 + '<\/span>' + m2 + '<span title="' + gtype + '">&#41;' + m3 + '<\/span>';
	};
// Process DOM element having class: "regex" (and optionally "re_x").
	var text = elem.innerHTML;
	if (text.length === 0) return;
	if (/<\w+\b[^>]*>/.test(text)) return;	// Already processed? Exit.
	if (/\bre_x\b/.test(elem.className)) {	// Phase 1.
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
	text = text.replace(/([()])/g, '<span class="regex_err" title="e">$1<\/span>');
	// Reflow the document with the new markup.
	elem = rePutElemContents(elem, text); // This is a bit tricky.
// Phase 3: add mouse event highlighting handlers.
	capgrp_cnt = 0;	// Reset capture group number.
	brgrp_cnt = 0;	// Reset branch reset group count.
	var spans = elem.getElementsByTagName('span');
	var span_cnt = spans.length;
	for (var i = 0; i < span_cnt; i++) {
		span = spans[i];
		if (!span.sibs) {
			sibs = []; // Gather array of all sibling spans.
			title = span.title;
			for (var j = 0; j < span_cnt; j++) {
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
};
function reHideGroupDelims(text) {
	return text.replace(/\(/g, '&#40;').replace(/\)/g, '&#41;').replace(/\|/g, '&#124;');
}
rePutElemContents = function (elem, text) {
	if (navigator.userAgent.indexOf('MSIE') != -1) { // IE.
		// IE does not respect PRE's whitespace when using innerHTML.
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
			this.sibs[i].className = this.sibs[i].className.replace(/\bregex_hl\b/, "");
		}
	}
}
function reGetElemsByKlassName(base_el, kl) {
	var el, kl_els = [];
	var elems = base_el.getElementsByTagName('*');
	var len = elems.length;
	var re = RegExp("\\b" + kl + "\\b", "i");
	for (var i = 0; i < len; i++) {
		el = elems[i];
		if (el.className && re.test(el.className)) {
			kl_els.push(el);
		}
	}
	return kl_els;
}
function rePrepareAllMarkup() {
	// Process all elements having class: "regex".
	for (var i = 0; i < re_elems.length; i++) {
		reHighlightElement(re_elems[i]);
		re_elems[i] = null;
	}
	window.status = "";
}
reHideHtmlSpecialChars = function(text) {
	return text.replace(/&/g,'&amp;').replace(/[<]/g,'&lt;').replace(/>/g,'&gt;');
};
function reOnload() {
	re_elems = reGetElemsByKlassName(document, 'regex');
	if (re_elems.length > 0) {
		window.status = "Marking up " + re_elems.length + " regex elements...";
		reAddUnloadEvent(reOnunload);
		setTimeout(rePrepareAllMarkup, 0);
	}
}
function reOnunload() {
	// Remove references to avoid IE memory leaks.
	re_elems = reGetElemsByKlassName(document, 'regex');
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
reAddLoadEvent = function (newf) {
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
function reAddUnloadEvent (newf) {
	if (typeof(window.onunload) != 'function') {
		window.onunload = newf;
	} else {
		var oldf = window.onunload;
		window.onunload = function () {
			oldf();
			newf();
		};
	}
}
// Load/unload only if we have needed DOM methods.
if (document.getElementById && document.getElementsByTagName) {
	reAddLoadEvent(reOnload);
}
})();
/* ]]> */
