// ==UserScript==
// @name         Sanoma Book to Markdown
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Aggiunge un bottone nella bottom bar per scaricare il capitolo corrente in Markdown (no img, no audio)
// @author       Gemini
// @match        https://libroliquido-player.sanoma.it/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configurazione Icona (Material Icon 'file_download')
    const DOWNLOAD_ICON_HTML = '<i class="app-button--icon reader-icon material-icons">DW</i>';

    // Funzione principale di estrazione (dal tuo script precedente)
    function extractAndDownload() {
        console.log("Avvio estrazione contenuto...");

        const mainContent = document.querySelector('main[is="reader-body"]');

        if (!mainContent) {
            alert("Errore: Impossibile trovare il testo del libro. Assicurati che la pagina sia caricata.");
            return;
        }

        function cleanText(element) {
            if (!element) return "";
            let text = element.innerText;
            return text.replace(/\s+/g, ' ').trim();
        }

        const textBlocks = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, li, blockquote, .prosa, .text, .title, .subtitle, .header');

        let markdownOutput = "";
        let processedNodes = new Set();

        textBlocks.forEach(el => {
            if (processedNodes.has(el)) return;

            // --- FILTRI ---
            // 1. Ignora elementi tecnici
            if (el.closest('.audio') || el.closest('.player-wrapper') || el.closest('.user-bar') || el.closest('button')) return;
            // 2. Ignora didascalie
            if (el.classList.contains('caption')) return;
            // 3. Ignora header audio specifici
            if (el.classList.contains('audio_header')) return;

            const text = cleanText(el);
            if (text.length === 0) return;

            // 4. *** SKIP AUDIOLETTURA ***
            if (text.toUpperCase().includes('AUDIOLETTURA')) return;
            // --- FINE FILTRI ---

            const tagName = el.tagName.toUpperCase();
            const classes = el.classList;

            // Conversione MD
            if (tagName === 'H1' || (classes.contains('title') && classes.contains('cover'))) {
                markdownOutput += `# ${text}\n\n`;
            }
            else if (tagName === 'H2' || classes.contains('title')) {
                markdownOutput += `## ${text}\n\n`;
            }
            else if (tagName === 'H3' || classes.contains('subtitle') || classes.contains('header')) {
                markdownOutput += `### ${text}\n\n`;
            }
            else if (tagName === 'H4' || classes.contains('pretitle')) {
                markdownOutput += `#### ${text}\n\n`;
            }
            else if (tagName === 'P' || classes.contains('text') || classes.contains('prosa')) {
                markdownOutput += `${text}\n\n`;
            }
            else if (tagName === 'UL') {
                const listItems = el.querySelectorAll('li');
                listItems.forEach(li => {
                    processedNodes.add(li);
                    let liText = cleanText(li);
                    if (!liText.toUpperCase().includes('AUDIOLETTURA')) {
                        markdownOutput += `- ${liText}\n`;
                    }
                });
                markdownOutput += `\n`;
                processedNodes.add(el);
            }
            else if (tagName === 'OL') {
                const listItems = el.querySelectorAll('li');
                listItems.forEach((li, index) => {
                    processedNodes.add(li);
                    let liText = cleanText(li);
                    if (!liText.toUpperCase().includes('AUDIOLETTURA')) {
                        markdownOutput += `${index + 1}. ${liText}\n`;
                    }
                });
                markdownOutput += `\n`;
                processedNodes.add(el);
            }
            else if (tagName === 'LI') {
                markdownOutput += `- ${text}\n`;
            }
            else if (tagName === 'BLOCKQUOTE' || classes.contains('quote')) {
                markdownOutput += `> ${text}\n\n`;
            }

            processedNodes.add(el);
        });

        // Download
        const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const docTitle = document.title ? document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : "libro_liquido";

        a.href = url;
        a.download = `${docTitle}_no_audio.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Funzione per iniettare il bottone nella UI
    function injectButton() {
        // Selettore della barra inferiore (basato sul tuo HTML)
        const navbarContainer = document.querySelector('.navbar__container');

        // Controllo se esiste la barra e se non abbiamo già messo il bottone
        if (navbarContainer && !document.getElementById('tm-download-btn')) {

            const btn = document.createElement('button');
            btn.id = 'tm-download-btn';
            btn.className = 'app-button'; // Classe nativa per ereditare lo stile
            btn.setAttribute('is', 'app-button'); // Attributo custom element
            btn.setAttribute('tooltip', 'Scarica MD (No Audio/Img)');
            btn.setAttribute('aria-label', 'Scarica Markdown');
            btn.style.cursor = 'pointer';
            btn.style.color = 'inherit'; // Assicura che l'icona prenda il colore del tema

            btn.innerHTML = DOWNLOAD_ICON_HTML;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                extractAndDownload();
            });

            // Inserisci il bottone prima dell'ultimo elemento (spesso il bookmark o il menu)
            // oppure appendilo alla fine. Qui lo metto alla fine del container.
            navbarContainer.appendChild(btn);
            console.log('Bottone Download Markdown iniettato.');
        }
    }

    // Osservatore per gestire il caricamento dinamico della pagina (SPA)
    const observer = new MutationObserver((mutations) => {
        injectButton();
    });

    // Avvia l'osservatore sul body
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Tentativo immediato nel caso la pagina sia già pronta
    injectButton();

})();
