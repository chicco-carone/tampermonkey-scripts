// ==UserScript==
// @name         bSmart Extractor
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Combines deep scanning (Shadow DOM) with coordinate-based formatting.
// @author       chicco-carone
// @match        https://books.bsmart.it/*
// @match        file:///*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CONFIG = {
    lineHeightTolerance: 6,
    headerFontSize: 16,
    excludeSelectors: [
      "nav",
      "button",
      ".bottom-xl",
      '[role="log"]',
      ".cookieconsent",
    ],
  };

  function cleanText(text) {
    if (!text) return "";
    return text
      .trim()
      .replace(/[\r\n]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/^ǫ\s?/, "* ")
      .replace(/^•\s?/, "* ");
  }

  function crawlAndCollect(node, collection) {
    if (!node) return;

    if (node.nodeType === Node.ELEMENT_NODE) {
      if (
        ["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "IMG", "NAV", "BUTTON"].includes(
          node.tagName,
        )
      )
        return;

      if (
        node.classList &&
        (node.classList.contains("bottom-xl") ||
          (node.closest && node.closest("nav")))
      )
        return;

      if (node.shadowRoot) {
        crawlAndCollect(node.shadowRoot, collection);
      }

      if (node.tagName === "IFRAME") {
        try {
          if (node.contentDocument && node.contentDocument.body) {
            crawlAndCollect(node.contentDocument.body, collection);
          }
        } catch (e) {}
      }
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (
        text.length > 0 &&
        !text.includes("Caricamento") &&
        text !== "Processing..."
      ) {
        const parent = node.parentElement;
        if (!parent) return;

        const rect = parent.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) return;

        const style = window.getComputedStyle(parent);

        collection.push({
          text: cleanText(text),
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          height: rect.height,
          fontSize: parseFloat(style.fontSize) || 12,
          fontWeight: style.fontWeight,
          tagName: parent.tagName,
        });
      }
    }

    if (node.childNodes && node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        crawlAndCollect(node.childNodes[i], collection);
      }
    }
  }

  function getHybridMarkdown() {
    console.log("--- Starting Hybrid Scan v4.0 ---");

    let allNodes = [];

    const root = document.getElementById("pdfwrapper") || document.body;

    crawlAndCollect(root, allNodes);

    console.log(`Found ${allNodes.length} text fragments.`);

    if (allNodes.length === 0) {
      alert("No text found. Make sure the page is rendered.");
      return null;
    }

    const minLeft = Math.min(...allNodes.map((n) => n.left));
    const maxLeft = Math.max(...allNodes.map((n) => n.left));
    const pageCenter = (minLeft + maxLeft) / 2;

    allNodes.sort((a, b) => {
      const aIsLeft = a.left < pageCenter;
      const bIsLeft = b.left < pageCenter;

      if (aIsLeft && !bIsLeft && b.left - a.left > 50) return -1;
      if (!aIsLeft && bIsLeft && a.left - b.left > 50) return 1;

      if (Math.abs(a.top - b.top) > CONFIG.lineHeightTolerance) {
        return a.top - b.top;
      }

      return a.left - b.left;
    });

    let markdown = "";
    let lastNode = null;

    allNodes.forEach((node) => {
      let prefix = "";
      let suffix = "";
      let newline = "";

      const isHeader = node.fontSize > CONFIG.headerFontSize;
      const isBold =
        !isHeader &&
        (node.fontWeight === "bold" || parseInt(node.fontWeight) >= 700);

      if (isHeader) {
        prefix = node.fontSize > 20 ? "# " : "## ";
        newline = "\n\n";
      } else if (isBold) {
        prefix = "**";
        suffix = "**";
      }

      if (lastNode) {
        const yDiff = node.top - lastNode.top;

        if (yDiff > CONFIG.lineHeightTolerance * 2) {
          markdown += "\n\n";
        } else if (yDiff > CONFIG.lineHeightTolerance) {
          markdown += "\n";
        } else {
          markdown += " ";
        }
      }

      if (
        node.text.startsWith("* ") &&
        markdown.slice(-1) !== "\n" &&
        markdown.slice(-1) !== "\n"
      ) {
        markdown += "\n";
      }

      markdown += newline + prefix + node.text + suffix;
      lastNode = node;
    });

    return markdown;
  }

  function downloadMarkdown(content) {
    if (!content) return;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    a.download = `bsmart-hybrid-${timestamp}.md`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  function addBtn() {
    const header = document.querySelector("nav.fixed.w-full");
    if (!header || document.getElementById("tm-hybrid-btn")) return;

    const btn = document.createElement("button");
    btn.id = "tm-hybrid-btn";
    btn.innerText = "Download";
    btn.style.cssText =
      "background-color: #2563eb; color: white; font-weight: bold; padding: 0 15px; height: 36px; border-radius: 9999px; border: none; cursor: pointer; margin-left: 10px; z-index: 99999;";

    btn.onclick = () => {
      const oldText = btn.innerText;
      btn.innerText = "Extracting...";
      setTimeout(() => {
        const md = getHybridMarkdown();
        if (md) downloadMarkdown(md);
        btn.innerText = oldText;
      }, 50);
    };

    (header.querySelector("div.flex.items-center.grow") || header).appendChild(
      btn,
    );
  }

  const observer = new MutationObserver(() => addBtn());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(addBtn, 1000);
})();