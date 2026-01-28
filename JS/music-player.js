document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const musicPlayerContainer = document.getElementById('musicPlayer');
    const mainMusicBtn = document.getElementById('mainMusicBtn');
    const btnPlay = document.getElementById('btnPlay');
    const btnVol = document.getElementById('btnVol');
    const volSliderWrapper = document.getElementById('volSliderWrapper');
    const volumeSlider = document.getElementById('volumeSlider');
    const bgMusic = document.getElementById('bgMusic');

    if (!bgMusic || !mainMusicBtn) return;

    // --- Configuration ---
    const STATE_KEY = 'solvex_music_playing'; // Unique namespace
    const TIME_KEY = 'solvex_music_time';
    const VOL_KEY = 'solvex_music_volume';

    // --- Initialization ---

    // 1. Restore Volume
    const savedVol = localStorage.getItem(VOL_KEY);
    if (savedVol !== null) {
        bgMusic.volume = parseFloat(savedVol);
        if (volumeSlider) volumeSlider.value = savedVol;
    } else {
        bgMusic.volume = 0.1; // Default
    }

    // 2. Restore Time
    const savedTime = localStorage.getItem(TIME_KEY); // Changed to localStorage for cross-session resume
    if (savedTime) {
        bgMusic.currentTime = parseFloat(savedTime);
    }

    // 3. Determine Initial State
    // Default to 'true' (playing) if user hasn't visited before
    let shouldPlay = localStorage.getItem(STATE_KEY);
    if (shouldPlay === null) shouldPlay = 'true';

    // --- Functions ---

    function updateUI(isPlaying) {
        if (isPlaying) {
            mainMusicBtn.classList.add('spinning');
            if (btnPlay) {
                const icon = btnPlay.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-play');
                    icon.classList.add('fa-pause');
                }
            }
        } else {
            mainMusicBtn.classList.remove('spinning');
            if (btnPlay) {
                const icon = btnPlay.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
            }
        }
    }

    // Robust Play Function
    function attemptPlay() {
        const playPromise = bgMusic.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Success: Audio is playing
                    localStorage.setItem(STATE_KEY, 'true');
                    updateUI(true); 
                })
                .catch(error => {
                    console.log("Autoplay blocked by browser. Waiting for user interaction...");
                    updateUI(false); 
                    addInteractionTrigger();
                });
        }
    }

    function addInteractionTrigger() {
        const triggerAudio = () => {
            bgMusic.play().then(() => {
                // Success
                updateUI(true);
                document.removeEventListener('click', triggerAudio);
                document.removeEventListener('keydown', triggerAudio);
                document.removeEventListener('touchstart', triggerAudio);
            }).catch(e => {
                // Still failed? Keep listener attached.
                console.log("Interaction trigger failed (rare):", e);
            });
        };

        document.addEventListener('click', triggerAudio);
        document.addEventListener('keydown', triggerAudio);
        document.addEventListener('touchstart', triggerAudio); // Mobile support
    }

    function pauseMusic() {
        bgMusic.pause();
        localStorage.setItem(STATE_KEY, 'false');
        updateUI(false);
    }

    function toggleMusic() {
        if (bgMusic.paused) {
            attemptPlay();
            localStorage.setItem(STATE_KEY, 'true');
        } else {
            pauseMusic();
        }
    }

    // --- Event Listeners ---

    // 1. Main Button: Toggle Menu
    mainMusicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        musicPlayerContainer.classList.toggle('expanded');
        
        // Mobile UX: If menu is opened, ensure slider is visible or handled
        if (!musicPlayerContainer.classList.contains('expanded')) {
            volSliderWrapper.classList.remove('visible');
        }
    });

    // 2. Play Button: Toggle Music
    if (btnPlay) {
        btnPlay.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMusic();
        });
    }

    // 3. Volume Button: Toggle Slider
    if (btnVol) {
        btnVol.addEventListener('click', (e) => {
            e.stopPropagation();
            volSliderWrapper.classList.toggle('visible');
        });
    }

    // 4. Slider Input
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            bgMusic.volume = e.target.value;
            localStorage.setItem(VOL_KEY, e.target.value);
        });
        volumeSlider.addEventListener('click', (e) => e.stopPropagation());
        volSliderWrapper.addEventListener('click', (e) => e.stopPropagation());
    }

    // 5. Global: Close on outside click
    document.addEventListener('click', (e) => {
        if (!musicPlayerContainer.contains(e.target)) {
            musicPlayerContainer.classList.remove('expanded');
            volSliderWrapper.classList.remove('visible');
        }
    });

    // 6. Audio Events
    // Save time frequently
    bgMusic.addEventListener('timeupdate', () => {
        // Save every second roughly to avoid thrashing, or just on unload
        if (Math.floor(bgMusic.currentTime) % 5 === 0) {
            localStorage.setItem(TIME_KEY, bgMusic.currentTime);
        }
    });
    
    // Save on pause/unload
    window.addEventListener('beforeunload', () => {
        localStorage.setItem(TIME_KEY, bgMusic.currentTime);
    });

    bgMusic.addEventListener('ended', () => {
        if (!bgMusic.loop) {
            updateUI(false);
            localStorage.setItem(STATE_KEY, 'false');
        }
    });

    // --- Start Logic ---
    if (shouldPlay === 'true') {
        attemptPlay();
    } else {
        updateUI(false);
    }
});