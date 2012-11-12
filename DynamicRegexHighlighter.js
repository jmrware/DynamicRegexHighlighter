/* <![CDATA[ */
/* File:        DynamicRegexHighlighter.js
 * Version:     20110421_2300
 * Copyright:   (c) 2010 Jeff Roberson - http://jmrware.com
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Summary: This script provides web page dynamic highlighting of regular
 * expressions enclosed within HTML elements marked up with class="regex"
 * or class="regex_x". ("regex_x is for "x" free spacing mode regexes).
 *
 * Usage:   See example page: DynamicRegexHighlighter.html
 *
 * Global variables:
 * reAutoLoad = true;       // If true, will prepare all elements on document load.
 *
 * Global functions:
 * reHighlightElement()     // Process an element containing a regex.
 * rePutElemContents()      // Write text to element's innerHTML.
 * reGetElemsByKlassNames() // Get child elements having specified classes.
 * reHideHtmlSpecialChars() // Convert "&<>" to &amp;, &lt; and &gt;.
 * reAddLoadEventFirst()    // Add function to head of window.onload chain.
 * reAddLoadEvent()         // Add function to end of window.onload chain.
 * reAddUnloadEvent()       // Add function to end of window.onunload chain.
 */
(function() { // Don't bother with first indentation level of source code.
// Pseudo-static private closure variables:
var re_elems; // Node list of DOM elements having class "regex" or "regex_x".
// Compile and cache non-trivial/frequently used regular expressions:
var re_class = {}; // Regex cache for reGetElemsByKlassNames().
// re_1_cmt: Match character classes, comment groups, HTML tags, and comments.
var re_1_cmt = /([^[(#<\\]+(?:\\[^<][^[(#<\\]*)*|(?:\\[^<][^[(#<\\]*)+)|(\[\^?)(\]?[^[\]\\]*(?:\\[\S\s][^[\]\\]*)*(?:\[(?::\^?\w+:\])?[^[\]\\]*(?:\\[\S\s][^[\]\\]*)*)*)\]((?:<\/?\w+\b[^>]*>)*)((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)|(\((?!\?#))|(\(\?#[^)]*\))|((?:<\/?\w+\b[^>]*>)+)|(#.*)/g;
// re_1_nocmt: Match character classes and comment groups (no comments).
var re_1_nocmt = /([^[(\\]+(?:\\[\S\s][^[(\\]*)*|(?:\\[\S\s][^[(\\]*)+)|(\[\^?)(\]?[^[\]\\]*(?:\\[\S\s][^[\]\\]*)*(?:\[(?::\^?\w+:\])?[^[\]\\]*(?:\\[\S\s][^[\]\\]*)*)*)\]((?:<\/?\w+\b[^>]*>)*)((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)|(\((?!\?#))|(\(\?#[^)]*\))/g;
// re_2: Match inner (non-nested) PCRE syntax regex groups.
var re_2 = /\((\?(?:[:|>=!]|&gt;|&lt;[=!]|<[=!]|P?&lt;\w+&gt;|P?<\w+>|'\w+'|(?=<span[^>]*>&#40;)|\((?:[+\-]?\d+|&lt;\w+&gt;|<\w+>|'\w+'|R&amp;\w+|R&\w+|\w+)\)|(?:R|(?:-?[iJmsUx])+|[+\-]?\d+|&amp;\w+|&\w+|P&gt;\w+|P>\w+|P=\w+)(?=\))))?([^()]*)\)((?:<\/?\w+\b[^>]*>)*)((?:(?:[?*+]|\{\d+(?:,\d*)?\})[+?]?)?)/g;
// re_escapedgroupdelims: Convert escaped group delimiter chars to HTML entities.
var re_escapedgroupdelims = /([^\\]+(?:\\[^()|][^\\]*)*|(?:\\[^()|][^\\]*)+)|\\([()|])/g;
// re_open_html_tag: Match HTML opening tag with at least one attribute.
var re_open_html_tag = /<(\w+\b(?:\s+[\w\-.:]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[\w\-.:]+))?)+\s*\/?)>/g;
// re_over and re_out: Used by reOnmouseover and reOnmouseout event handlers.
var re_over = /\bregex_hl\b/;
var re_out = /\s*\bregex_hl\b/;

// Global variables:
window.reAutoLoad = true; // If true, will prepare all elements on document load.

// Global exported functions:
window.reHighlightElement = function(elem) {
    var cc_cnt = 0;         // [character classes].
    var cmt_cnt = 0;        // # comments.
    var cmtgrp_cnt = 0;     // (?# comment groups).
    var grp_cnt = 0;        // (?: PCRE groups).
    var brgrp_cnt = 0;      // (?|(branch)|(reset)) groups.
    var capgrp_cnt = 0;     // (capture groups).
    var text;               // Element contents string.
    var spans;              // Node list of span elements.
    var span_cnt;           // Count of spans in regex element.
    var span;               // Current DOM span node.
    var title;              // Current node's title attribute.
    var sibs;               // Array of sibling span nodes.
    var sib_cnt;            // Count of sibling span nodes.
    var str;                // Temp string.
    var el;                 // Temp node element.
    var i, j;               // Loop indexes.
    var re_drh_title = /^(?:[cnmbgp]\d+$|[oe]$)/; // Match marked inserted span title.
// Phase 1: - Markup character classes, comments and comment groups
//   and hide any enclosed regex delimiters as HTML entities.
    var callback1 = function(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9) {
        if (m1) { // Group 1: Everything else. (includes HTML tags for nocmt case).
            // Hide any/all escaped "()|" delimiters - convert to HTML entities.
            return m1.replace(re_escapedgroupdelims,
                function(m0, m1, m2) {
                    if (m1) return m1;
                    return {'(': '\\&#40;', ')': '\\&#41;', '|': '\\&#124;'}[m2];
                } );
        }
        if (m2) { // Groups 2,3,4,5: [character class] (delim, contents, HTML, quantifier).
            ++cc_cnt;
            // Let m1 = common return prefix string.
            m1 = '<span title="c' + cc_cnt + '">' + m2 + '<\/span>' + reHideDelims(m3) + '<span title="c' + cc_cnt + '">]';
            if (m4 && m5) { // If there is an HTML tag between "]" and quantifier, wrap each separately.
                return m1 + '<\/span>' + m4 + '<span title="c' + cc_cnt + '">' + m5 + '<\/span>';
            } else if (m4) { // There is an HTML tag but no quantifier. Append it to the end.
                return m1 + '<\/span>' + m4;
            } else { // No HTML tag. Wrap end "]" together with any quantifier.
                return m1 + m5 + '<\/span>';
            }
        }
        if (m6) return m6;  // Group 6: Opening "(" (non comment group).
        if (m7) {           // Group 7: (?# comment group).
            ++cmtgrp_cnt;
            return '<span title="n' + cmtgrp_cnt + '">' + reHideDelims(m7) + '<\/span>';
        }
        if (m8) return m8;  // Group 8: HTML <open> and <\/close> tags.
        if (m9) {           // Group 9: # comment.
            ++cmt_cnt;
            return '<span title="m' + cmt_cnt + '">' + reHideDelims(m9) + '<\/span>';
        }
    };
// Phase 2: - Markup matching parentheses and pipe OR symbols from inside out
//   and hide their regex delimiters as HTML entities.
    var callback2 = function(m0, m1, m2, m3, m4) {
        var gtype;  // "bnn", "gnn", or "pnn".
        if (m1) {   // Non-zero for special group types.
            if (m1 == "?|") {
                brgrp_cnt++;
                gtype = "b" + brgrp_cnt;
            } else {
                grp_cnt++;
                gtype = "g" + grp_cnt;
            }
            m1 = reHideDelims(m1);
        } else {    // Numbered capture group.
            capgrp_cnt++;
            gtype = "p" + capgrp_cnt;
            m1 = "";
        }
        // Markup/hide all ORs (?:between | parentheses).
        m2 = m2.replace(/\|/g, '<span title="' + gtype + '">&#124;<\/span>');
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
    text = elem.innerHTML;
    if (text.length === 0) return elem;
    // Hide any/all "<>()|[]" troublemakers from within HTML opening tags.
    text = text.replace(re_open_html_tag,
        function(m0, m1) {
            return "<" +  m1.replace(/[<>()|[\]]/g,
                function(m0) {return {"<": "&lt;", ">": "&gt;", "(": "&#40;",
                    ")": "&#41;", "|": "&#124;", "[": "&#91;", "]": "&#93;" }[m0];
                } ) + ">";
        } ); // I am beginning to really appreciate the power of Javascript!
    if (/\bregex_x\b/.test(elem.className)) {   // Phase 1.
        text = text.replace(re_1_cmt, callback1);
    } else {
        text = text.replace(re_1_nocmt, callback1);
    }
    while (text.search(re_2) != -1) {   // Phase 2.
        text = text.replace(re_2, callback2);
    }
    // Markup global/outermost | OR alternatives.
    text = text.replace(/\|/g, '<span title="o">&#124;<\/span>');
    // Any parentheses left at this point represent errors.
    text = text.replace(/[()]/g, '<span class="regex_err" title="e">$&<\/span>');
    // Reflow the document with the new markup.
    elem = rePutElemContents(elem, text); // With PRE's, this is a bit tricky.
// Phase 3: Add highlighting mouse event handlers.
    capgrp_cnt = 0; // Reset capture group number.
    brgrp_cnt = 0;  // Reset branch reset group count.
    spans = elem.getElementsByTagName('span');
    span_cnt = spans.length;
    for (i = 0; i < span_cnt; i++) {
        span = spans[i];
        if (!span.sibs && re_drh_title.test(span.title)) {
            sibs = []; // Gather array of all sibling spans.
            title = span.title;
            for (j = 0; j < span_cnt; j++) {
                el = spans[j];
                if (!el.sibs && el.title == title) {
                    sibs.push(el);
                }
            }
            sib_cnt = sibs.length;
            for (j = 0; j < sib_cnt; j++) {
                el = sibs[j]; // Loop through sibling spans.
                el.sibs = sibs; // Store sibs array each node.
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
                for (j = 0; j < sib_cnt; j++) {
                    sibs[j].title = str;
                }
            } else if (title == "e") {
                for (j = 0; j < sib_cnt; j++) {
                    sibs[j].title = "Error: Unbalanced parentheses";
                }
            }
        }
    }
    sibs = null;
    return elem;
};
window.rePutElemContents = function(elem, text) {
	var events = { // Preserve any/all element event handlers.
		'onclick': elem.onclick,
		'ondblclick': elem.ondblclick,
		'onmousedown': elem.onmousedown,
		'onmouseup': elem.onmouseup,
		'onmouseover': elem.onmouseover,
		'onmousemove': elem.onmousemove,
		'onmouseout': elem.onmouseout,
		'onkeypress': elem.onkeypress,
		'onkeydown': elem.onkeydown,
		'onkeyup': elem.onkeyup
	};
    if (navigator.userAgent.indexOf('MSIE') != -1) { // IE.
        // IE does not respect PRE's whitespace when writing innerHTML.
        // We use outerHTML instead, which replaces the old node with
        // a new one (the old one goes to DOM limbo). We find the new
        // one by using a non-empty node ID attribute.
        if (elem.nodeName == 'PRE') {
            var m = elem.outerHTML.match(/^(<PRE[^>]*)>/i);
            var id = elem.id;       // ID value to be restored.
            var idfind = id;        // Non-empty ID for getElementById().
            if (id.length > 0) {    // Case 1: Element has ID.
                elem.outerHTML = m[1] + '>' + text + '<\/PRE>';
            } else {                // Case 2: No ID.
                idfind = "xREx";    // Set non-empty ID so we can find it.
                elem.outerHTML = m[1] + ' id="xREx">' + text + '<\/PRE>';
            }
            elem = document.getElementById(idfind);
            elem.id = id;           // Restore original ID.
        } else {
            elem.innerHTML = text;  // IE non PRE.
        }
    } else { // Not IE.
        // See: http://blog.stevenlevithan.com/archives/faster-than-innerhtml
        var el_new = elem.cloneNode(false);
        el_new.innerHTML = text;
        elem.parentNode.replaceChild(el_new, elem);
        elem = el_new;
        el_new = null;
    }
    // Restore saved event handlers.
	elem.onclick     = events['onclick'];
	elem.ondblclick  = events['ondblclick'];
	elem.onmousedown = events['onmousedown'];
	elem.onmouseup   = events['onmouseup'];
	elem.onmouseover = events['onmouseover'];
	elem.onmousemove = events['onmousemove'];
	elem.onmouseout  = events['onmouseout'];
	elem.onkeypress  = events['onkeypress'];
	elem.onkeydown   = events['onkeydown'];
	elem.onkeyup     = events['onkeyup'];
    return elem;
};
window.reGetElemsByKlassNames = function(base_el /*, class1[, class2[, class3...]] */) {
    var nk = arguments.length - 1; // Count of passed classes.
    if (nk < 1) return null;
    var elems = base_el.getElementsByTagName('*');
    var str = "(?:^|\\s)(?:"; // Assemble regex to find any passed class.
    for (var i = 1; i < nk; i++) str += arguments[i] + "(?:$|\\s)|";
    str += arguments[i] + "(?:$|\\s))"; // Append OR to all but last.
    if (!re_class[str]) re_class[str] = new RegExp(str,"i"); // Cache regexes.
    var re = re_class[str];
    var kl_els = [];
    var n = elems.length;
    for (i = 0; i < n; i++) {
        var el = elems[i];
        if (el.className && re.test(el.className)) {
            kl_els.push(el);
        }
    }
    return kl_els;
};
window.reHideHtmlSpecialChars = function(text) {
    return text.replace(/[&<>]/g,
        function(m0) {return {"&": "&amp;", "<": "&lt;", ">": "&gt;"}[m0];});
};
window.reAddLoadEventFirst = function(newf) {
    if (typeof(window.onload) != 'function') {
        window.onload = newf;
    } else {
        var oldf = window.onload;
        window.onload = function() {
            newf();
            oldf();
        };
    }
};
window.reAddLoadEvent = function(newf) {
    if (typeof(window.onload) != 'function') {
        window.onload = newf;
    } else {
        var oldf = window.onload;
        window.onload = function() {
            oldf();
            newf();
        };
    }
};
window.reAddUnloadEvent = function(newf) {
    if (typeof(window.onunload) != 'function') {
        window.onunload = newf;
    } else {
        var oldf = window.onunload;
        window.onunload = function() {
            oldf();
            newf();
        };
    }
};
// Local support functions:
function reHideDelims(text) {
    return text.replace(/[()|]/g,
        function(m0) {return {"(": "&#40;", ")": "&#41;", "|": "&#124;"}[m0];});
}
function reOnMouseover() { // Add "regex_hl" class to all siblings.
    if (this.sibs) {
        for (var i = 0, n = this.sibs.length; i < n; i++) {
            var el = this.sibs[i];
            if (!el.className) el.className = "regex_hl";
            else if (!re_over.test(el.className)) el.className += " regex_hl";
        }
    }
}
function reOnMouseout() { // Remove "regex_hl" class from all siblings.
    if (this.sibs) {
        for (var i = 0, n = this.sibs.length; i < n; i++) {
            var el = this.sibs[i];
            if (el.className) el.className = el.className.replace(re_out, "");
        }
    }
}
function rePrepareAllMarkup() {
    if (re_elems.length === 0) { // Done? Clear status and exit.
        window.status = "";
        return;
    }
    var start = +new Date();    // For UI responsiveness, limit
    do {                        // consecutive runtime to 50ms.
        reHighlightElement(re_elems.shift());
    } while (re_elems.length > 0 && (+new Date - start < 50));
    setTimeout(rePrepareAllMarkup, 25); // Give up CPU for UI thread.
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
    for (var i = 0, n = re_elems.length; i < n; i++) {
        spans = re_elems[i].getElementsByTagName('span');
        re_elems[i] = null;
        for (var j = 0, m = spans.length; j < m; j++) {
            span = spans[j];
            if (span.sibs) {
                span.sibs = null;
                span.onmouseover = null;
                span.onmouseout = null;
            }
        }
    }
    // Null out pseudo-static private closure variables.
//    re_elems = re_class = re_1_cmt = re_1_nocmt = re_2 = null;
//    re_escapedgroupdelims = re_open_html_tag = re_over = re_out = null;

    // Null out globals.
//    window.reAutoLoad = window.reHighlightElement = window.rePutElemContents = null;
//    window.reGetElemsByKlassNames = window.reHideHtmlSpecialChars = null;
//    window.reAddLoadEventFirst = window.reAddLoadEvent = null;
//    window.reAddUnloadEvent = window.reAutoLoad = null;
}
// Load/unload only if we have needed DOM methods.
if (document.getElementById && document.getElementsByTagName) {
    reAddLoadEvent(reOnload);
    reAddUnloadEvent(reOnunload);
}
})();
/* ]]> */
