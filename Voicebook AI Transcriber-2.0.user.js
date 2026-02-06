// ==UserScript==
// @name         Voicebook AI Transcriber
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds Download & AI Transcribe buttons. Sends audio to local Whisper endpoint.
// @author       You
// @match        https://www.voicebook.cloud/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      voicebook.cloud
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. Bootstrap Crash Fix ---
    function fixBootstrapError() {
        if (typeof window.bootstrap === 'undefined') window.bootstrap = {};
        if (!window.bootstrap.Tooltip) window.bootstrap.Tooltip = {};
        if (!window.bootstrap.Tooltip.getInstance) {
            window.bootstrap.Tooltip.getInstance = function() { return null; };
        }
    }
    fixBootstrapError();
    setInterval(fixBootstrapError, 1000);

    // --- 2. Main Loop ---
    setInterval(() => {
        addRealInput();
        addControlButtons();
    }, 1000);

    // --- 3. Syncable Input Logic ---
    function addRealInput() {
        const container = document.querySelector('#input_frase');
        const targetDiv = document.querySelector('.input');

        if (!container || !targetDiv || document.getElementById('tm-real-input')) return;

        const realInput = document.createElement('input');
        realInput.id = 'tm-real-input';
        realInput.type = 'text';
        realInput.placeholder = 'Type here or use AI...';
        realInput.autocomplete = 'off';
        Object.assign(realInput.style, {
            width: '100%', marginTop: '10px', padding: '10px',
            borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px'
        });

        // Sync changes from Real Input -> Site Div
        realInput.addEventListener('input', () => {
            if (realInput.value === '') {
                targetDiv.innerHTML = '<br>'; // Required for empty contenteditable
            } else {
                targetDiv.innerText = realInput.value;
            }
            // Trigger events for site validation
            targetDiv.dispatchEvent(new Event('input', { bubbles: true }));
            targetDiv.dispatchEvent(new Event('change', { bubbles: true }));
            targetDiv.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        });

        // Sync changes from Site Div -> Real Input (e.g. if you click "Show Solution")
        const observer = new MutationObserver(() => {
            if (document.activeElement !== realInput) {
               realInput.value = targetDiv.innerText.trim();
            }
        });
        observer.observe(targetDiv, { childList: true, subtree: true, characterData: true });

        container.appendChild(realInput);
    }

    // --- 4. Button Logic ---
    function addControlButtons() {
        const playBtn = document.querySelector('#play_frase');
        if (!playBtn || document.getElementById('tm-controls-wrapper')) return;

        // Create a wrapper to hold our buttons nicely
        const wrapper = document.createElement('div');
        wrapper.id = 'tm-controls-wrapper';
        wrapper.style.display = 'inline-flex';
        playBtn.parentNode.insertBefore(wrapper, playBtn.nextSibling);

        // -- Download Button --
        createButton(wrapper, 'fa-download', '#007bff', 'Download Audio', () => {
            const url = getAudioUrl();
            if (!url) return;
            const link = document.createElement('a');
            link.href = url;
            link.download = url.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        // -- AI Transcribe Button --
        const aiBtn = createButton(wrapper, 'fa-magic', '#8e44ad', 'Transcribe with Local AI', async () => {
            const url = getAudioUrl();
            if (!url) {
                alert('No audio found!');
                return;
            }

            // Visual loading state
            const icon = aiBtn.querySelector('i');
            icon.className = 'fas fa-spinner fa-spin';

            try {
                // 1. Fetch the audio file as a Blob
                const audioBlob = await fetch(url).then(r => r.blob());

                // 2. Prepare FormData for Whisper
                const formData = new FormData();
                formData.append('file', audioBlob, 'audio.mp3');
                formData.append('temperature', '0.0');
                formData.append('temperature_inc', '0.2');
                formData.append('response_format', 'json');

                // 3. Send to Localhost using GM_xmlhttpRequest (bypasses Mixed Content/CORS)
                GM_xmlhttpRequest({
                    method: "POST",
                    url: "http://127.0.0.1:8080/inference",
                    data: formData,
                    onload: function(response) {
                        try {
                            const json = JSON.parse(response.responseText);
                            // Standard whisper.cpp/server returns { "text": "..." }
                            if (json.text) {
                                // Clean up text (remove newlines, extra spaces)
                                const cleanText = json.text.replace(/[\r\n]+/g, ' ').trim();

                                // Insert into input
                                const input = document.getElementById('tm-real-input');
                                input.value = cleanText;
                                input.dispatchEvent(new Event('input')); // Trigger sync
                            } else {
                                alert('AI Response error: ' + response.responseText);
                            }
                        } catch (e) {
                            console.error(e);
                            alert('Error parsing AI response');
                        }
                        icon.className = 'fas fa-magic'; // Reset icon
                    },
                    onerror: function(err) {
                        console.error(err);
                        alert('Check if your local Whisper server is running at port 8080!');
                        icon.className = 'fas fa-magic';
                    }
                });

            } catch (err) {
                console.error(err);
                alert('Failed to fetch audio file.');
                icon.className = 'fas fa-magic';
            }
        });
    }

    // Helper: Create styled buttons
    function createButton(parent, iconClass, color, tooltip, onClick) {
        const btn = document.createElement('div');
        btn.className = 'play_frase'; // Inherit site styling for size/shape
        Object.assign(btn.style, {
            display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
            marginLeft: '10px', cursor: 'pointer', color: '#fff',
            background: color, borderRadius: '50%', width: '50px', height: '50px'
        });
        btn.title = tooltip;
        btn.innerHTML = `<i class="fas ${iconClass}" style="font-size: 20px;"></i>`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent site from playing audio when clicking our buttons
            onClick();
        });
        parent.appendChild(btn);
        return btn;
    }

    // Helper: Get current audio URL
    function getAudioUrl() {
        const audioInput = document.querySelector('#audio_corrente');
        if (!audioInput || !audioInput.value) return null;
        return audioInput.value.startsWith('http')
            ? audioInput.value
            : 'https://www.voicebook.cloud' + audioInput.value;
    }

})();