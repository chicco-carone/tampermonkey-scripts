// ==UserScript==
// @name         Hide GitHub Agents tab
// @namespace    local.github
// @version      1.0
// @description  Hide the Agents tab in GitHub repository headers.
// @match        https://github.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    GM_addStyle(`
        li:has(> a[data-tab-item="agents"]),
        a[data-tab-item="agents"] {
            display: none !important;
        }
    `);
})();
