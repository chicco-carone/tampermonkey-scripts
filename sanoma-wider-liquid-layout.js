// ==UserScript==
// @name        Sanoma Libro Liquido Wider Text Layout
// @namespace   http://tampermonkey.net/
// @match       https://libroliquido-player.sanoma.it/*
// @grant       none
// @version     1.0
// @author      chicco-carone
// @description Adjusts the layout of Sanoma Libro Liquido pages to make the main text area wider with increased padding.
// ==/UserScript==

(function () {
  "use strict";

  setTimeout(function () {
    const style = document.createElement("style");
    style.type = "text/css";
    style.id = "widen-text-layout-tampermonkey";

    style.textContent = `
            .reader-page-body .content,
            .reader-page-body .padding {
                margin-left: 0 !important;
                margin-right: 0 !important;
                border-left: none !important;
                box-shadow: none !important;
                padding-left: 100px !important;
                padding-right: 100px !important;
                width: auto !important;
                max-width: none !important;
                left: auto !important;
                right: auto !important;
            }

            .reader-page-body .cover .content {
                  left: 100px !important;
                  right: 100px !important;
                  margin-left: 0 !important;
                  margin-right: 0 !important;
                  width: auto !important;
            }

            .reader-page-body .image,
            .reader-page-body .image-small,
            .reader-page-body .image-extrasmall,
            .reader-page-body .table,
            .reader-page-body .table-noborder {
                width: 100% !important;
                max-width: 100% !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }

            .reader-page-body .table.tsmall {
                  width: 100% !important;
            }

            .reader-page-body .poem-analysis-text .line {
                  padding-left: 2em !important;
                  margin-left: 1em !important;
                  text-indent: -1em !important;
            }
              .reader-page-body .poem-analysis-text .line::before {
                  content: counter(versi);
                  color: #1B7742 !important;
                  display: inline-block !important;
                  visibility: hidden !important;
                  text-align: right !important;
                  position: absolute !important;
                  left: 0 !important;
                  width: 2em !important;
            }
              .reader-page-body .poem-analysis-text .line.numbered::before {
                  visibility: visible !important;
              }

              .reader-page-body .no_limits .line {
                 margin-left: 0em !important;
                 text-indent: 0em !important;
             }
              .reader-page-body .no_limits .line::before {
                 width: 0 !important;
                 margin-left: 0 !important;
                 text-indent: 0 !important;
                 visibility: hidden !important;
              }


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
    console.log("Tampermonkey: Sanoma text layout adjusted.");
  }, 500);
})();