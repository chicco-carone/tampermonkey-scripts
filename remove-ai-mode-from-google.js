// ==UserScript==
// @name         Remove AI Mode from Google
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Removes the AI Mode button from Google's filter bar
// @author       chicco-carone
// @match        *://*.google.com/search*
// @match        *://*.google.it/search*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const hideAiModeButton = () => {
    const listItems = document.querySelectorAll('[role="listitem"]');
    for (const item of listItems) {
      if (item.textContent.trim() === "AI Mode") {
        item.style.display = "none";
      }
    }
  };

  hideAiModeButton();

  const observer = new MutationObserver(hideAiModeButton);
  observer.observe(document.body, { childList: true, subtree: true });
})();
