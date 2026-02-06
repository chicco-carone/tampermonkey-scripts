// ==UserScript==
// @name         bSmart Extractor
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Combina la scansione profonda (Shadow DOM) con la formattazione basata su coordinate.
// @author       Gemini
// @match        https://books.bsmart.it/*
// @match        file:///*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configurazione Layout
    const CONFIG = {
        lineHeightTolerance: 6, // Tolleranza verticale per considerare testo sulla stessa riga
        headerFontSize: 16,     // Font minimo per titoli
        excludeSelectors: ['nav', 'button', '.bottom-xl', '[role="log"]', '.cookieconsent'] // Elementi UI da ignorare
    };

    // --- FUNZIONI DI PULIZIA ---
    function cleanText(text) {
        if (!text) return "";
        return text.trim()
            .replace(/[\r\n]+/g, " ")
            .replace(/\s{2,}/g, " ")
            .replace(/^ǫ\s?/, "* ")
            .replace(/^•\s?/, "* ");
    }

    // --- CRAWLER RICORSIVO (Deep Scan) ---
    // Attraversa DOM, Iframe e ShadowDOM raccogliendo nodi di testo con coordinate
    function crawlAndCollect(node, collection) {
        // 1. Ignora nodi nulli o commenti
        if (!node) return;

        // 2. Controllo Elementi UI da escludere
        if (node.nodeType === Node.ELEMENT_NODE) {
            // Se è un tag da ignorare
            if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IMG', 'NAV', 'BUTTON'].includes(node.tagName)) return;

            // Se ha classi UI specifiche (es. zoom controls, header)
            if (node.classList && (node.classList.contains('bottom-xl') || node.closest && node.closest('nav'))) return;

            // Se ha Shadow DOM, entraci
            if (node.shadowRoot) {
                crawlAndCollect(node.shadowRoot, collection);
            }

            // Se è un Iframe, prova a entrarci
            if (node.tagName === 'IFRAME') {
                try {
                    if (node.contentDocument && node.contentDocument.body) {
                        crawlAndCollect(node.contentDocument.body, collection);
                    }
                } catch(e) { /* Cross-origin block */ }
            }
        }

        // 3. Raccolta Nodi di Testo
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text.length > 0 && !text.includes("Caricamento") && text !== "Processing...") {
                const parent = node.parentElement;
                if (!parent) return;

                // Calcola coordinate assolute
                const rect = parent.getBoundingClientRect();

                // Ignora elementi nascosti o fuori schermo (coordinate 0,0)
                if (rect.width === 0 || rect.height === 0) return;

                const style = window.getComputedStyle(parent);

                collection.push({
                    text: cleanText(text),
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    height: rect.height,
                    fontSize: parseFloat(style.fontSize) || 12,
                    fontWeight: style.fontWeight,
                    tagName: parent.tagName
                });
            }
        }

        // 4. Ricorsione sui figli standard
        if (node.childNodes && node.childNodes.length > 0) {
            for (let i = 0; i < node.childNodes.length; i++) {
                crawlAndCollect(node.childNodes[i], collection);
            }
        }
    }

    // --- CORE LOGIC ---
    function getHybridMarkdown() {
        console.log("--- Avvio Hybrid Scan v4.0 ---");

        let allNodes = [];

        // Inizia la scansione dal contenitore principale se esiste, altrimenti dal body
        // Usiamo un selettore ampio per beccare il contenitore del libro
        const root = document.getElementById('pdfwrapper') || document.body;

        crawlAndCollect(root, allNodes);

        console.log(`Trovati ${allNodes.length} frammenti di testo.`);

        if (allNodes.length === 0) {
            alert("Nessun testo trovato. Assicurati che la pagina sia renderizzata.");
            return null;
        }

        // --- ORDINAMENTO SMART (v3.0 logic) ---

        // Calcola il centro pagina per le colonne
        const minLeft = Math.min(...allNodes.map(n => n.left));
        const maxLeft = Math.max(...allNodes.map(n => n.left));
        const pageCenter = (minLeft + maxLeft) / 2;

        allNodes.sort((a, b) => {
            // 1. Logica Colonne (Sinistra vs Destra)
            const aIsLeft = a.left < pageCenter;
            const bIsLeft = b.left < pageCenter;

            // Se uno è chiaramente a sx e l'altro a dx, vince quello a sx
            // Aggiungiamo un margine di tolleranza (50px) per evitare falsi positivi sui titoli centrati
            if (aIsLeft && !bIsLeft && (b.left - a.left > 50)) return -1;
            if (!aIsLeft && bIsLeft && (a.left - b.left > 50)) return 1;

            // 2. Logica Righe (Dall'alto in basso)
            if (Math.abs(a.top - b.top) > CONFIG.lineHeightTolerance) {
                return a.top - b.top;
            }

            // 3. Logica Lettura (Da sinistra a destra sulla stessa riga)
            return a.left - b.left;
        });

        // --- RICOSTRUZIONE MARKDOWN ---
        let markdown = "";
        let lastNode = null;

        allNodes.forEach(node => {
            let prefix = "";
            let suffix = "";
            let newline = "";

            // Rilevamento Intestazioni e Grassetto
            const isHeader = node.fontSize > CONFIG.headerFontSize;
            const isBold = !isHeader && (node.fontWeight === 'bold' || parseInt(node.fontWeight) >= 700);

            if (isHeader) {
                prefix = node.fontSize > 20 ? "# " : "## ";
                newline = "\n\n";
            } else if (isBold) {
                prefix = "**";
                suffix = "**";
            }

            // Gestione spaziature
            if (lastNode) {
                const yDiff = node.top - lastNode.top;
                const xDiff = node.left - (lastNode.left + 50); // Stima larghezza parola prec.

                if (yDiff > CONFIG.lineHeightTolerance * 2) {
                    // Nuovo paragrafo
                    markdown += "\n\n";
                } else if (yDiff > CONFIG.lineHeightTolerance) {
                    // A capo semplice
                    markdown += "\n";
                } else {
                    // Stessa riga -> aggiungi spazio
                    markdown += " ";
                }
            }

            // Correzione elenchi puntati
            if (node.text.startsWith("* ") && markdown.slice(-1) !== "\n" && markdown.slice(-1) !== "\n") {
                 markdown += "\n";
            }

            markdown += newline + prefix + node.text + suffix;
            lastNode = node;
        });

        return markdown;
    }

    // --- UI & DOWNLOAD ---
    function downloadMarkdown(content) {
        if (!content) return;
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.download = `bsmart-hybrid-${timestamp}.md`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }

    function addBtn() {
        const header = document.querySelector('nav.fixed.w-full');
        if (!header || document.getElementById('tm-hybrid-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'tm-hybrid-btn';
        btn.innerText = 'Download';
        btn.style.cssText = "background-color: #2563eb; color: white; font-weight: bold; padding: 0 15px; height: 36px; border-radius: 9999px; border: none; cursor: pointer; margin-left: 10px; z-index: 99999;";

        btn.onclick = () => {
            const oldText = btn.innerText;
            btn.innerText = 'Extracting...';
            setTimeout(() => {
                const md = getHybridMarkdown();
                if (md) downloadMarkdown(md);
                btn.innerText = oldText;
            }, 50);
        };

        (header.querySelector('div.flex.items-center.grow') || header).appendChild(btn);
    }

    const observer = new MutationObserver(() => addBtn());
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(addBtn, 1000);

})();