// ==UserScript==
// @name         Sanoma Book to Markdown (Clean)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Extracts the chapter as clean Markdown, removing footnotes, page numbers and artifacts
// @author       chicco-carone
// @match        https://libroliquido-player.sanoma.it/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const DOWNLOAD_ICON_HTML =
    '<i class="app-button--icon reader-icon material-icons">file_download</i>';

  function cleanText(element) {
    if (!element) return "";

    const clone = element.cloneNode(true);

    clone.querySelectorAll("sup, sub").forEach((el) => el.remove());

    clone
      .querySelectorAll(
        ".footnote-ref, .note-ref, .page-num, .line-num, [data-annotation]",
      )
      .forEach((el) => el.remove());

    let text = clone.innerText || clone.textContent || "";

    text = text.replace(
      /([a-zA-ZàèéìòùÀÈÉÌÒÙáéíóúÁÉÍÓÚ])(\d+)([.,;:!?\s]|$)/g,
      "$1$3",
    );

    if (/^\s*\d{1,4}\s*$/.test(text)) {
      return "";
    }

    text = text.replace(/\s+/g, " ").trim();

    return text;
  }

  function extractAndDownload() {
    console.log("Starting clean content extraction...");

    const mainContent =
      document.querySelector('main[is="reader-body"]') ||
      document.querySelector(".reader-body") ||
      document.querySelector("article") ||
      document.querySelector(".book-content");

    if (!mainContent) {
      alert("Error: Could not find the book text.");
      return;
    }

    const selectors = [
      "h1, h2, h3, h4, h5, h6",
      "p",
      "ul, ol",
      "li",
      "blockquote",
      ".prosa, .text, .paragraph",
      ".title, .subtitle, .header, .chapter-title",
      ".dialogue, .speaker",
      '[class*="content"] p',
      'div[role="paragraph"]',
    ];

    const textBlocks = mainContent.querySelectorAll(selectors.join(", "));
    let markdownOutput = "";
    let processedNodes = new Set();
    let lastWasEmpty = true;

    function addToOutput(text, prefix = "", suffix = "\n\n") {
      if (!text || text.length === 0) return;

      if (text.toUpperCase().includes("AUDIOLETTURA")) return;

      if (/^\s*\d+\s*$/.test(text)) return;

      const formatted = prefix + text + suffix;
      markdownOutput += formatted;
      lastWasEmpty = false;
    }

    textBlocks.forEach((el) => {
      if (processedNodes.has(el)) return;

      if (
        el.closest(".audio, .player-wrapper, .user-bar, button, nav, .toolbar")
      )
        return;
      if (
        el.classList.contains("caption") ||
        el.classList.contains("audio_header")
      )
        return;

      const text = cleanText(el);
      if (!text || text.length === 0) return;

      if (/^[\s\-–—]*\d+[\s\-–—]*$/.test(text)) return;

      const tagName = el.tagName ? el.tagName.toUpperCase() : "DIV";
      const classes = el.classList;

      if (
        tagName === "H1" ||
        classes.contains("book-title") ||
        classes.contains("cover-title")
      ) {
        addToOutput(text, "# ");
      } else if (
        tagName === "H2" ||
        classes.contains("chapter-title") ||
        classes.contains("title")
      ) {
        addToOutput(text, "## ");
      } else if (
        tagName === "H3" ||
        classes.contains("subtitle") ||
        classes.contains("section-title")
      ) {
        addToOutput(text, "### ");
      } else if (tagName === "H4" || classes.contains("subheader")) {
        addToOutput(text, "#### ");
      } else if (tagName === "H5") {
        addToOutput(text, "##### ");
      } else if (tagName === "H6") {
        addToOutput(text, "###### ");
      } else if (tagName === "UL") {
        const listItems = el.querySelectorAll(":scope > li");
        if (listItems.length === 0) return;

        listItems.forEach((li) => {
          processedNodes.add(li);
          let liText = cleanText(li);
          liText = liText.replace(/^[\d\-]+\s*[\.,]\s*/, "");
          if (liText && !liText.toUpperCase().includes("AUDIOLETTURA")) {
            addToOutput(liText, "- ", "\n");
          }
        });
        markdownOutput += "\n";
        processedNodes.add(el);
        lastWasEmpty = true;
      } else if (tagName === "OL") {
        const listItems = el.querySelectorAll(":scope > li");
        if (listItems.length === 0) return;

        listItems.forEach((li, index) => {
          processedNodes.add(li);
          let liText = cleanText(li);
          if (liText && !liText.toUpperCase().includes("AUDIOLETTURA")) {
            addToOutput(liText, `${index + 1}. `, "\n");
          }
        });
        markdownOutput += "\n";
        processedNodes.add(el);
        lastWasEmpty = true;
      } else if (
        tagName === "BLOCKQUOTE" ||
        classes.contains("quote") ||
        classes.contains("citation")
      ) {
        const lines = text.split("\n").filter((l) => l.trim());
        lines.forEach((line) => {
          addToOutput(line.trim(), "> ", "\n");
        });
        markdownOutput += "\n";
      } else if (tagName === "LI") {
        addToOutput(text, "- ");
      } else {
        if (
          text.length < 100 &&
          text === text.toUpperCase() &&
          text.includes(" ")
        ) {
          addToOutput(text, "### ");
        } else {
          addToOutput(text);
        }
      }

      processedNodes.add(el);
    });

    markdownOutput = markdownOutput.replace(/\n{3,}/g, "\n\n");

    markdownOutput = markdownOutput.replace(/^\d+$/gm, "");

    markdownOutput = markdownOutput.replace(/[ \t]+/g, " ");

    if (!markdownOutput.trim()) {
      alert("No content extracted. Try reloading the page.");
      return;
    }

    const blob = new Blob([markdownOutput.trim()], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    let docTitle = "libro_liquido";
    const titleEl = document.querySelector("h1, .book-title, .chapter-title");
    if (titleEl) {
      docTitle =
        cleanText(titleEl)
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase() || docTitle;
    } else if (document.title) {
      docTitle = document.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    }

    a.href = url;
    a.download = `${docTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Download completed: " + docTitle + ".md");
  }

  function injectButton() {
    const navbarContainer =
      document.querySelector(".navbar__container") ||
      document.querySelector(".reader-toolbar") ||
      document.querySelector('[class*="toolbar"]');

    if (navbarContainer && !document.getElementById("tm-download-btn")) {
      const btn = document.createElement("button");
      btn.id = "tm-download-btn";
      btn.className = "app-button";
      btn.setAttribute("is", "app-button");
      btn.setAttribute("tooltip", "Download MD (Clean)");
      btn.setAttribute("aria-label", "Download Markdown without numbers");
      btn.style.cursor = "pointer";
      btn.style.color = "inherit";
      btn.style.marginLeft = "8px";

      btn.innerHTML = DOWNLOAD_ICON_HTML;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        extractAndDownload();
      });

      navbarContainer.appendChild(btn);
      console.log("Download Markdown (Clean) button injected.");
    }
  }

  let debounceTimer;
  const observer = new MutationObserver((mutations) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(injectButton, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  injectButton();
})();