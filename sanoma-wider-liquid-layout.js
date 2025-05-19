// ==UserScript==
// @name        Sanoma Libro Liquido Wider Text Layout
// @namespace   http://tampermonkey.net/
// @match       https://libroliquido-player.sanoma.it/*
// @grant       none
// @version     1.0
// @author      chicco-carone
// @description Adjusts the layout of Sanoma Libro Liquido pages to make the main text area wider with increased padding.
// ==/UserScript==

(function() {
    'use strict';

    // Wait for the page to load sufficiently, or for the main content to be available
    // This is a common strategy for dynamic pages. Adjust delay if needed.
    setTimeout(function() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'widen-text-layout-tampermonkey'; // Unique ID for Tampermonkey script

        // CSS rules to override the default layout and make the text wider
        style.textContent = `
            /* Target main content wrappers that add margins/borders */
            .reader-page-body .content,
            .reader-page-body .padding {
                margin-left: 0 !important;
                margin-right: 0 !important;
                border-left: none !important; /* Remove the large left border */
                box-shadow: none !important; /* Remove potential box shadows */
                padding-left: 100px !important; /* Increased padding on left */
                padding-right: 100px !important; /* Increased padding on right */
                width: auto !important; /* Allow element to take available width */
                max-width: none !important; /* Remove max-width constraints */
                left: auto !important; /* Reset absolute positioning properties */
                right: auto !important;
            }

            /* Special handling for cover content which uses absolute positioning */
            .reader-page-body .cover .content {
                 left: 100px !important; /* Match increased padding on left */
                 right: 100px !important; /* Match increased padding on right */
                 margin-left: 0 !important;
                 margin-right: 0 !important;
                 width: auto !important; /* Allow it to take the calculated width */
            }

            /* Ensure images, tables, and other inner elements also expand */
            .reader-page-body .image,
            .reader-page-body .image-small,
            .reader-page-body .image-extrasmall,
            .reader-page-body .table,
            .reader-page-body .table-noborder {
                width: 100% !important; /* Make them fill the available width */
                max-width: 100% !important;
                 /* Ensure they are centered if they don't fill 100% (though width:100% overrides this) */
                margin-left: auto !important;
                margin-right: auto !important;
            }

             /* Override specific table width if it was set to 50% */
            .reader-page-body .table.tsmall {
                 width: 100% !important;
            }

            /* Adjust poem line indentation which is based on original layout */
            .reader-page-body .poem-analysis-text .line {
                 padding-left: 2em !important; /* Restore standard text indent/padding for poem lines */
                 margin-left: 1em !important;
                 text-indent: -1em !important;
            }
             .reader-page-body .poem-analysis-text .line::before {
                 content: counter(versi); /* Ensure counter content is still generated */
                 color: #1B7742 !important; /* Keep original color if desired */
                 display: inline-block !important;
                 visibility: hidden !important; /* Hidden by default by original CSS */
                 text-align: right !important;
                 position: absolute !important;
                 left: 0 !important; /* Position line numbers correctly */
                 width: 2em !important; /* Adjust width for line numbers */
            }
             .reader-page-body .poem-analysis-text .line.numbered::before {
                 visibility: visible !important; /* Make numbered lines visible */
             }

             /* Ensure no_limits class still works as intended for poems */
             .reader-page-body .no_limits .line {
                margin-left: 0em !important;
                text-indent: 0em !important;
            }
             .reader-page-body .no_limits .line::before {
                width: 0 !important; /* Hide line numbers if no_limits removes them */
                margin-left: 0 !important;
                text-indent: 0 !important;
                visibility: hidden !important; /* Ensure hidden */
             }


            /* Adjust responsive styles for poem lines on smaller screens */
             @media (max-width: 767px) {
                 .reader-page-body .poem-analysis-text .line {
                      padding-left: 1em !important;
                      margin-left: 1em !important;
                      text-indent: -1em !important;
                 }
                 .reader-page-body .poem-analysis-text .line::before {
                     margin-left: -1em !important;
                     width: 1em !important;
                 }
                 .reader-page-body .no_limits .line {
                     margin-left: 0 !important;
                     text-indent: 0 !important;
                 }
             }

        `;

        document.head.appendChild(style);
        console.log('Tampermonkey: Sanoma text layout adjusted.');

    }, 500); // Small delay to ensure page structure is ready

})();
