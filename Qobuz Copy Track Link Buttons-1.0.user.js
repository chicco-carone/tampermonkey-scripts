// ==UserScript==
// @name        Qobuz Copy Track Link Buttons
// @namespace   none
// @match       https://www.qobuz.com/*/album/*/*
// @grant       p4rzl
// @version     1.0
// @description  none
// @run-at document-start
// ==/UserScript==
/* globals jQuery, $, waitForKeyElements */

document.addEventListener('DOMContentLoaded', function() {
    // Explicit album indicator
    var color = '#404040'; // Use #FF0000' for RED
    var size = '26px'; // Change to a bigger size, like 40px
    var explicitSpans = document.querySelectorAll('span.explicit');
    if (explicitSpans.length > 0) {
        var albumMetaItems = document.querySelector('ul.album-meta__items');
        var newListItem = document.createElement('li');
        newListItem.textContent = '🅴 Explicit';
        newListItem.style.color = color;
        newListItem.style.fontSize = size;
        albumMetaItems.appendChild(newListItem);
    }
});

const o = new MutationObserver(e => {
    e.forEach(({
        addedNodes: e
    }) => {
        e.forEach(e => {
            if (e.nodeType === 1 && e.matches("script") && e.src.includes("addtocart")) {
                e.remove();
                o.disconnect();
            }
        });
    });
});

o.observe(document.documentElement, {
    childList: true,
    subtree: true
});

function clicky(i) {
    let songid = $("div.track").eq(i - 1).data("track");
    navigator.clipboard.writeText(`https://play.qobuz.com/track/${songid}`);
    $("button.track__item--button").eq(i - 1).html("Copied! &nbsp <img src='https://slavart.gamesdrive.net/favicon.ico' width='24px'/>");
    setTimeout(function() {
        $("button.track__item--button").eq(i - 1).html('copy track link')
    }, 1000);
}

function main() {
    unsafeWindow.clicky = clicky;
    $('.track__items').find('div:last').after('<button class="track__item--button" style="padding: 0px; margin-left; cursor: pointer;" type="button"> copy track link </button>');
    $("button.track__item.popin-addtocart__cta").each(function(i) {
        $(this).parent().find("button.track__item--button").attr("onclick", `clicky(${i + 1})`);
        $(this).remove();
    });
}

window.addEventListener('load', function() {
    main();
}, false);