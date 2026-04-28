// ==UserScript==
// @name         Game8 Character Search
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Search and highlight characters on Game8 pages
// @author       chicco-carone
// @match        https://game8.co/*
// @icon         https://www.google.com/s2/favicons?sz=16&domain=game8.co
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const searchContainer = document.createElement("div");
  searchContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        background: #1a1a2e;
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

  const searchInput = document.createElement("input");
  searchInput.placeholder = "Search characters...";
  searchInput.style.cssText = `
        width: 200px;
        padding: 8px 12px;
        border: 1px solid #333;
        border-radius: 4px;
        background: #16213e;
        color: #eee;
        font-size: 14px;
        outline: none;
    `;

  const resultDiv = document.createElement("div");
  resultDiv.style.cssText = `
        margin-top: 8px;
        max-height: 300px;
        overflow-y: auto;
    `;

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(resultDiv);
  document.body.appendChild(searchContainer);

  function getAllCharacters() {
    const characters = [];
    const cards = document.querySelectorAll(
      ".js-discription-tooltip.c-tooltip__btn",
    );

    cards.forEach((card) => {
      const img = card.querySelector("img");
      const template = card.querySelector("template.js-tooltip-content");
      const link = card.closest("a");

      if (img && img.alt) {
        const name = img.alt.trim();
        const url = link ? link.href : "";

        if (!characters.some((c) => c.name === name)) {
          characters.push({ name, url });
        }
      }
    });

    return characters;
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightCharacters(query) {
    const cards = document.querySelectorAll(
      ".js-discription-tooltip.c-tooltip__btn",
    );
    let foundCount = 0;

    cards.forEach((card) => {
      const img = card.querySelector("img");
      if (!img) return;

      const name = img.alt || "";
      const regex = new RegExp(escapeRegex(query), "i");
      const isMatch = regex.test(name);

      if (query && isMatch) {
        card.style.outline = "3px solid #ff6b6b";
        card.style.borderRadius = "8px";
        foundCount++;
      } else {
        card.style.outline = "";
        card.style.borderRadius = "";
      }
    });

    return foundCount;
  }

  function showResults(matches) {
    resultDiv.innerHTML = "";

    if (matches.length === 0) {
      resultDiv.innerHTML =
        '<div style="color: #888; font-size: 12px;">No characters found</div>';
      return;
    }

    matches.forEach((match) => {
      const item = document.createElement("div");
      item.style.cssText = `
                padding: 8px;
                cursor: pointer;
                color: #eee;
                border-bottom: 1px solid #333;
                font-size: 13px;
                transition: background 0.2s;
            `;
      item.textContent = match.name;

      item.addEventListener("click", () => {
        const allCards = document.querySelectorAll(
          ".js-discription-tooltip.c-tooltip__btn",
        );
        const card = Array.from(allCards).find((c) => {
          const img = c.querySelector("img");
          return (
            img &&
            img.alt &&
            new RegExp(escapeRegex(match.name), "i").test(img.alt)
          );
        });

        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.style.outline = "4px solid #00ff88";
          card.style.borderRadius = "8px";
          setTimeout(() => {
            card.style.outline = "3px solid #ff6b6b";
          }, 2000);
        } else {
          alert(`Character found: ${match.name}\nBut card not found on page.`);
        }
      });

      item.addEventListener("mouseenter", () => {
        item.style.background = "#333";
      });
      item.addEventListener("mouseleave", () => {
        item.style.background = "";
      });

      resultDiv.appendChild(item);
    });
  }

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    if (!query) {
      highlightCharacters("");
      resultDiv.innerHTML = "";
      return;
    }

    const allCharacters = getAllCharacters();
    const regex = new RegExp(escapeRegex(query), "i");
    const matches = allCharacters.filter((c) => regex.test(c.name));

    highlightCharacters(query);
    showResults(matches);
  });

  console.log("Game8 Character Search loaded!");
})();