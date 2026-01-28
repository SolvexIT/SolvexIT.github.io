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
        shouldPlay = 'true';
    }

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

    function playMusic() {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                localStorage.setItem(STATE_KEY, 'true');
                updateUI(true);
            }).catch(error => {
                console.log("Autoplay prevented:", error);
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

    // 1. Main Button: Toggle Menu
    mainMusicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        musicPlayerContainer.classList.toggle('expanded');
        // If closing, also close slider
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
        // Prevent closing when clicking slider
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
    bgMusic.addEventListener('timeupdate', () => {
        sessionStorage.setItem(TIME_KEY, bgMusic.currentTime);
    });

    bgMusic.addEventListener('ended', () => {
        if (!bgMusic.loop) updateUI(false);
    });

    // --- Auto-Play Logic ---
    if (shouldPlay === 'true') {
        playMusic();
    } else {
        updateUI(false);
    }

    // Fallback for autoplay policy
    const autoPlayFallback = () => {
        if (shouldPlay === 'true' && bgMusic.paused) {
            playMusic();
        }
        document.removeEventListener('click', autoPlayFallback);
        document.removeEventListener('keydown', autoPlayFallback);
    };

    document.addEventListener('click', autoPlayFallback);
    document.addEventListener('keydown', autoPlayFallback);
});
