/* ================= НАСТРОЙКИ МЕНЮ ================= */
const menuConfig = [
    {
        id: 'search',
        type: 'action',
        icon: 'fas fa-search',
        label: 'Поиск'
    },
    {
        id: 'telegram',
        type: 'link',
        icon: 'fab fa-telegram-plane',
        href: 'https://t.me/SolvexIT_public_links',
        label: 'Telegram'
    },
    {
        id: 'info',
        type: 'link',
        icon: 'fas fa-info',
        href: 'https://teletype.in/@solvex/SolvexIT',
        label: 'Инфо'
    }
];

/* ================= ЛОГИКА ================= */

const orbitMenu = document.getElementById('orbitMenu');
const ringArea = document.getElementById('ringArea');
const mainToggle = document.getElementById('mainToggle');
const mainLogoImg = document.getElementById('mainLogoImg');

// SPA Elements
const headerBg = document.getElementById('headerBg');
const headerContent = document.getElementById('headerContent');
const randomFactEl = document.getElementById('randomFact');
const searchResultsContainer = document.getElementById('searchResultsContainer');
const tagFilters = document.getElementById('tag-filters');

let isMenuOpen = false;
let currentLevel = 'root';
let historyStack = [];

// --- ФАКТЫ И РОТАЦИЯ ---
const FACT_URL = 'https://gist.githubusercontent.com/SolvexIT/98cac512e240657220e5fde866a392ad/raw';
let factInterval;
let factsCache = [];

async function fetchFact() {
    try {
        if (factsCache.length === 0) {
            const response = await fetch(FACT_URL);
            factsCache = await response.json();
        }

        if (Array.isArray(factsCache) && factsCache.length > 0) {
            const randomIndex = Math.floor(Math.random() * factsCache.length);
            const text = factsCache[randomIndex].text;

            // Анимация смены текста
            randomFactEl.style.opacity = 0;
            randomFactEl.classList.remove('scroll-active'); // Reset scroll

            setTimeout(() => {
                randomFactEl.innerHTML = `<span>${text}</span>`;
                randomFactEl.style.opacity = 1;

                // Desktop Scroll Logic if text is long
                if (window.innerWidth > 768 && text.length > 60) {
                    randomFactEl.classList.add('scroll-active');
                }
            }, 600);
        }
    } catch (e) {
        console.error("Ошибка фактов:", e);
        randomFactEl.textContent = "Ошибка загрузки факта.";
    }
}

function startFactRotation() {
    fetchFact();
    stopFactRotation();
    factInterval = setInterval(fetchFact, 25000); // 25 seconds
}

function stopFactRotation() {
    if (factInterval) clearInterval(factInterval);
    randomFactEl.style.opacity = 0;
}


// --- МЕНЮ (ORBIT) ---
function renderItems(items) {
    ringArea.innerHTML = '';
    const count = items.length;
    const step = 360 / count;

    items.forEach((item, index) => {
        const el = document.createElement('a');
        el.className = 'orbit-item';
        el.style.setProperty('--angle', `${(index * step) - 90}deg`);
        el.style.transitionDelay = `${index * 0.05}s`;

        if (item.icon.includes('fa-')) {
            el.innerHTML = `<i class="${item.icon}"></i>`;
        } else {
            el.innerHTML = `<img src="${item.icon}" style="width:60%;">`;
        }

        el.addEventListener('click', (e) => {
            e.preventDefault();
            if (item.id === 'search') {
                startSearchAnimation();
                return;
            }
            if (item.type === 'folder') {
                openFolder(item);
            } else {
                orbitMenu.classList.remove('active');
                isMenuOpen = false;
                setTimeout(() => {
                    if (item.href) {
                        if (item.href.startsWith('http')) window.open(item.href, '_blank');
                        else window.location.href = item.href;
                    }
                }, 500);
            }
        });
        ringArea.appendChild(el);
    });
}

function openFolder(folderItem) {
    orbitMenu.classList.remove('active');
    setTimeout(() => {
        historyStack.push(folderItem);
        renderItems(folderItem.items);
        orbitMenu.classList.add('active');
    }, 400);
}

function goBack() {
    orbitMenu.classList.remove('active');
    setTimeout(() => {
        historyStack.pop();
        if (historyStack.length === 0) {
            renderItems(menuConfig);
            currentLevel = 'root';
        } else {
            const prevFolder = historyStack[historyStack.length - 1];
            renderItems(prevFolder.items);
        }
        orbitMenu.classList.add('active');
    }, 400);
}

mainToggle.addEventListener('click', () => {
    // ЕСЛИ МЫ В РЕЖИМЕ ПОИСКА -> ВОЗВРАТ В МЕНЮ
    if (document.body.classList.contains('search-mode')) {
        returnToMenu();
        return;
    }

    if (historyStack.length > 0) {
        goBack();
    } else {
        if (!isMenuOpen) {
            renderItems(menuConfig);
            setTimeout(() => orbitMenu.classList.add('active'), 10);
            isMenuOpen = true;
        } else {
            orbitMenu.classList.remove('active');
            isMenuOpen = false;
        }
    }
});


// --- АНИМАЦИЯ ПЕРЕХОДА (SPA) ---
function startSearchAnimation(instant = false) {
    window.location.hash = 'search';
    startFactRotation();
    initSearchEngine();

    // 1. Убираем меню
    orbitMenu.classList.remove('active');
    isMenuOpen = false;
    document.body.classList.add('search-mode');

    // 2. Фиксируем позицию
    const rect = mainToggle.getBoundingClientRect();
    mainToggle.style.left = rect.left + 'px';
    mainToggle.style.top = rect.top + 'px';
    mainToggle.classList.add('logo-transitioning');

    if (instant) {
        mainToggle.classList.add('logo-phase-3');
        headerBg.classList.add('active');
        headerContent.classList.add('active');
        searchResultsContainer.classList.add('active');
        return;
    }

    void mainToggle.offsetWidth; // Reflow

    // 3. New Sequence:
    // Move slightly up (Phase 1)
    setTimeout(() => mainToggle.classList.add('logo-phase-1'), 50);

    // Move to corner (Phase 3)
    setTimeout(() => mainToggle.classList.add('logo-phase-3'), 400);

    // Header Background Descends
    setTimeout(() => headerBg.classList.add('active'), 600);

    // Content Appears
    setTimeout(() => {
        headerContent.classList.add('active');
        searchResultsContainer.classList.add('active');
    }, 900);
}

function returnToMenu() {
    window.location.hash = '';
    stopFactRotation();
    document.body.classList.remove('search-mode');

    // Blur Input & Reset
    const input = document.getElementById('searchInput');
    if(input) input.blur();

    // 1. Hide Content First
    headerContent.classList.remove('active');
    searchResultsContainer.classList.remove('active');
    tagFilters.classList.remove('active'); // Close tags if open

    // 2. Hide Header BG
    setTimeout(() => {
        headerBg.classList.remove('active');
    }, 400);

    // 3. Return Logo to Center
    setTimeout(() => {
        mainToggle.classList.remove('logo-phase-3');
        mainToggle.classList.remove('logo-phase-1');
    }, 600);

    // 4. Clean up styles after it arrives
    setTimeout(() => {
        mainToggle.classList.remove('logo-transitioning');
        mainToggle.style.left = '';
        mainToggle.style.top = '';
        mainToggle.style.transform = '';

        renderItems(menuConfig);
        setTimeout(() => {
            orbitMenu.classList.add('active');
            isMenuOpen = true;
        }, 50);
    }, 1400);
}


// --- ПОИСКОВОЙ ДВИЖОК ---
let searchInitialized = false;

function initSearchEngine() {
    if (searchInitialized) return;

    const searchInput = document.getElementById('searchInput');
    const resultsArea = document.getElementById('results-area');
    const toggleTagsBtn = document.getElementById('toggleTagsBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    // Listeners for Buttons
    toggleTagsBtn.onclick = () => tagFilters.classList.toggle('active');
    clearSearchBtn.onclick = () => {
        searchInput.value = '';
        filterAndRender();
        searchInput.focus();
    };

    let db = [];
    let selectedTags = new Set();
    let currentFilteredItems = [];
    let itemsToShow = 5;
    const loadMoreStep = 10;

    // Загрузка БД
    fetch('https://gist.githubusercontent.com/SolvexIT/6c9d9ebc89835f8812cfb66d18268324/raw')
        .then(res => res.json())
        .then(data => {
            db = data;
            createTagFilters(db);
            filterAndRender(false);
        })
        .catch(err => console.error("DB Error:", err));

    // Debounce
    let timeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(filterAndRender, 300);
    });

    function filterAndRender(reset = true) {
        const query = searchInput.value.toLowerCase().trim();

        currentFilteredItems = db.filter(item => {
            if (selectedTags.size > 0) {
                const itemTags = item.tags.split(',').map(t => t.trim());
                if (!Array.from(selectedTags).some(tag => itemTags.includes(tag))) return false;
            }
            if (!query && selectedTags.size === 0) return true;

            const inName = item.name.toLowerCase().includes(query);
            const inTags = item.tags.toLowerCase().includes(query);
            const inDesc = item.description ? item.description.toLowerCase().includes(query) : false;
            return inName || inTags || inDesc;
        });

        if (reset) itemsToShow = loadMoreStep;
        renderResults();
    }

    function renderResults() {
        resultsArea.innerHTML = '';
        if (currentFilteredItems.length === 0) {
            resultsArea.innerHTML = '<div class="no-results" style="color:#aaa; text-align:center; white-space: pre-line;">Ничего не найдено...\nНапишите нам в <a href="https://teletype.in/@solvex/support" target="_blank" style="color:#58A6FF;">поддержку</a>!</div>';
            return;
        }

        currentFilteredItems.slice(0, itemsToShow).forEach(item => {
            const card = document.createElement('a');
            card.className = 'result-card';
            card.href = item.link;
            if(item.link.startsWith('http')) card.target = "_blank";

            const tagsHtml = item.tags.split(',').map(tag => `<span class="tag_container">#${tag.trim()}</span>`).join(' ');
            card.innerHTML = `
                <span class="result-title">${item.name}</span>
                <span class="result-link">${item.link}</span>
                <div class="result-description">${item.description || ''}</div>
                <div class="result-tags">${tagsHtml}</div>
            `;
            card.style.animation = "fadeIn 0.5s ease";
            resultsArea.appendChild(card);
        });

        if (currentFilteredItems.length > itemsToShow) {
            const btn = document.createElement('button');
            btn.className = 'load-more-btn';
            btn.textContent = 'Показать ещё';
            btn.onclick = () => { itemsToShow += loadMoreStep; renderResults(); };
            resultsArea.appendChild(btn);
        }
    }

    function createTagFilters(data) {
        const allTags = new Set();
        data.forEach(item => item.tags.split(',').forEach(tag => allTags.add(tag.trim())));
        const sortedTags = Array.from(allTags).sort();

        // Populate the container in the header
        tagFilters.innerHTML = `
            <input type="text" id="tagSearchInput" class="tag-search-input" placeholder="Фильтр..." style="width:100%; margin-bottom:10px; background:#1e1e1e; border:1px solid #444; color:white; padding:5px; border-radius:4px;">
            <div id="available-tags" class="available-tags" style="max-height:150px; overflow-y:auto;"></div>
            <div id="selected-tags" class="selected-tags"></div>
            <button class="clear-tags-btn" id="clearTagsBtn">Сбросить все теги</button>
        `;

        const tagInput = document.getElementById('tagSearchInput');
        const availDiv = document.getElementById('available-tags');
        const selDiv = document.getElementById('selected-tags');
        const clearBtn = document.getElementById('clearTagsBtn');

        clearBtn.onclick = () => {
            selectedTags.clear();
            updateUI();
            filterAndRender();
        };

        function updateUI() {
            selDiv.innerHTML = '';
            selectedTags.forEach(tag => {
                const sp = document.createElement('span');
                sp.className = 'tag_container selected-tag';
                sp.style.display = 'inline-block';
                sp.style.margin = '2px';
                sp.innerHTML = `#${tag} <span style="cursor:pointer; margin-left:5px; color:#ff6b6b;">&times;</span>`;
                sp.querySelector('span').onclick = () => { selectedTags.delete(tag); updateUI(); filterAndRender(); };
                selDiv.appendChild(sp);
            });

            availDiv.innerHTML = '';
            const filter = tagInput.value.toLowerCase();
            const visible = sortedTags.filter(t => t.toLowerCase().includes(filter) && !selectedTags.has(t));

            visible.forEach(tag => {
                const a = document.createElement('a');
                a.className = 'tag_container available-tag';
                a.textContent = `#${tag}`;
                a.href = '#';
                a.style.display = 'inline-block';
                a.style.margin = '2px';
                a.onclick = (e) => { e.preventDefault(); selectedTags.add(tag); updateUI(); filterAndRender(); };
                availDiv.appendChild(a);
            });
        }

        tagInput.addEventListener('input', updateUI);
        updateUI();
    }

    if (!document.getElementById('dynamic-styles')) {
        const s = document.createElement("style");
        s.id = 'dynamic-styles';
        s.innerText = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
        document.head.appendChild(s);
    }

    searchInitialized = true;
}

// --- MUSIC PLAYER LOGIC ---
const musicPlayer = document.getElementById('musicPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const volumeSlider = document.getElementById('volumeSlider');
const bgMusic = document.getElementById('bgMusic');

if(playPauseBtn && bgMusic) {
    // Load volume
    const savedVol = localStorage.getItem('musicVolume');
    if(savedVol !== null) {
        bgMusic.volume = parseFloat(savedVol);
        volumeSlider.value = savedVol;
    } else {
        bgMusic.volume = 0.2; // Default quiet
    }

    playPauseBtn.addEventListener('click', () => {
        if(bgMusic.paused) {
            bgMusic.play();
            playPauseBtn.classList.remove('fa-music');
            playPauseBtn.classList.add('fa-pause');
            // Adding a spin animation class if desired
        } else {
            bgMusic.pause();
            playPauseBtn.classList.remove('fa-pause');
            playPauseBtn.classList.add('fa-music');
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        bgMusic.volume = e.target.value;
        localStorage.setItem('musicVolume', e.target.value);
    });
}


// --- INITIALIZATION ---
window.addEventListener('load', () => {
    if (window.location.hash === '#search') {
        startSearchAnimation(true);
    } else {
        if (!isMenuOpen) {
            renderItems(menuConfig);
            setTimeout(() => orbitMenu.classList.add('active'), 100);
            isMenuOpen = true;
        }
    }
});