document.addEventListener('DOMContentLoaded', () => {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const bgMusic = document.getElementById('bgMusic');
    const volumeSlider = document.getElementById('volumeSlider'); // Keep volume logic if present

    if (!bgMusic || !playPauseBtn) return;

    // --- Configuration ---
    const STATE_KEY = 'musicPlaying';
    const TIME_KEY = 'musicCurrentTime';
    const VOL_KEY = 'musicVolume';

    // --- Initialization ---

    // 1. Restore Volume
    const savedVol = localStorage.getItem(VOL_KEY);
    if (savedVol !== null) {
        bgMusic.volume = parseFloat(savedVol);
        if (volumeSlider) volumeSlider.value = savedVol;
    } else {
        bgMusic.volume = 0.2; // Default
    }

    // 2. Restore Time
    const savedTime = sessionStorage.getItem(TIME_KEY);
    if (savedTime) {
        bgMusic.currentTime = parseFloat(savedTime);
    }

    // 3. Determine Initial State (Default to TRUE if null)
    let shouldPlay = localStorage.getItem(STATE_KEY);
    if (shouldPlay === null) {
        shouldPlay = 'true'; // Default on
    }

    // --- Functions ---

    function updateUI(isPlaying) {
        if (isPlaying) {
            playPauseBtn.classList.add('spinning');
            // Ensure icon is music note (if we want to toggle icon we can, but user asked for spinning music icon)
            playPauseBtn.classList.remove('fa-pause');
            playPauseBtn.classList.add('fa-music'); 
        } else {
            playPauseBtn.classList.remove('spinning');
        }
    }

    function playMusic() {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Play success
                localStorage.setItem(STATE_KEY, 'true');
                updateUI(true);
            }).catch(error => {
                console.log("Autoplay prevented or failed:", error);
                // If failed (e.g. browser policy), we show paused state
                // But we keep the intent to play if user interacts?
                updateUI(false); 
            });
        }
    }

    function pauseMusic() {
        bgMusic.pause();
        localStorage.setItem(STATE_KEY, 'false');
        updateUI(false);
    }

    function toggleMusic() {
        if (bgMusic.paused) {
            playMusic();
        } else {
            pauseMusic();
        }
    }

    // --- Event Listeners ---

    // Toggle on icon click
    playPauseBtn.addEventListener('click', (e) => {
        // Prevent bubbling if button is inside another clickable
        e.stopPropagation();
        toggleMusic();
    });

    // Volume Slider
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            bgMusic.volume = e.target.value;
            localStorage.setItem(VOL_KEY, e.target.value);
        });
        // Prevent click on slider from toggling music if nested
        volumeSlider.addEventListener('click', (e) => e.stopPropagation());
    }

    // Save time continuously
    bgMusic.addEventListener('timeupdate', () => {
        sessionStorage.setItem(TIME_KEY, bgMusic.currentTime);
    });

    // Handle "Ended" (Loop is set in HTML, but just in case)
    bgMusic.addEventListener('ended', () => {
        if (bgMusic.loop) return; 
        // If not looping, maybe update UI?
    });

    // --- Auto-Play Logic ---
    if (shouldPlay === 'true') {
        playMusic();
    } else {
        updateUI(false);
    }
    
    // Global click fallback for autoplay policy
    // If the user wants it to turn on "by itself" and browser blocks it, 
    // we can try to start it on the very first interaction with the page 
    // IF the preference is true and it's currently paused.
    const autoPlayFallback = () => {
        if (shouldPlay === 'true' && bgMusic.paused) {
            playMusic();
        }
        // Remove listener after first interaction
        document.removeEventListener('click', autoPlayFallback);
        document.removeEventListener('keydown', autoPlayFallback);
    };

    document.addEventListener('click', autoPlayFallback);
    document.addEventListener('keydown', autoPlayFallback);
});
