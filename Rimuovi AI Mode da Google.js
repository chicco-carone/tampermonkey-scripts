// ==UserScript==
// @name         Rimuovi AI Mode da Google
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Rimuove il tasto AI Mode dalla barra dei filtri di Google
// @match        *://*.google.com/search*
// @match        *://*.google.it/search*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const hideAiModeButton = () => {
        const listItems = document.querySelectorAll('[role="listitem"]');
        for (const item of listItems) {
            if (item.textContent.trim() === 'AI Mode') {
                item.style.display = 'none';
            }
        }
    };

    hideAiModeButton();

    const observer = new MutationObserver(hideAiModeButton);
    observer.observe(document.body, { childList: true, subtree: true });
})();