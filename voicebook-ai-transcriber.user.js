// ==UserScript==
// @name         Voicebook AI Transcriber
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adds Download & AI Transcribe buttons. Sends audio to local Whisper endpoint.
// @author       chicco-carone
// @match        https://www.voicebook.cloud/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      voicebook.cloud
// ==/UserScript==

(function () {
  "use strict";

  function fixBootstrapError() {
    if (typeof window.bootstrap === "undefined") window.bootstrap = {};
    if (!window.bootstrap.Tooltip) window.bootstrap.Tooltip = {};
    if (!window.bootstrap.Tooltip.getInstance) {
      window.bootstrap.Tooltip.getInstance = function () {
        return null;
      };
    }
  }
  fixBootstrapError();
  setInterval(fixBootstrapError, 1000);

  setInterval(() => {
    addRealInput();
    addControlButtons();
  }, 1000);

  function addRealInput() {
    const container = document.querySelector("#input_frase");
    const targetDiv = document.querySelector(".input");

    if (!container || !targetDiv || document.getElementById("tm-real-input"))
      return;

    const realInput = document.createElement("input");
    realInput.id = "tm-real-input";
    realInput.type = "text";
    realInput.placeholder = "Type here or use AI...";
    realInput.autocomplete = "off";
    Object.assign(realInput.style, {
      width: "100%",
      marginTop: "10px",
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      fontSize: "16px",
    });

    realInput.addEventListener("input", () => {
      if (realInput.value === "") {
        targetDiv.innerHTML = "<br>";
      } else {
        targetDiv.innerText = realInput.value;
      }
      targetDiv.dispatchEvent(new Event("input", { bubbles: true }));
      targetDiv.dispatchEvent(new Event("change", { bubbles: true }));
      targetDiv.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    });

    const observer = new MutationObserver(() => {
      if (document.activeElement !== realInput) {
        realInput.value = targetDiv.innerText.trim();
      }
    });
    observer.observe(targetDiv, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    container.appendChild(realInput);
  }

  function addControlButtons() {
    const playBtn = document.querySelector("#play_frase");
    if (!playBtn || document.getElementById("tm-controls-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "tm-controls-wrapper";
    wrapper.style.display = "inline-flex";
    playBtn.parentNode.insertBefore(wrapper, playBtn.nextSibling);

    createButton(wrapper, "fa-download", "#007bff", "Download Audio", () => {
      const url = getAudioUrl();
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.download = url.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    const aiBtn = createButton(
      wrapper,
      "fa-magic",
      "#8e44ad",
      "Transcribe with Local AI",
      async () => {
        const url = getAudioUrl();
        if (!url) {
          alert("No audio found!");
          return;
        }

        const icon = aiBtn.querySelector("i");
        icon.className = "fas fa-spinner fa-spin";

        try {
          const audioBlob = await fetch(url).then((r) => r.blob());

          const formData = new FormData();
          formData.append("file", audioBlob, "audio.mp3");
          formData.append("temperature", "0.0");
          formData.append("temperature_inc", "0.2");
          formData.append("response_format", "json");

          GM_xmlhttpRequest({
            method: "POST",
            url: "http://127.0.0.1:8080/inference",
            data: formData,
            onload: function (response) {
              try {
                const json = JSON.parse(response.responseText);
                if (json.text) {
                  const cleanText = json.text.replace(/[\r\n]+/g, " ").trim();

                  const input = document.getElementById("tm-real-input");
                  input.value = cleanText;
                  input.dispatchEvent(new Event("input"));
                } else {
                  alert("AI Response error: " + response.responseText);
                }
              } catch (e) {
                console.error(e);
                alert("Error parsing AI response");
              }
              icon.className = "fas fa-magic";
            },
            onerror: function (err) {
              console.error(err);
              alert(
                "Check if your local Whisper server is running at port 8080!",
              );
              icon.className = "fas fa-magic";
            },
          });
        } catch (err) {
          console.error(err);
          alert("Failed to fetch audio file.");
          icon.className = "fas fa-magic";
        }
      },
    );
  }

  function createButton(parent, iconClass, color, tooltip, onClick) {
    const btn = document.createElement("div");
    btn.className = "play_frase";
    Object.assign(btn.style, {
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: "10px",
      cursor: "pointer",
      color: "#fff",
      background: color,
      borderRadius: "50%",
      width: "50px",
      height: "50px",
    });
    btn.title = tooltip;
    btn.innerHTML = `<i class="fas ${iconClass}" style="font-size: 20px;"></i>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    parent.appendChild(btn);
    return btn;
  }

  function getAudioUrl() {
    const audioInput = document.querySelector("#audio_corrente");
    if (!audioInput || !audioInput.value) return null;
    return audioInput.value.startsWith("http")
      ? audioInput.value
      : "https://www.voicebook.cloud" + audioInput.value;
  }
})();