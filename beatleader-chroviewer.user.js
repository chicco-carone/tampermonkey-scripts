// ==UserScript==
// @name         BeatLeader - ChroViewer button
// @namespace    beatleader-chroviewer
// @version      1.0.0
// @description  Open each BeatLeader score in ChroViewer.
// @match        https://beatleader.com/*
// @match        https://www.beatleader.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';
    const selector = 'a[href*="replay.beatleader.com/"][href*="scoreId="]';
    const marker = 'bl-chroviewer';

    function update() {
        document.querySelectorAll(selector).forEach(replay => {
            const id = new URL(replay.href).searchParams.get('scoreId');
            if (!id || !/^\d+$/.test(id)) return;
            let button = replay.nextElementSibling;
            if (!button?.classList.contains(marker)) {
                button = replay.cloneNode(true);
                button.removeAttribute('id');
                button.classList.add(marker);
                button.classList.remove('non-subscribed');
                button.title = 'Open score in ChroViewer';
                button.setAttribute('aria-label', button.title);
                button.target = '_blank';
                button.rel = 'noopener noreferrer';
                const icon = button.querySelector('.icon');
                if (icon) {
                    icon.replaceChildren();
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('viewBox', '0 0 24 24');
                    svg.setAttribute('width', '16');
                    svg.setAttribute('height', '16');
                    svg.setAttribute('aria-hidden', 'true');
                    svg.innerHTML = '<path d="M9 5a7 7 0 1 0 0 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="m12 6 9 6-9 6Z" fill="currentColor"/>';
                    icon.append(svg);
                } else {
                    button.textContent = 'CV';
                }
                replay.after(button);
            }
            const href = 'https://chroviewer.com/?scoreIdBL=' + id;
            if (button.href !== href) button.href = href;
        });
    }

    let pending = false;
    new MutationObserver(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            pending = false;
            update();
        });
    }).observe(document.body, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ['href']
    });
    update();
})();

