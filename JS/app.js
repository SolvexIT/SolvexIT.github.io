
/* =========================================
   ЧАСТЬ 1: ГЛАВНОЕ МЕНЮ (ORBIT MENU)
   ========================================= */

const menuConfig = [
    { 
        id: 'search', 
        type: 'action', // type 'action' для вызова JS функции
        icon: 'fas fa-search', 
        action: activateSearchMode, // Функция, которую вызовем
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

const orbitMenu = document.getElementById('orbitMenu');
const ringArea = document.getElementById('ringArea');
const mainToggle = document.getElementById('mainToggle');
const mainLogoImg = document.getElementById('mainLogoImg');
const heroContainer = document.getElementById('heroContainer');
const backBtn = document.getElementById('backBtn');

let isMenuOpen = false;
let historyStack = []; 

// Рендер иконок
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

            if (item.type === 'folder') {
                openFolder(item);
            } else if (item.type === 'action') {
                // Если это действие (Поиск)
                orbitMenu.classList.remove('active');
                isMenuOpen = false;
                item.action(); // Вызываем функцию
            } else {
                // Если это ссылка
                orbitMenu.classList.remove('active');
                isMenuOpen = false;
                setTimeout(() => {
                    window.open(item.href, '_blank');
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
        } else {
            const prevFolder = historyStack[historyStack.length - 1];
            renderItems(prevFolder.items);
        }
        orbitMenu.classList.add('active');
    }, 400);
}

mainToggle.addEventListener('click', () => {
    // В режиме поиска клик по лого работает как "Домой"
    if (document.body.classList.contains('search-active')) {
        deactivateSearchMode();
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


/* =========================================
   ЧАСТЬ 2: SPA ЛОГИКА (ПЕРЕКЛЮЧЕНИЕ)
   ========================================= */

function activateSearchMode() {
    document.body.classList.add('search-active');
    // Запускаем инициализацию поиска, если она еще не была запущена
    if (!searchInitialized) {
        initSearchEngine();
        searchInitialized = true;
    }
    // Фокус на поле ввода через небольшую задержку
    setTimeout(() => {
        const input = document.getElementById('searchInput');
        if(input) input.focus();
    }, 600);
}

function deactivateSearchMode() {
    document.body.classList.remove('search-active');
    
    // Сбрасываем поле ввода (опционально, чтобы при возврате было чисто)
    // const input = document.getElementById('searchInput');
    // if(input) input.value = '';
    
    // Сбрасываем теги (если нужно)
    // Но лучше оставить состояние поиска, чтобы пользователь мог вернуться к результатам.
}

// Кнопка "Назад" в поиске
backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    deactivateSearchMode();
});


/* =========================================
   ЧАСТЬ 3: ПОИСКОВОЙ ДВИЖОК
   ========================================= */

let searchInitialized = false;

function initSearchEngine() {
    const searchInput = document.getElementById('searchInput');
    const resultsArea = document.getElementById('results-area');
    const tagFilters = document.getElementById('tag-filters');
    
    let db = []; 
    let selectedTags = new Set();
    
    let currentFilteredItems = []; 
    let itemsToShow = 5; 
    const loadMoreStep = 10; 

    const databaseUrl = 'https://gist.githubusercontent.com/SolvexIT/6c9d9ebc89835f8812cfb66d18268324/raw';

    fetch(databaseUrl)
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сети');
            return response.json();
        })
        .then(data => {
            db = data;
            createTagFilters(db);
            filterAndRender(false); 
        })
        .catch(error => {
            console.error('Ошибка:', error);
            resultsArea.innerHTML = '<div class="no-results">Ошибка загрузки базы. Проверьте интернет.</div>';
        });

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    searchInput.addEventListener('input', debounce(() => {
        filterAndRender();
    }, 300));

    function filterAndRender(reset = true) {
        const query = searchInput.value.toLowerCase().trim();
        
        currentFilteredItems = db.filter(item => {
            if (selectedTags.size > 0) {
                const itemTags = item.tags.split(',').map(t => t.trim());
                const hasTag = Array.from(selectedTags).some(tag => itemTags.includes(tag));
                if (!hasTag) return false;
            }

            if (!query && selectedTags.size === 0) return true;

            const inName = item.name.toLowerCase().includes(query);
            const inTags = item.tags.toLowerCase().includes(query);
            const inDescription = item.description ? item.description.toLowerCase().includes(query) : false;
            
            return inName || inTags || inDescription;
        });

        if (reset) {
            itemsToShow = loadMoreStep;
        }

        renderResults();
    }

    function renderResults() {
        resultsArea.innerHTML = ''; 

        if (currentFilteredItems.length === 0) {
            resultsArea.innerHTML = '<div class="no-results">Ничего не найдено...<br>Напишите нам в <a href="https://teletype.in/@solvex/support" target="_blank">поддержку</a>!</div>';
            return;
        }

        const itemsToRender = currentFilteredItems.slice(0, itemsToShow);

        itemsToRender.forEach(item => {
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
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn'; 
            loadMoreBtn.textContent = 'Показать ещё';
            
            loadMoreBtn.addEventListener('click', () => {
                itemsToShow += loadMoreStep; 
                renderResults(); 
            });

            resultsArea.appendChild(loadMoreBtn);
        }
    }

    function createTagFilters(data) {
        const allTags = new Set();
        data.forEach(item => {
            item.tags.split(',').forEach(tag => allTags.add(tag.trim()));
        });
        const sortedTags = Array.from(allTags).sort();

        tagFilters.innerHTML = `
            <input type="text" id="tagSearchInput" class="tag-search-input" placeholder="Фильтр по тегам">
            <div id="available-tags" class="available-tags"></div>
            <div id="selected-tags" class="selected-tags"></div>
        `;

        const tagSearchInput = document.getElementById('tagSearchInput');
        const availableTags = document.getElementById('available-tags');
        const selectedTagsDiv = document.getElementById('selected-tags');

        function renderAvailableTags(filter = '') {
            const filteredTags = sortedTags.filter(tag => tag.toLowerCase().includes(filter.toLowerCase()) && !selectedTags.has(tag));
            availableTags.innerHTML = '';
            
            const limit = 10;
            const toShow = filteredTags.slice(0, limit);
            
            toShow.forEach(tag => {
                const tagEl = document.createElement('a');
                tagEl.className = 'tag_container available-tag';
                tagEl.textContent = `#${tag}`;
                tagEl.href = '#';
                
                tagEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    selectedTags.add(tag);
                    updateTagsUI();
                });
                availableTags.appendChild(tagEl);
            });

            if (filteredTags.length > limit) {
                const moreBtn = document.createElement('button');
                moreBtn.className = 'tag_container more-tags-btn';
                moreBtn.textContent = 'Ещё...';
                moreBtn.addEventListener('click', () => {
                    availableTags.innerHTML = '';
                    filteredTags.forEach(tag => {
                        const tagEl = document.createElement('a');
                        tagEl.className = 'tag_container available-tag';
                        tagEl.textContent = `#${tag}`;
                        tagEl.href = '#';
                        tagEl.addEventListener('click', (e) => {
                            e.preventDefault();
                            selectedTags.add(tag);
                            updateTagsUI();
                        });
                        availableTags.appendChild(tagEl);
                    });
                });
                availableTags.appendChild(moreBtn);
            }
        }

        function renderSelectedTags() {
            selectedTagsDiv.innerHTML = '';
            selectedTags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag_container selected-tag';
                tagEl.innerHTML = `#${tag} <span class="remove-tag">&times;</span>`;
                tagEl.querySelector('.remove-tag').addEventListener('click', () => {
                    selectedTags.delete(tag);
                    updateTagsUI();
                });
                selectedTagsDiv.appendChild(tagEl);
            });
        }

        function updateTagsUI() {
            renderSelectedTags();
            renderAvailableTags(tagSearchInput.value);
            filterAndRender(); 
        }

        tagSearchInput.addEventListener('input', (e) => {
            renderAvailableTags(e.target.value);
        });

        renderAvailableTags();
        renderSelectedTags();
    }
}
