// ==UserScript==
// @name         Sanoma Keyboard Navigation (Arrow Keys)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Cambia pagina su Sanoma Libro Liquido usando le frecce direzionali (Left/Right)
// @author       Gemini
// @match        https://libroliquido-player.sanoma.it/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("Navigazione da tastiera attivata: Usa Freccia SX e DX per cambiare pagina.");

    document.addEventListener('keydown', function(e) {
        // 1. Controllo di sicurezza:
        // Se l'utente sta scrivendo in un input, textarea o campo editabile, NON cambiare pagina.
        const activeTag = document.activeElement.tagName.toUpperCase();
        const isEditable = document.activeElement.isContentEditable;

        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT' || isEditable) {
            return;
        }

        // 2. Selettori dei bottoni (basati sul codice HTML fornito)
        // Usiamo '.prev-section' e '.next-section' che sono i contenitori <a> principali
        const prevBtn = document.querySelector('.prev-section');
        const nextBtn = document.querySelector('.next-section');

        // 3. Logica di navigazione
        if (e.key === 'ArrowLeft') {
            if (prevBtn) {
                // e.preventDefault(); // Decommenta se vuoi evitare lo scroll orizzontale della pagina
                console.log("Vai alla pagina precedente...");
                prevBtn.click();
            }
        }
        else if (e.key === 'ArrowRight') {
            if (nextBtn) {
                // e.preventDefault(); // Decommenta se vuoi evitare lo scroll orizzontale della pagina
                console.log("Vai alla pagina successiva...");
                nextBtn.click();
            }
        }
    });

})();
