/* File:        README for DynamicRegexHighlighter.js
 * Version:     20100904_1700
 * Copyright:   (c) 2010 Jeff Roberson - http://jmrware.com
 * MIT License: see: http://www.opensource.org/licenses/mit-license.php
 */

Summary:  This script provides web page dynamic highlighting of regular
expressions enclosed within HTML elements marked up with class="regex".
It can be used together with Steven Levithan's color syntax highlighter
available from: http://stevenlevithan.com/regex/syntaxhighlighter/.

Documentation:       DynamicRegexHighlighter.html
Interactive Tester:  DynamicRegexHighlighterTester.html

File Descriptions:
--------------------------
DynamicRegexHighlighter.js
--------------------------
This is the main stand alone script which provides dynamic regex highlighting.
It does not require any of the other files in this project. To use this
script, please refer to the DynamicRegexHighlighter.html documentation page.

-----------------------------
 DynamicRegexHighlighter.html
-----------------------------
This webpage provides documentation for the DynamicRegexHighlighter.js script.
Script usage is described and all of the regexes from the script are presented
in fully commented, free-spacing, (and dynamically highlightable!) format.
It can optionally work with the jsresyntaxhighlighter.js colorizer script.

-----------------------------------
 DynamicRegexHighlighterTester.html
-----------------------------------
This webpage provides an interactive interface allowing the user to enter
any regular expression and then dynamically inspect its various components.
It can optionally work with the jsresyntaxhighlighter.js colorizer script.

----------------------------
 DynamicRegexHighlighter.rbl
----------------------------
This is a RegexBuddy library file containing all of the non-trivial
regular expressions used by the script. This tool was used extensively
during development. Highly recommended. See: http://www.regexbuddy.com/.

-----------------------
 ColorizeRegexSyntax.js
-----------------------
This is a helper script optionally used by DynamicRegexHighlighter.html
and DynamicRegexHighlighterTester.html to allow integration with Steven
Levithan's jsresyntaxhighlighter.js colorization script. See the HTML
source files for details on how to enable the colorization option.

------------------------------------------------------
jsresyntaxhighlighter.css and jsresyntaxhighlighter.js
------------------------------------------------------
These are Steven Levithan's Javascript regex highlighter files and are
*not* included in this project. However, they can be added to provide
color syntax highlighting to the documentation and tester web pages.
Get them here: http://stevenlevithan.com/regex/syntaxhighlighter/.
