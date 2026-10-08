// src/js/sounds.js
const SOUND_FILES = {
    success: './sounds/success.mp3',
    error: './sounds/error.mp3',
    cart: './sounds/cart.mp3',
    sync: './sounds/sync.mp3'
};

const audioCache = new Map();

function getAudio(name) {
    if (!SOUND_FILES[name]) return null;
    if (!audioCache.has(name)) {
        const audio = new Audio(SOUND_FILES[name]);
        audio.preload = 'auto';
        audioCache.set(name, audio);
    }
    return audioCache.get(name);
}

function playSound(name) {
    const audio = getAudio(name);
    if (!audio) return;
    try {
        audio.pause();
        audio.currentTime = 0;
        const promise = audio.play();
        if (promise && typeof promise.catch === 'function') {
            promise.catch(() => {});
        }
    } catch (error) {
        console.warn(`Could not play sound: ${name}`, error);
    }
}

// ====== تصدير الكائن الافتراضي ======
const sounds = {
    play: playSound
};

// دعم للكود القديم
window.playSound = playSound;

export default sounds;
export { playSound };