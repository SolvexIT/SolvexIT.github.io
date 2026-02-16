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
const headerSearch = document.querySelector('.header-search');

// Back Button for Instruction Mode (Dynamic)
let headerBackBtn = null;

let isMenuOpen = false;
let currentLevel = 'root';
let historyStack = [];
let isTransitioning = false;
let isInternalRouteUpdate = false; 

// Timeouts for view transitions
let hideSearchTimeout = null;
let hideInstructionsTimeout = null;

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

            randomFactEl.style.opacity = 0;
            
            setTimeout(() => {
                randomFactEl.classList.remove('scroll-active');
                randomFactEl.innerHTML = `<span>${text}</span>`;
                randomFactEl.style.opacity = 1;

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
    factInterval = setInterval(fetchFact, 25000);
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
    if (isTransitioning) return;

    if (document.body.classList.contains('search-mode') || document.body.classList.contains('view-mode')) {
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
function switchView(viewName, instant = false) {
    orbitMenu.classList.remove('active');
    isMenuOpen = false;
    document.body.classList.add('view-mode');

    const rect = mainToggle.getBoundingClientRect();
    mainToggle.style.left = rect.left + 'px';
    mainToggle.style.top = rect.top + 'px';
    mainToggle.classList.add('logo-transitioning');
    isTransitioning = true;

    if (instant) {
        mainToggle.classList.add('logo-phase-3');
        headerBg.classList.add('active');
        headerContent.classList.add('active');
        activateViewContainer(viewName);
        startFactRotation();
        isTransitioning = false;
        return;
    }

    void mainToggle.offsetWidth;

    setTimeout(() => mainToggle.classList.add('logo-phase-1'), 50);
    setTimeout(() => mainToggle.classList.add('logo-phase-3'), 850);
    setTimeout(() => headerBg.classList.add('active'), 850);

    setTimeout(() => {
        headerContent.classList.add('active');
        activateViewContainer(viewName);
        startFactRotation();
        isTransitioning = false;
    }, 1800);
}

// Global reference to re-trigger render
let globalFilterAndRender = null;

function activateViewContainer(viewName) {
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const instructionsContainer = document.getElementById('instructionsContainer');
    
    if (viewName === 'search') {
        // Hide instructions smoothly
        if (instructionsContainer) {
            if (hideInstructionsTimeout) clearTimeout(hideInstructionsTimeout);
            instructionsContainer.classList.remove('active');
            hideInstructionsTimeout = setTimeout(() => { instructionsContainer.style.display = 'none'; }, 500);
        }

        initSearchEngine();
        
        // RE-RENDER CONTENT: If returning to search, make sure content is visible
        if (globalFilterAndRender) {
            globalFilterAndRender(false);
        }

        // Remove padding for back button
        headerContent.classList.remove('has-back-btn');

        if (searchResultsContainer) {
            if (hideSearchTimeout) clearTimeout(hideSearchTimeout);
            searchResultsContainer.style.display = 'flex';
            void searchResultsContainer.offsetWidth; // Reflow
            searchResultsContainer.classList.add('active');
        }
        
        if(headerSearch) {
            headerSearch.style.display = 'flex';
            headerSearch.style.opacity = '0';
            headerSearch.style.transform = 'translateX(20px)';
            void headerSearch.offsetWidth;
            headerSearch.style.opacity = '';
            headerSearch.style.transform = '';
        }

        document.body.classList.add('search-mode');
        if(headerBackBtn) { headerBackBtn.remove(); headerBackBtn = null; }
        
    } else if (viewName === 'instructions') {
        // Hide Search Results smoothly
        if (searchResultsContainer) {
            if (hideSearchTimeout) clearTimeout(hideSearchTimeout);
            searchResultsContainer.classList.remove('active');
            hideSearchTimeout = setTimeout(() => { searchResultsContainer.style.display = 'none'; }, 500);
        }

        // Add padding for back button
        headerContent.classList.add('has-back-btn');

        if (instructionsContainer) {
            if (hideInstructionsTimeout) clearTimeout(hideInstructionsTimeout);
            instructionsContainer.style.display = 'flex';
            void instructionsContainer.offsetWidth; // Reflow
            instructionsContainer.classList.add('active');
        }
        
        // Hide Search UI completely
        if(headerSearch) headerSearch.style.display = 'none';
        const resultsArea = document.getElementById('results-area');
        if (resultsArea) resultsArea.innerHTML = ''; 

        if(!headerBackBtn) {
            headerBackBtn = document.createElement('button');
            headerBackBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
            headerBackBtn.className = 'header-back-btn';
            headerBackBtn.style.position = 'fixed';
            headerBackBtn.style.top = '25px';
            headerBackBtn.style.left = '90px';
            headerBackBtn.style.zIndex = '110';
            headerBackBtn.style.background = 'none';
            headerBackBtn.style.border = 'none';
            headerBackBtn.style.color = '#58A6FF';
            headerBackBtn.style.fontSize = '24px';
            headerBackBtn.style.cursor = 'pointer';
            headerBackBtn.style.transition = 'transform 0.2s';
            headerBackBtn.onmouseover = () => headerBackBtn.style.transform = 'translateX(-3px)';
            headerBackBtn.onmouseout = () => headerBackBtn.style.transform = 'translateX(0)';
            
            headerBackBtn.onclick = closeInstruction;
            document.body.appendChild(headerBackBtn);
        }
    }
}

// ROUTING HELPER
let fullscreenExitGuard = false;

function setHash(hash) {
    if (window.location.hash !== hash) {
        isInternalRouteUpdate = true;
        window.location.hash = hash;
        setTimeout(() => { isInternalRouteUpdate = false; }, 300);
    }
}

function startSearchAnimation(instant = false) {
    if (!window.location.hash.startsWith('#/docs/')) {
         setHash('#/search');
    }
    switchView('search', instant);
}

function returnToMenu() {
    if (isTransitioning) return;
    isTransitioning = true;

    // Clear hash without reload
    history.pushState("", document.title, window.location.pathname + window.location.search);

    stopFactRotation();
    document.body.classList.remove('view-mode');
    document.body.classList.remove('search-mode');
    headerContent.classList.remove('has-back-btn');

    const input = document.getElementById('searchInput');
    if(input) input.blur();

    headerContent.classList.remove('active');
    
    // Hide containers
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const instructionsContainer = document.getElementById('instructionsContainer');
    if (searchResultsContainer) {
        if (hideSearchTimeout) clearTimeout(hideSearchTimeout);
        searchResultsContainer.classList.remove('active');
        hideSearchTimeout = setTimeout(() => { searchResultsContainer.style.display = 'none'; }, 500);
    }
    if (instructionsContainer) {
        if (hideInstructionsTimeout) clearTimeout(hideInstructionsTimeout);
        instructionsContainer.classList.remove('active');
        hideInstructionsTimeout = setTimeout(() => { instructionsContainer.style.display = 'none'; }, 500);
    }
    
    if(headerBackBtn) { headerBackBtn.remove(); headerBackBtn = null; }
    if(headerSearch) headerSearch.style.display = 'flex';
    tagFilters.classList.remove('active');

    setTimeout(() => {
        headerBg.classList.remove('active');
    }, 400);

    setTimeout(() => {
        mainToggle.classList.remove('logo-phase-3');
        mainToggle.classList.remove('logo-phase-1');
    }, 600);

    setTimeout(() => {
        mainToggle.classList.remove('logo-transitioning');
        mainToggle.style.left = '';
        mainToggle.style.top = '';
        mainToggle.style.transform = '';

        renderItems(menuConfig);
        isMenuOpen = false;
        orbitMenu.classList.remove('active');
        isTransitioning = false;
    }, 1400);
}


// --- ПОИСКОВОЙ ДВИЖОК И КОНТЕНТ ---
let searchInitialized = false;
const contentBaseUrl = 'https://raw.githubusercontent.com/SolvexIT/inst_cloud/main/';
let dbGlobal = [];

function updateURLState(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key]) url.searchParams.set(key, params[key]);
        else url.searchParams.delete(key);
    });
    window.history.replaceState({}, '', url);
}

// NOTE: parseMarkdown removed from here, now in JS/instruction-renderer.js

// --- SCROLL MANAGEMENT & RESTORATION ---

function saveScrollPosition(path) {
    const container = document.getElementById('instructionsContainer');
    if (container) {
        // Use sessionStorage to persist across reloads but clear on tab close
        // Key includes path to be specific to the document
        sessionStorage.setItem('scrollPos_' + path, container.scrollTop);
    }
}

function restoreScrollPosition(path) {
    const container = document.getElementById('instructionsContainer');
    const savedPos = sessionStorage.getItem('scrollPos_' + path);
    if (container && savedPos !== null) {
        // Delay slightly to ensure layout is stable
        setTimeout(() => {
            container.scrollTo({ top: parseInt(savedPos), behavior: 'auto' });
        }, 50);
    }
}

let scrollDebounceTimer;
function handleScrollSpy(path) {
    const container = document.getElementById('instructionsContainer');
    if (!container) return;

    // Save Position only. No URL update.
    if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = setTimeout(() => {
        saveScrollPosition(path);
    }, 150);
}

function openInstruction(resourcePath, anchor = null) {
    const instructionsContent = document.getElementById('instructionsContent');
    const instructionsContainer = document.getElementById('instructionsContainer');
    
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.click();

    if (!document.body.classList.contains('view-mode')) {
         switchView('search', true);
    }
    activateViewContainer('instructions');
    
    if (instructionsContent) {
        instructionsContent.innerHTML = '<div class="loading" style="text-align:center; padding:20px; color:#888;">Загрузка информации...</div>';
    }

    // Normalize path: decode, flip slashes, trim
    let processedPath = resourcePath;
    try { processedPath = decodeURIComponent(processedPath); } catch(e) {}

    // Extract anchor if present in decoded path (fixes %23 case)
    if (!anchor && processedPath.includes('#')) {
        const parts = processedPath.split('#');
        processedPath = parts[0];
        anchor = parts.slice(1).join('#');
    }
    
    // 1. Clean up the path and remove leading/trailing slashes
    let finalPath = processedPath.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
    
    // 2. Remove extension if present
    finalPath = finalPath.replace(/\.json$/, '');
    
    // 3. Determine Fetch Path (Restore "docs/" default behavior)
    // If the path does not start with "docs/", prepend it.
    let fetchPath = finalPath;
    if (!fetchPath.startsWith('docs/')) {
        fetchPath = 'docs/' + fetchPath;
    }

    // 4. Update URL hash (always #/docs/[id])
    // We strip 'docs/' from the start for the hash ID to keep it clean, if present.
    let id = fetchPath;
    if (id.startsWith('docs/')) {
        id = id.substring(5);
    }

    // Construct clean hash. Use decoded ID if possible for display.
    let newHash = '#/docs/' + id;
    if (anchor) {
        newHash += '#' + anchor;
    }

    // Use replaceState/pushState to avoid double encoding by browser if possible
    // Note: window.location.hash = ... automatically encodes some chars.
    // We try to push the "clean" decoded version.
    try {
        window.history.pushState({}, '', newHash);
    } catch(e) {
        // Fallback
        window.location.hash = newHash;
    }

    // 5. Construct final fetch URL
    const fullUrl = contentBaseUrl + fetchPath;

    // Remove old listeners to prevent stacking
    const container = document.getElementById('instructionsContainer');
    if (container) {
         // We can't easily remove anonymous functions or bounded args without storing ref.
         // Simple trick: clone and replace to strip listeners, OR just set onscroll.
         // Setting onscroll is safer/easier here.
         container.onscroll = () => handleScrollSpy(id);
    }

    fetch(fullUrl)
        .then(res => {
            if(!res.ok) throw new Error(`Не удалось загрузить файл инструкции (Status: ${res.status})`);
            return res.text();
        })
        .then(data => {
            if (window.renderInstructionContent) {
                // Check for saved scroll position
                const savedPos = sessionStorage.getItem('scrollPos_' + id);
                const hasSavedPos = savedPos !== null;

                // Force instant rendering if we have an anchor OR saved data
                // This prevents animation on reload
                const shouldBeInstant = !!anchor || hasSavedPos;

                window.renderInstructionContent(data, 'instructionsContent', { instant: shouldBeInstant });
                
                if (anchor) {
                    // 1. Show Popup for manual navigation
                    showAnchorPopup(anchor);
                } else if (hasSavedPos) {
                    // 3. Restore Session Position (Reload case)
                    restoreScrollPosition(id);
                }
            } else {
                throw new Error("Renderer not found");
            }
        })
        .catch(err => {
            console.error(err);
            instructionsContent.innerHTML = `<div class="error-msg" style="color:#ff6b6b; text-align:center;">
                <h3>Ошибка загрузки</h3>
                <p>${err.message}</p>
                <div style="font-size:0.8em; color:#888; margin:10px 0; word-break:break-all; background:#222; padding:5px; border-radius:4px;">
                    Trying to fetch:<br>
                    <a href="${fullUrl}" target="_blank" style="color:#58A6FF;">${fullUrl}</a>
                </div>
                <button onclick="closeInstruction()" style="margin-top:20px; padding:8px 16px; background:#333; color:white; border:none; cursor:pointer;">Назад</button>
            </div>`;
        });
}

window.closeInstruction = function() {
    setHash('#/search');
    activateViewContainer('search');
};

function initSearchEngine() {
    if (searchInitialized) return;

    const searchInput = document.getElementById('searchInput');
    const resultsArea = document.getElementById('results-area');
    const toggleTagsBtn = document.getElementById('toggleTagsBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const instructionsContainer = document.getElementById('instructionsContainer');

    toggleTagsBtn.onclick = () => {
        const tagFilters = document.getElementById('tag-filters');
        if (tagFilters) tagFilters.classList.toggle('active');
    };
    clearSearchBtn.onclick = () => {
        searchInput.value = '';
        selectedTags.clear();
        updateURLState({ search: null, tags: null });
        if(updateTagsUI) updateTagsUI();
        if (resultsArea) resultsArea.innerHTML = '';
        filterAndRender();
        searchInput.focus();
    };

    let selectedTags = new Set();
    let currentFilteredItems = [];
    let itemsToShow = 5;
    const loadMoreStep = 10;
    let updateTagsUI;

    fetch('https://gist.githubusercontent.com/SolvexIT/6c9d9ebc89835f8812cfb66d18268324/raw')
        .then(res => res.json())
        .then(data => {
            dbGlobal = data;
            createTagFilters(dbGlobal);
            const urlParams = new URLSearchParams(window.location.search);
            const savedQuery = urlParams.get('search');
            const savedTags = urlParams.get('tags');
            if (savedQuery) searchInput.value = savedQuery;
            if (savedTags) {
                savedTags.split(',').forEach(t => selectedTags.add(t));
                if(updateTagsUI) updateTagsUI();
            }
            filterAndRender(false);
        })
        .catch(err => console.error("DB Error:", err));

    let timeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        if (instructionsContainer && instructionsContainer.classList.contains('active')) closeInstruction();
        timeout = setTimeout(() => {
            filterAndRender();
            const query = searchInput.value.trim();
            updateURLState({ search: query || null });
        }, 300);
    });

    function filterAndRender(reset = true) {
        const query = searchInput.value.toLowerCase().trim();
        currentFilteredItems = dbGlobal.filter(item => {
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
        if (reset) itemsToShow = 5;
        renderResults();
    }
    globalFilterAndRender = filterAndRender;

    function renderResults() {
        resultsArea.innerHTML = '';
        if (currentFilteredItems.length === 0) {
            resultsArea.innerHTML = '<div class="no-results" style="color:#aaa; text-align:center; white-space: pre-line;">Ничего не найдено...\nНапишите нам в <a href="https://teletype.in/@solvex/support" target="_blank" style="color:#58A6FF;">поддержку</a>!</div>';
            return;
        }

        currentFilteredItems.slice(0, itemsToShow).forEach(item => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.cursor = 'pointer';

            const isExternal = item.link.startsWith('http');
            const cleanLink = isExternal ? item.link : item.link.replace(/\.json$/, '');

            const tagsHtml = item.tags.split(',').map(tag => {
                const trimmedTag = tag.trim();
                const isActive = selectedTags.has(trimmedTag) ? 'is-active' : '';
                return `<span class="tag_container ${isActive}">#${trimmedTag}</span>`;
            }).join(' ');
            
            card.innerHTML = `
                <a href="${cleanLink}" ${isExternal ? 'target="_blank"' : ''} style="text-decoration: none; color: inherit; display: block;" class="card-link">
                    <span class="result-title">${item.name}</span>
                    <span class="result-link">${cleanLink}</span>
                    <div class="result-description">${item.description || ''}</div>
                </a>
                <div class="result-tags" style="margin-top: 8px;">${tagsHtml}</div>
            `;
            
            card.style.animation = "fadeIn 0.5s ease";
            card.addEventListener('click', (e) => {
                if (e.target.closest('.tag_container')) return;
                e.preventDefault();
                if (isExternal) window.open(item.link, '_blank');
                else openInstruction(cleanLink);
            });

            resultsArea.appendChild(card);

            card.querySelectorAll('.result-tags .tag_container').forEach(tagEl => {
                tagEl.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    const tag = tagEl.textContent.replace('#', '').trim();
                    if (selectedTags.has(tag)) selectedTags.delete(tag);
                    else selectedTags.add(tag);
                    updateURLState({ tags: Array.from(selectedTags).join(',') || null });
                    if (updateTagsUI) updateTagsUI();
                    filterAndRender();
                });
            });
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
        const tagFilters = document.getElementById('tag-filters');

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
            updateURLState({ tags: null });
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
                sp.querySelector('span').onclick = () => { 
                    selectedTags.delete(tag); 
                    updateURLState({ tags: Array.from(selectedTags).join(',') || null });
                    updateUI(); 
                    filterAndRender(); 
                };
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
                a.onclick = (e) => { 
                    e.preventDefault(); 
                    selectedTags.add(tag); 
                    updateURLState({ tags: Array.from(selectedTags).join(',') });
                    updateUI(); 
                    filterAndRender(); 
                };
                availDiv.appendChild(a);
            });
        }
        updateTagsUI = updateUI;
        tagInput.addEventListener('input', updateUI);
        updateUI();
    }

    if (!document.getElementById('dynamic-styles')) {
        const s = document.createElement("style");
        s.id = 'dynamic-styles';
        s.innerText = `
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .tag_container.is-active {
                background: rgba(0, 145, 217, 0.5) !important;
                border-color: rgba(0, 145, 217, 0.8) !important;
                color: white !important;
                box-shadow: 0 0 10px rgba(0, 145, 217, 0.3);
            }
        `;
        document.head.appendChild(s);
    }
    searchInitialized = true;
}

// --- INITIALIZATION & ROUTING ---
window.addEventListener('load', () => {
    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('popstate', handleRouting);
    
    // Fix for fullscreen video exit causing navigation reset
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            // We are exiting fullscreen
            fullscreenExitGuard = true;
            // Clear guard after a short delay in case no routing event fired
            setTimeout(() => { fullscreenExitGuard = false; }, 1000);
        }
    });
});

window.handleAnchorClick = function(slug) {
    // Current hash structure: #/docs/path/to/file OR #/docs/path/to/file#currentAnchor
    const currentHash = window.location.hash;
    
    // Check if we are in docs mode
    if (!currentHash.startsWith('#/docs/')) return;
    
    // Extract base path (everything before the second #)
    const parts = currentHash.split('#'); 
    // parts[0] is empty, parts[1] is base route
    
    const basePath = parts[1]; 
    if (!basePath) return;

    // We want clear URLs.
    const newHash = '#' + basePath + '#' + slug;

    // Avoid triggering full route reload loop if only anchor changed
    if (window.location.hash !== newHash) {
        isInternalRouteUpdate = true;
        // Replace state to avoid history spam for anchor jumps, or pushState if you want back button support.
        // Using replaceState is often cleaner for in-page anchors unless precise history is needed.
        // But user might want to go "back" to previous section. Let's use pushState.
        // Decoding basePath if it was encoded ensures cleaner URL.
        try {
            history.pushState({}, '', newHash);
        } catch(e) {
            window.location.hash = newHash;
        }
        setTimeout(() => { isInternalRouteUpdate = false; }, 300);
    }
    
    scrollToAnchor(slug);

    // CLEAN URL after 3 seconds
    setTimeout(() => {
        const cleanHash = '#' + basePath;
        try {
            history.replaceState(null, null, cleanHash);
        } catch(e) {}
    }, 3000);
};

function scrollToAnchor(id) {
    if (!id) return;

    // Helper to match renderer's ID generation
    const slugify = (text) => {
        try {
             return decodeURIComponent(text).toLowerCase().trim().replace(/[^\w\u0400-\u04FF\s-]/g, '').replace(/\s+/g, '-');
        } catch(e) {
             return text.toLowerCase().trim().replace(/[^\w\u0400-\u04FF\s-]/g, '').replace(/\s+/g, '-');
        }
    };

    const targetId = id;
    const slugId = slugify(id);

    // Retry a few times in case of rendering/loading delays
    const attemptScroll = (count) => {
        // Try exact ID first, then slugified ID
        let el = document.getElementById(targetId);
        if (!el) el = document.getElementById(slugId);
        
        if (el) {
            const headerOffset = 100;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            // Optional: flash highlight
            el.style.transition = 'background 0.5s';
            el.style.backgroundColor = 'rgba(88, 166, 255, 0.2)';
            setTimeout(() => { el.style.backgroundColor = ''; }, 2000);
        } else if (count > 0) {
            setTimeout(() => attemptScroll(count - 1), 200);
        }
    };
    attemptScroll(5);
}

function handleRouting() {
    if (isInternalRouteUpdate) return;
    
    // GUARD: If we are in fullscreen (e.g. video), do not process routing changes.
    // This prevents "returning to menu" when exiting fullscreen video in some browsers.
    if (document.fullscreenElement) return;

    // If we just exited fullscreen, ignore this routing pass
    if (fullscreenExitGuard) {
        fullscreenExitGuard = false;
        return;
    }

    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const hasSearch = urlParams.get('search') || urlParams.get('tags');

    if (hash === '#/search') {
        startSearchAnimation(true);
    } else if (hash.startsWith('#/docs/') && hash.length > 7) {
        let path = hash.substring(7);
        let anchor = null;
        
        // Handle anchor in URL (e.g. #/docs/path#header-id)
        const parts = path.split('#');
        if (parts.length > 1) {
            path = parts[0];
            anchor = parts.slice(1).join('#'); // Join remainder just in case
        }

        if (!document.body.classList.contains('view-mode')) {
            startSearchAnimation(true);
        }
        openInstruction(path, anchor);
    } else if (hasSearch && !hash) {
        setHash('#/search');
    } else if (!hash) {
        // If we are in view-mode and hash is empty, it usually means we should return to menu.
        // BUT if we just exited fullscreen, we stay put because the browser might have cleared the hash incorrectly.
        if (document.body.classList.contains('view-mode')) {
            if (fullscreenExitGuard) {
                console.log("Blocking returnToMenu due to fullscreenExitGuard");
                return;
            }
            returnToMenu();
        } else {
             renderItems(menuConfig);
             isMenuOpen = false;
             orbitMenu.classList.remove('active');
        }
    }
}

function showAnchorPopup(anchorId) {
    // Check if we already handled this in the current session
    if (sessionStorage.getItem('anchor_popup_seen')) return;

    // Remove existing notification if present
    const existing = document.getElementById('anchor-popup-notification');
    if (existing) existing.remove();

    // Create popup container
    const popup = document.createElement('div');
    popup.id = 'anchor-popup-notification';
    popup.style.cssText = `
        position: fixed;
        bottom: 40px;
        right: 40px;
        background: #1e1e1e;
        border: 2px solid #58A6FF;
        border-radius: 16px;
        padding: 25px;
        z-index: 2147483647;
        box-shadow: 0 15px 45px rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        gap: 20px;
        animation: slideInBottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        max-width: 400px;
        font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        backdrop-filter: blur(10px);
    `;
    
    // Inject animation style if needed
    if (!document.getElementById('popup-anim-style')) {
        const style = document.createElement('style');
        style.id = 'popup-anim-style';
        style.textContent = `@keyframes slideInBottom { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
        document.head.appendChild(style);
    }

    popup.innerHTML = `
        <div style="color: #fff; font-size: 18px; display: flex; align-items: flex-start; gap: 15px; line-height: 1.5;">
            <div style="background: rgba(88, 166, 255, 0.1); padding: 12px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-location-arrow" style="color: #58A6FF; font-size: 24px;"></i>
            </div>
            <div>
                <strong style="display:block; margin-bottom: 6px; color: #58A6FF; font-size: 20px;">Перейти к разделу?</strong>
                <span style="color: #ddd; font-size: 15px;">Эта ссылка ведёт на конкретную часть документа. Хотите переместиться туда сейчас?</span>
            </div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 5px;">
            <button id="anchor-skip-btn" style="background: transparent; border: 1px solid #444; color: #aaa; padding: 10px 20px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 14px; font-weight: 500;">Пропустить</button>
            <button id="anchor-go-btn" style="background: #58A6FF; border: none; color: white; padding: 10px 25px; border-radius: 8px; cursor: pointer; font-weight: 700; transition: all 0.2s; box-shadow: 0 4px 12px rgba(88, 166, 255, 0.4); font-size: 15px;">Перейти сейчас</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Event Listeners
    const goBtn = document.getElementById('anchor-go-btn');
    const skipBtn = document.getElementById('anchor-skip-btn');

    const clearURLAnchor = () => {
        const hashParts = window.location.hash.split('#');
        if (hashParts.length > 2) {
            const cleanHash = '#' + hashParts[1];
            try {
                history.replaceState(null, null, cleanHash);
            } catch(e) {}
        }
    };

    goBtn.onmouseover = () => { goBtn.style.transform = 'translateY(-2px)'; goBtn.style.boxShadow = '0 4px 12px rgba(88, 166, 255, 0.4)'; };
    goBtn.onmouseout = () => { goBtn.style.transform = 'translateY(0)'; goBtn.style.boxShadow = '0 2px 8px rgba(88, 166, 255, 0.3)'; };

    skipBtn.onmouseover = () => { skipBtn.style.borderColor = '#666'; skipBtn.style.color = '#fff'; };
    skipBtn.onmouseout = () => { skipBtn.style.borderColor = '#444'; skipBtn.style.color = '#aaa'; };

    goBtn.onclick = () => {
        scrollToAnchor(anchorId);
        sessionStorage.setItem('anchor_popup_seen', 'true');
        clearURLAnchor();
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(20px)';
        setTimeout(() => popup.remove(), 300);
    };

    skipBtn.onclick = () => {
        clearURLAnchor();
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(20px)';
        setTimeout(() => popup.remove(), 300);
    };

    // Dismiss on click outside
    const handleOutsideClick = (e) => {
        if (!popup.contains(e.target)) {
            clearURLAnchor();
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(20px)';
            setTimeout(() => {
                popup.remove();
                document.removeEventListener('click', handleOutsideClick);
            }, 300);
        }
    };
    
    // Use setTimeout to avoid immediate dismissal from the click that opened it
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 100);
}
