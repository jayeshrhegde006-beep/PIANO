const pianoContainer = document.getElementById('piano');
const octaveDisplay = document.getElementById('current-octave');
const pedalIndicator = document.getElementById('pedal-indicator');
const instrumentSelect = document.getElementById('instrument-select');
const volumeSlider = document.getElementById('volume-slider');
const startOverlay = document.getElementById('start-overlay');
const startBtn = document.getElementById('start-btn');

let currentOctave = 4;
let isPedalDown = false;
let activeNotes = new Map();

// Initialize Tone.js PolySynth
const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
}).toDestination();

// Keyboard Mappings (Matching original Java project)
const keyMap = {
    // Octave 1
    'z': 'C', 's': 'C#', 'x': 'D', 'd': 'D#', 'c': 'E', 'v': 'F', 'g': 'F#', 'b': 'G', 'h': 'G#', 'n': 'A', 'j': 'A#', 'm': 'B',
    // Octave 2
    'q': 'C', '2': 'C#', 'w': 'D', '3': 'D#', 'e': 'E', 'r': 'F', '5': 'F#', 't': 'G', '6': 'G#', 'y': 'A', '7': 'A#', 'u': 'B',
    // Octave 3 (Partial)
    'i': 'C', '9': 'C#', 'o': 'D', '0': 'D#', 'p': 'E', '[': 'F', '=': 'F#', ']': 'G'
};

const keys = [
    { note: "C", type: "white" }, { note: "C#", type: "black" },
    { note: "D", type: "white" }, { note: "D#", type: "black" },
    { note: "E", type: "white" },
    { note: "F", type: "white" }, { note: "F#", type: "black" },
    { note: "G", type: "white" }, { note: "G#", type: "black" },
    { note: "A", type: "white" }, { note: "A#", type: "black" },
    { note: "B", type: "white" }
];

// Generate Piano UI (3 octaves like original)
function createPiano() {
    pianoContainer.innerHTML = '';
    for (let oct = 0; oct < 3; oct++) {
        keys.forEach(k => {
            const keyEl = document.createElement('div');
            const noteName = `${k.note}${currentOctave + oct}`;
            keyEl.className = `key ${k.type}`;
            keyEl.dataset.note = noteName;

            keyEl.addEventListener('mousedown', () => playNote(noteName));
            keyEl.addEventListener('mouseup', () => stopNote(noteName));
            keyEl.addEventListener('mouseleave', () => stopNote(noteName));

            pianoContainer.appendChild(keyEl);
        });
    }
}

function playNote(note) {
    if (activeNotes.has(note)) return;

    // Visual feedback
    const el = document.querySelector(`[data-note="${note}"]`);
    if (el) el.classList.add('active');

    synth.triggerAttack(note);
    activeNotes.set(note, true);
}

function stopNote(note) {
    if (!activeNotes.has(note)) return;

    const el = document.querySelector(`[data-note="${note}"]`);
    if (el) el.classList.remove('active');

    if (!isPedalDown) {
        synth.triggerRelease(note);
    }
    activeNotes.delete(note);
}

// Global controls
document.getElementById('octave-up').onclick = () => {
    if (currentOctave < 7) {
        currentOctave++;
        updateOctaveDisplay();
        createPiano();
    }
};

document.getElementById('octave-down').onclick = () => {
    if (currentOctave > 1) {
        currentOctave--;
        updateOctaveDisplay();
        createPiano();
    }
};

function updateOctaveDisplay() {
    octaveDisplay.innerText = `C${currentOctave}`;
}

volumeSlider.oninput = (e) => {
    Tone.Destination.volume.value = e.target.value;
};

instrumentSelect.onchange = (e) => {
    const val = e.target.value;
    const settings = {
        piano: { oscillator: { type: "triangle" }, envelope: { attack: 0.05, sustain: 0.3, release: 1 } },
        neon: { oscillator: { type: "sawtooth" }, envelope: { attack: 0.02, sustain: 0.5, release: 0.8 } },
        organ: { oscillator: { type: "square" }, envelope: { attack: 0.1, sustain: 1, release: 0.5 } },
        pad: { oscillator: { type: "sine" }, envelope: { attack: 0.8, sustain: 0.8, release: 2 } },
        electric: { oscillator: { type: "fmsine" }, envelope: { attack: 0.01, sustain: 0.4, release: 1.2 } },
        vintage: { oscillator: { type: "pwm" }, envelope: { attack: 0.05, sustain: 0.6, release: 0.6 } },
        cyber: { oscillator: { type: "fatsawtooth" }, envelope: { attack: 0.02, sustain: 0.4, release: 0.4 } },
        stardust: { oscillator: { type: "pulse" }, envelope: { attack: 0.1, sustain: 0.2, release: 3 } },
        toxic: { oscillator: { type: "fmsawtooth" }, envelope: { attack: 0.05, sustain: 1, release: 0.2 } },
        deepspace: { oscillator: { type: "sine" }, envelope: { attack: 1.5, sustain: 1, release: 4 } },
        hero: { oscillator: { type: "square" }, envelope: { attack: 0, sustain: 0.1, release: 0.1 } },
        bell: { oscillator: { type: "amtriangle" }, envelope: { attack: 0.01, sustain: 0, release: 4 } },
        metal: { oscillator: { type: "fatsquare" }, envelope: { attack: 0.01, sustain: 1, release: 0.1 } },
        hyper: { oscillator: { type: "sawtooth8" }, envelope: { attack: 0.05, sustain: 0.5, release: 0.5 } }
    };

    if (settings[val]) {
        synth.set(settings[val]);
    }
};

// Keyboard Interaction
window.addEventListener('keydown', (e) => {
    if (e.repeat) return;

    const key = e.key.toLowerCase();

    // Pedal (Spacebar)
    if (key === ' ') {
        isPedalDown = true;
        pedalIndicator.classList.add('on');
        e.preventDefault();
        return;
    }

    if (keyMap[key]) {
        // Calculate octave offset based on key row
        let octaveOffset = 0;
        if ('qwertyuiop[]='.includes(key) || '2356790'.includes(key)) octaveOffset = 1;
        if ('i9o0p[]='.includes(key) && !'qwert'.includes(key)) octaveOffset = 2; // Rough mapping for overflow

        const note = keyMap[key] + (currentOctave + octaveOffset);
        playNote(note);
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();

    if (key === ' ') {
        isPedalDown = false;
        pedalIndicator.classList.remove('on');
        // Release all notes that aren't physically held down
        activeNotes.forEach((_, note) => {
            // If we wanted to be strict we'd track physical vs pedal hold
            // but for simplicity:
        });
        synth.releaseAll();
        return;
    }

    if (keyMap[key]) {
        let octaveOffset = 0;
        if ('qwertyuiop[]='.includes(key) || '2356790'.includes(key)) octaveOffset = 1;
        const note = keyMap[key] + (currentOctave + octaveOffset);
        stopNote(note);
    }
});

// Start Audio System
startBtn.addEventListener('click', async () => {
    await Tone.start();
    startOverlay.style.opacity = '0';
    setTimeout(() => startOverlay.style.display = 'none', 500);
});

// Init
updateOctaveDisplay();
createPiano();
Tone.Destination.volume.value = -12;
