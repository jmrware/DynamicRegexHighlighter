/* <![CDATA[ */
/* File:		ColorizeRegexSyntax.js
 * Version:		20100904_2200
 * Copyright:	(c) 2010 Jeff Roberson - http://jmrware.com
 * MIT License:	http://www.opensource.org/licenses/mit-license.php
 *
 * Summary: This script is called by the documentation and tester
 * HTML pages to allow the DynamicRegegHighlighter.js script to
 * work together with Steven Levithan's regex syntax colorizer
 * script. This script calls the highlightJsReSyntax() function
 * within the jsresyntaxhighlighter.js script for all elements
 * on a page having class="regex" to colorize their regex syntax.
 * A sentence is added to the header link paragraph (id="headerlinks")
 * giving credit and a link to Steven's regex highlighter blog page.
 * If there is an element with id="regex_form_submit", then a new
 * form checkbox input is added to allow turning on colorization.
 * Loading order: This must be loaded after jsresyntaxhighlighter.js
 * and DynamicRegexHighlighter.js (both scripts are required).
 *
 * Adapted from: http://stevenlevithan.com/regex/syntaxhighlighter/
 * test page. That and jsresyntaxhighlighter.js covered by MIT License,
 * (c) 2010 Steven Levithan <http://stevenlevithan.com>,

 */
(function() { // Run right now and create no globals.
	function reColorizeAll() {
		var el;			// DOM element node.
		var text;		// String with element Node contents.
		var re_elems = reGetElemsByKlassNames(document, "regex");
		var i;			// Loop index number.
		var len = re_elems.length;
		for (i = 0; i < len; i++) {
			el = re_elems[i];
			// Read plain regex text data from DOM element node.
			text = el.textContent || el.innerText || el.innerHTML;
			// Write marked up, colorized syntax regex data.
			text = highlightJsReSyntax(text);	// See: http://stevenlevithan.com
			el = rePutElemContents(el, text);	// Preserve whitespace in PREs.
		}
		// Let folks know where the colorization code came from.
		el = document.getElementById('headerlinks');
		if (el) { // Append a sentence with a link to end of regex node.
			el.innerHTML += ' Regex colorization provided by: <a title="Steven Levithan\'s Blog" href="http://blog.stevenlevithan.com/archives/regex-syntax-highlighter">Regex Syntax Highlighter</a>.';
		}
		// Add colorizing checkbox option if regex_form_submit element exists.
		el = document.getElementById("regex_form_submit");
		if (el) {
			el.innerHTML = ' Choose <input name="cb_col" id="cb_col" checked="checked" title="Color syntax highlighting only good for (uncommented) Javascript flavor." type="checkbox"> Color syntax highlighting. ' + el.innerHTML;
		}
	}
	// Delay running the above function until after the page is loaded.
	if (document.getElementById &&		// Continue loading only if not a braindead browser and
		window.rePutElemContents &&		// the DynamicRegexHighlighter.js script is loaded and
		window.highlightJsReSyntax) {	// the jsresyntaxhighlighter.js script is also loaded.
		reAddLoadEventFirst(reColorizeAll); // This must run before
	} // DynamicRegexHighlighter's reOnload() initialization function.
})();
/* ]]> */
