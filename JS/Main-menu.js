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

function activateViewContainer(viewName) {
    searchResultsContainer.classList.remove('active');
    const instructionsContainer = document.getElementById('instructionsContainer');
    if (instructionsContainer) instructionsContainer.classList.remove('active');

    if (viewName === 'search') {
        initSearchEngine();
        searchResultsContainer.classList.add('active');
        document.body.classList.add('search-mode');
        if(headerSearch) headerSearch.style.display = 'flex';
        if(headerBackBtn) { headerBackBtn.remove(); headerBackBtn = null; }
    } else if (viewName === 'instructions') {
        if (instructionsContainer) instructionsContainer.classList.add('active');
        if(headerSearch) headerSearch.style.display = 'none';
        
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

function setHash(hash) {
    if (window.location.hash !== hash) {
        isInternalRouteUpdate = true;
        window.location.hash = hash;
        // Keep flag true for a short time to block both hashchange and popstate events
        setTimeout(() => {
            isInternalRouteUpdate = false;
        }, 300);
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

    const input = document.getElementById('searchInput');
    if(input) input.blur();

    headerContent.classList.remove('active');
    searchResultsContainer.classList.remove('active');
    const instructionsContainer = document.getElementById('instructionsContainer');
    if (instructionsContainer) instructionsContainer.classList.remove('active');
    
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

function parseMarkdown(lines) {
    if (!Array.isArray(lines)) return '';
    let html = '';
    let inCodeBlock = false;

    lines.forEach(line => {
        if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            html += inCodeBlock ? '<pre><code>' : '</code></pre>';
            return;
        }
        if (inCodeBlock) {
            html += line + '\n';
            return;
        }

        let processedLine = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (processedLine.startsWith('### ')) processedLine = `<h3>${processedLine.substring(4)}</h3>`;
        else if (processedLine.startsWith('## ')) processedLine = `<h2>${processedLine.substring(3)}</h2>`;
        else if (processedLine.startsWith('# ')) processedLine = `<h1>${processedLine.substring(2)}</h1>`;
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (processedLine.startsWith('&gt; ')) processedLine = `<blockquote>${processedLine.substring(5)}</blockquote>`;

        if (line.trim() === '') html += '<br>';
        else if (!processedLine.startsWith('<')) html += `<p>${processedLine}</p>`;
        else html += processedLine;
    });
    return html;
}

function openInstruction(resourcePath) {
    const instructionsContent = document.getElementById('instructionsContent');
    
    if (!document.body.classList.contains('view-mode')) {
         switchView('search', true);
    }
    activateViewContainer('instructions');
    
    if (instructionsContent) {
        instructionsContent.innerHTML = '<div class="loading" style="text-align:center; padding:20px; color:#888;">Загрузка информации...</div>';
    }

    const finalPath = resourcePath.replace(/^\/+/, '');
    const id = finalPath.replace(/\.json$/, '');
    setHash('#/docs/' + id); // Use Hash

    const fullUrl = contentBaseUrl + (finalPath.endsWith('.json') ? finalPath : finalPath + '.json');

    fetch(fullUrl)
        .then(res => {
            if(!res.ok) throw new Error('Не удалось загрузить файл инструкции');
            return res.json();
        })
        .then(data => {
            const contentHtml = parseMarkdown(data.content);
            let headerHtml = '';
            if (data.info) {
                 headerHtml = `<div class="instruction-header" style="margin-bottom:20px; border-bottom:1px solid #333; padding-bottom:10px;">
                    <h1 style="color:#58A6FF;">${data.info.title}</h1>
                    <div class="meta-info" style="color:#888; font-size:0.9em; margin-top:5px;">
                        <span style="margin-right:15px;"><i class="fas fa-user"></i> ${data.info.author}</span>
                        <span style="margin-right:15px;"><i class="fas fa-code-branch"></i> v${data.info.version}</span>
                        <span><i class="far fa-calendar-alt"></i> ${data.info.last_updated}</span>
                    </div>
                 </div>`;
            }

            let linksHtml = '';
            if (data.links) {
                linksHtml = '<div class="instruction-links" style="margin-top:20px; padding-top:10px; border-top:1px solid #333;">';
                for (const [key, url] of Object.entries(data.links)) {
                    linksHtml += `<a href="${url}" target="_blank" class="download-btn" style="display:inline-block; padding:10px 20px; background:#238636; color:white; text-decoration:none; border-radius:6px; margin-right:10px;"><i class="fas fa-download"></i> ${key}</a> `;
                }
                linksHtml += '</div>';
            }
            instructionsContent.innerHTML = headerHtml + contentHtml + linksHtml;
        })
        .catch(err => {
            console.error(err);
            instructionsContent.innerHTML = `<div class="error-msg" style="color:#ff6b6b; text-align:center;">
                <h3>Ошибка загрузки</h3>
                <p>${err.message}</p>
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
        if (instructionsContainer && instructionsContainer.classList.contains('active')) closeInstruction();
        else filterAndRender();
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
            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.cursor = 'pointer';

            const tagsHtml = item.tags.split(',').map(tag => {
                const trimmedTag = tag.trim();
                const isActive = selectedTags.has(trimmedTag) ? 'is-active' : '';
                return `<span class="tag_container ${isActive}">#${trimmedTag}</span>`;
            }).join(' ');
            
            card.innerHTML = `
                <a href="${item.link}" ${item.link.startsWith('http') ? 'target="_blank"' : ''} style="text-decoration: none; color: inherit; display: block;" class="card-link">
                    <span class="result-title">${item.name}</span>
                    <span class="result-link">${item.link}</span>
                    <div class="result-description">${item.description || ''}</div>
                </a>
                <div class="result-tags" style="margin-top: 8px;">${tagsHtml}</div>
            `;
            
            card.style.animation = "fadeIn 0.5s ease";
            card.addEventListener('click', (e) => {
                if (e.target.closest('.tag_container')) return;
                e.preventDefault();
                if (item.link.startsWith('http')) window.open(item.link, '_blank');
                else openInstruction(item.link);
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
});

function handleRouting() {
    // If update was triggered internally, just reset flag and return
    if (isInternalRouteUpdate) return;

    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const hasSearch = urlParams.get('search') || urlParams.get('tags');

    if (hash === '#/search') {
        startSearchAnimation(true);
    } else if (hash.startsWith('#/docs/') && hash.length > 7) {
        const path = hash.substring(7); // remove #/docs/
        if (!document.body.classList.contains('view-mode')) {
            startSearchAnimation(true);
        }
        openInstruction(path);
    } else if (hasSearch && !hash) {
        setHash('#/search');
    } else if (!hash) {
        if (document.body.classList.contains('view-mode')) {
            returnToMenu();
        } else {
             renderItems(menuConfig);
             isMenuOpen = false;
             orbitMenu.classList.remove('active');
        }
    }
}