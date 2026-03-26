let allForecasts = {};
let currentMode = 'visual';
let currentSign = 'Aries';

const body = document.body;
const visualBtn = document.getElementById('visual-btn');
const firBtn = document.getElementById('fir-btn');
const radioBtn = document.getElementById('radio-btn');
const forecastText = document.getElementById('forecast-text');
const coordInfo = document.getElementById('coord-info');
const signalInfo = document.getElementById('signal-info');
const starsContainer = document.getElementById('stars-container');
const zodiacDropdown = document.getElementById('zodiac-dropdown');
const spectrumMarker = document.getElementById('spectrum-marker');
const wavelengthRange = document.getElementById('wavelength-range');
const sedCurve = document.getElementById('sed-curve');

// Forecast Elements
const forecastDateEl = document.getElementById('forecast-date');

// Modal Elements
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeBtn = document.querySelector('.close-btn');

async function init() {
    try {
        const response = await fetch('forecasts.json');
        allForecasts = await response.json();
        createStars();
        updateForecast();
        setupZodiacEvents();
    } catch (err) {
        console.error("Failed to load forecasts:", err);
        forecastText.textContent = "Error loading cosmic data. Please ensure forecasts.json is present.";
    }
}

function setupZodiacEvents() {
    zodiacDropdown.addEventListener('change', (e) => {
        currentSign = e.target.value;
        updateForecast();
        // Track zodiac sign selection
        if (typeof gtag === 'function') {
            gtag('event', 'select_zodiac', {
                'sign': currentSign
            });
        }
    });

    // Modal Logic
    helpBtn.addEventListener('click', () => helpModal.classList.remove('hidden'));
    closeBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });
}

function createStars() {
    starsContainer.innerHTML = '';
    for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.position = 'absolute';
        star.style.width = Math.random() * 2 + 'px';
        star.style.height = star.style.width;
        star.style.background = '#fff';
        star.style.borderRadius = '50%';
        star.style.top = Math.random() * 100 + '%';
        star.style.left = Math.random() * 100 + '%';
        star.style.opacity = Math.random();
        star.style.filter = `blur(${Math.random()}px)`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        starsContainer.appendChild(star);
    }
}

function updateForecast() {
    const wavelength = currentMode;
    const modeNames = {
        'visual': 'Visual',
        'far_infrared': 'Far-Infrared',
        'radio': 'Radio'
    };

    const ranges = {
        'visual': 'λ: 400 - 700 nm',
        'far_infrared': 'λ: 25 - 350 μm',
        'radio': 'λ: 1 mm - 100 m'
    };

    const markerPercents = {
        'visual': 0.15,
        'far_infrared': 0.55,
        'radio': 0.95
    };

    // Set the date heading (e.g., "Visual Forecast: 26 March")
    const today = new Date();
    const dateOptions = { day: 'numeric', month: 'long' };
    forecastDateEl.textContent = `${modeNames[wavelength]} Forecast: ${today.toLocaleDateString('en-GB', dateOptions)}`;

    // Update UI Elements
    wavelengthRange.textContent = ranges[wavelength];
    
    if (sedCurve && spectrumMarker) {
        const totalLength = sedCurve.getTotalLength();
        const point = sedCurve.getPointAtLength(totalLength * markerPercents[wavelength]);
        // Set SVG attributes directly
        spectrumMarker.setAttribute('cx', point.x);
        spectrumMarker.setAttribute('cy', point.y);
    }

    const signData = allForecasts[currentSign];
    if (!signData) return;

    const list = signData[wavelength];

    // Create a robust hash based on the exact date, the wavelength, AND the selected sign
    // This ensures variety across the different wavelengths and signs on the same day.
    const hashStr = today.toDateString() + wavelength + currentSign;
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
        hash = (hash << 5) - hash + hashStr.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    
    // Use modulo to safely select an item index based on the hash
    const index = Math.abs(hash) % list.length;
    const item = list[index];
    
    forecastText.textContent = item.text;
    coordInfo.textContent = `RA: ${item.ra} | DEC: ${item.dec}`;
    signalInfo.textContent = `SNR: ${item.snr}`;
    
    manageEffects();
}

function manageEffects() {
    let interf = document.querySelector('.interference');
    if (currentMode === 'radio') {
        if (!interf) {
            interf = document.createElement('div');
            interf.className = 'interference';
            document.getElementById('main-card').appendChild(interf);
        }
    } else {
        if (interf) interf.remove();
    }
}

function setMode(mode) {
    currentMode = mode;
    body.classList.remove('visual-mode', 'fir-mode', 'radio-mode');
    visualBtn.classList.remove('active');
    firBtn.classList.remove('active');
    radioBtn.classList.remove('active');

    if (mode === 'visual') {
        body.classList.add('visual-mode');
        visualBtn.classList.add('active');
    } else if (mode === 'far_infrared') {
        body.classList.add('fir-mode');
        firBtn.classList.add('active');
    } else {
        body.classList.add('radio-mode');
        radioBtn.classList.add('active');
    }

    // Track wavelength mode change
    if (typeof gtag === 'function') {
        gtag('event', 'select_wavelength', {
            'mode': mode
        });
    }

    updateForecast();
}

visualBtn.addEventListener('click', () => setMode('visual'));
firBtn.addEventListener('click', () => setMode('far_infrared'));
radioBtn.addEventListener('click', () => setMode('radio'));

document.querySelector('.toggle-track').addEventListener('click', () => {
    if (currentMode === 'visual') setMode('far_infrared');
    else if (currentMode === 'far_infrared') setMode('radio');
    else setMode('visual');
});

init();
