// ==UserScript==
// @name         Sanoma Keyboard Navigation (Arrow Keys)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Changes page on Sanoma Libro Liquido using arrow keys (Left/Right)
// @author       chicco-carone
// @match        https://libroliquido-player.sanoma.it/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  console.log(
    "Keyboard navigation activated: Use Left and Right arrows to change pages.",
  );

  document.addEventListener("keydown", function (e) {
    const activeTag = document.activeElement.tagName.toUpperCase();
    const isEditable = document.activeElement.isContentEditable;

    if (
      activeTag === "INPUT" ||
      activeTag === "TEXTAREA" ||
      activeTag === "SELECT" ||
      isEditable
    ) {
      return;
    }

    const prevBtn = document.querySelector(".prev-section");
    const nextBtn = document.querySelector(".next-section");

    if (e.key === "ArrowLeft") {
      if (prevBtn) {
        console.log("Going to previous page...");
        prevBtn.click();
      }
    } else if (e.key === "ArrowRight") {
      if (nextBtn) {
        console.log("Going to next page...");
        nextBtn.click();
      }
    }
  });
})();