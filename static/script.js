const typeTimeout = 80;
const typeTimeoutInconsistency = 40;
const volume = 1;
const playbackSpeed = 1.2;
const loadTimeout = 3000;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const gainNode = audioCtx.createGain();
gainNode.gain.value = volume;
gainNode.connect(audioCtx.destination);

const soundFiles = [
    "../static/assets/typingSound1.mp3",
    "../static/assets/typingSound2.mp3",
    "../static/assets/typingSound3.mp3",
    "../static/assets/typingSound4.mp3"
];
const carriageReturnFile = "..static/assets/typewriterCarriageReturn.mp3";

let typeBuffers = [];
let carriageReturnBuffer = null;

// Hilfsfunktion zum Vorladen & Dekodieren in den RAM
async function loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
}

// Alle Sounds beim Start einmalig in den Arbeitsspeicher laden
async function initSounds() {
    typeBuffers = await Promise.all(soundFiles.map(url => loadSound(url)));
    carriageReturnBuffer = await loadSound(carriageReturnFile);
}

initSounds();

// Verzögerungsfreies Abspielen aus dem Speicher
function playBuffer(buffer, startTime = 0) {
    if (!buffer) return;

    // Browser-Autoplay-Sperre nach erstem Klick aufheben
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackSpeed;
    source.connect(gainNode);
    source.start(0, startTime); // Startet sofort (0) ab Position startTime
}

function writeText(element, text, onComplete) {
    element.textContent = "";
    let index = 0;

    function type() {
        if (index < text.length) {
            const currentChar = text[index];
            element.textContent += currentChar;

            // Bei Zeilenumbruch Carriage-Return
            if (currentChar === "\n") {
                playBuffer(carriageReturnBuffer);
                index++;
                type();
            } else if (currentChar !== " " && currentChar !== "." && currentChar !== "," && currentChar !== "!" && currentChar !== "?") {
                const randomIndex = Math.floor(Math.random() * typeBuffers.length);
                playBuffer(typeBuffers[randomIndex]);
                index++;
                setTimeout(type, typeTimeout + Math.random() * typeTimeoutInconsistency);
            // Bei Satzzeichen etwas längere Pause
            } else if(currentChar !== " ") {
                const randomIndex = Math.floor(Math.random() * typeBuffers.length);
                playBuffer(typeBuffers[randomIndex]);
                index++;
                setTimeout(type, 3 * typeTimeout + Math.random() * typeTimeoutInconsistency);
            // Bei Whitespace kein Sound
            } else {
                index++;
                setTimeout(type, typeTimeout + Math.random() * typeTimeoutInconsistency);
            }

        } else {
            if (onComplete) onComplete();
        }
    }
    type();
}