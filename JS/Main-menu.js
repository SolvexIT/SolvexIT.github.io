/* ================= НАСТРОЙКИ МЕНЮ ================= */
// type: 'link' | 'folder' | 'action'
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

let isMenuOpen = false;
let currentLevel = 'root'; 
let historyStack = []; 

// DATA FETCHING
const FACT_URL = 'https://gist.githubusercontent.com/SolvexIT/98cac512e240657220e5fde866a392ad/raw';

async function fetchFact() {
    try {
        const response = await fetch(FACT_URL);
        const data = await response.json();
        // data structure: [{id: 1, text: "..."}, ...]
        if (Array.isArray(data) && data.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.length);
            randomFactEl.textContent = data[randomIndex].text;
        } else {
            randomFactEl.textContent = "Интересный факт не найден.";
        }
    } catch (e) {
        console.error("Ошибка при получении факта:", e);
        randomFactEl.textContent = "Ошибка загрузки факта.";
    }
}

// 1. Функция создания иконок
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

        // Логика клика
        el.addEventListener('click', (e) => {
            e.preventDefault(); 

            // CUSTOM SPA ACTION
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
                        if (item.href.startsWith('http')) {
                            window.open(item.href, '_blank');
                        } else {
                            window.location.href = item.href; 
                        }
                    }
                }, 500); 
            }
        });

        ringArea.appendChild(el);
    });
}

// 2. Открытие папки
function openFolder(folderItem) {
    orbitMenu.classList.remove('active');

    setTimeout(() => {
        historyStack.push(folderItem); 
        renderItems(folderItem.items); 
        orbitMenu.classList.add('active'); 
    }, 400);
}

// 3. Возврат назад
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

// 4. Главный клик по логотипу
mainToggle.addEventListener('click', () => {
    // Блокируем, если уже в режиме поиска
    if (document.body.classList.contains('search-mode')) return;

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

// === SPA ANIMATION FUNCTION ===
function startSearchAnimation() {
    // 0. Загружаем факт
    fetchFact();

    // 1. Убираем меню
    orbitMenu.classList.remove('active'); 
    isMenuOpen = false;
    document.body.classList.add('search-mode');

    // 2. Фиксируем позицию Логотипа перед анимацией
    // Получаем текущие координаты
    const rect = mainToggle.getBoundingClientRect();
    
    // Применяем fixed positioning, чтобы "заморозить" его на месте
    // Важно! Убираем transform из CSS класса, чтобы не было конфликтов
    mainToggle.style.left = rect.left + 'px';
    mainToggle.style.top = rect.top + 'px';
    mainToggle.classList.add('logo-transitioning');
    
    // Форсируем перерисовку (Reflow)
    void mainToggle.offsetWidth;

    // 3. Последовательность анимации
    
    // Фаза 1: Двигаем ВВЕРХ
    setTimeout(() => {
        mainToggle.classList.add('logo-phase-1');
    }, 100);

    // Фаза 2: Появляется фон шапки
    setTimeout(() => {
        headerBg.classList.add('active');
    }, 600); 

    // Фаза 3: Двигаем ВЛЕВО (в шапку)
    setTimeout(() => {
        mainToggle.classList.add('logo-phase-3');
    }, 1100);

    // Фаза 4: Появляется контент (Поиск и Факт)
    setTimeout(() => {
        headerContent.classList.add('active');
    }, 1600);
}
