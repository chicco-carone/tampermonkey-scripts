// ==UserScript==
// @name         Cambridge One Keyboard Navigation
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add keyboard navigation with arrow keys for Cambridge One eBook
// @author       chicco-carone
// @match        https://www.cambridgeone.org/foc/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let lastKeyTime = 0;
    const cooldown = 300;

    function findNavButton(direction) {
        const idMap = {
            'right': 'nextButton',
            'left': 'previousButton'
        };

        const btn = document.getElementById(idMap[direction]);
        if (btn && btn.offsetParent !== null) {
            return btn;
        }

        const selectors = [
            `[title*="${direction}" i]`,
            `button[class*="${direction}"]`
        ];

        for (const sel of selectors) {
            try {
                const el = document.querySelector(sel);
                if (el && el.offsetParent !== null && el.getBoundingClientRect().width > 0) {
                    return el;
                }
            } catch (e) {}
        }

        return null;
    }

    document.addEventListener('keydown', (e) => {
        const now = Date.now();
        if (now - lastKeyTime < cooldown) return;

        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            lastKeyTime = now;

            const leftBtn = findNavButton('left');
            const rightBtn = findNavButton('right');
            const btn = e.key === 'ArrowRight' ? rightBtn : leftBtn;

            if (btn) {
                btn.click();
            } else {
                const container = document.querySelector('app-page-viewer, app-book-viewer, [class*="viewer"]');
                if (container) {
                    container.dispatchEvent(new MouseEvent('click', {
                        bubbles: true,
                        clientX: e.key === 'ArrowRight' ? window.innerWidth - 50 : 50,
                        clientY: window.innerHeight / 2
                    }));
                }
            }
        }
    });

})();