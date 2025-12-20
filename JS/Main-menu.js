/* ================= НАСТРОЙКИ МЕНЮ ================= */
// Здесь ты добавляешь свои кнопки.
// type: 'link' (ссылка) или 'folder' (папка с иконками)
// icon: путь к картинке ИЛИ класс иконки FontAwesome (например 'fas fa-search')
// href: ссылка (только для type: 'link')
// items: массив вложенных кнопок (только для type: 'folder')

const menuConfig = [
    { 
        id: 'search', 
        type: 'link', 
        icon: 'fas fa-search', // Использую иконочный шрифт, но можно 'img/search.png'
        href: 'search.html',
        label: 'Поиск'
    },
    { 
        id: 'telegram', 
        type: 'link', 
        icon: 'fab fa-telegram-plane', 
        href: 'https://t.me/SolvexIT_public_links',
        label: 'Telegram'
    },
/*    { 
        id: 'tools', 
        type: 'folder', // ЭТО ПАПКА! При нажатии откроются новые иконки
        icon: 'fas fa-tools', 
        label: 'Инструменты',
        items: [
            { type: 'link', icon: 'fas fa-wifi', href: '#', label: 'Wi-Fi' },
            { type: 'link', icon: 'fas fa-server', href: '#', label: 'Server' },
            { type: 'link', icon: 'fas fa-code', href: '#', label: 'Code' },
            { type: 'link', icon: 'fas fa-terminal', href: '#', label: 'Term' }
        ]
    }, Пока не нужно|проверка*/
    {
        id: 'info',
        type: 'link',
        icon: 'fas fa-info',
        href: 'https://teletype.in/@solvex/SolvexIT',
        label: 'Инфо'
    }
];

/* ================= ЛОГИКА (НЕ ТРОГАТЬ, ЕСЛИ НЕ ЗНАЕШЬ) ================= */

const orbitMenu = document.getElementById('orbitMenu');
const ringArea = document.getElementById('ringArea');
const mainToggle = document.getElementById('mainToggle');
const mainLogoImg = document.getElementById('mainLogoImg');
const originalLogoSrc = mainLogoImg.src; // Запоминаем изначальный логотип

let isMenuOpen = false;
let currentLevel = 'root'; // 'root' или id папки
let historyStack = []; // Чтобы знать, куда возвращаться

// 1. Функция создания иконок
function renderItems(items) {
    ringArea.innerHTML = ''; // Очищаем текущие
    const count = items.length;
    const step = 360 / count; // Шаг угла

    items.forEach((item, index) => {
        const el = document.createElement('a');
        el.className = 'orbit-item';
        
        // Устанавливаем угол для CSS
        // Начинаем с -90deg, чтобы первый элемент был сверху
        el.style.setProperty('--angle', `${(index * step) - 90}deg`);
        
        // Добавляем задержку для эффекта "падают/появляются по очереди"
        el.style.transitionDelay = `${index * 0.05}s`;

        // Вставляем иконку (картинка или шрифт)
        if (item.icon.includes('fa-')) {
            el.innerHTML = `<i class="${item.icon}"></i>`;
        } else {
            el.innerHTML = `<img src="${item.icon}" style="width:60%;">`;
        }

        // Логика клика
        el.addEventListener('click', (e) => {
            e.preventDefault(); // Останавливаем переход сразу

            if (item.type === 'folder') {
                openFolder(item);
            } else {
                // Эффект "всасывания": убираем класс active
                orbitMenu.classList.remove('active');
                isMenuOpen = false;

                // Ждем окончания анимации (400-500мс), прежде чем перейти
                setTimeout(() => {
                    if (item.href.startsWith('http')) {
                        window.open(item.href, '_blank'); // Открываем в новой вкладке, если внешняя ссылка
                    } else {
                        window.location.href = item.href; // Переходим на страницу (например, search.html)
                    }
                }, 500); // 500мс — время, за которое кружки успевают "всосаться"
            }
        });

        ringArea.appendChild(el);
    });
}

// 2. Открытие папки
function openFolder(folderItem) {
    // Анимация исчезновения текущих
    orbitMenu.classList.remove('active');

    setTimeout(() => {
        historyStack.push(folderItem); // Запоминаем путь
        renderItems(folderItem.items); // Рендерим новые
        
        // Меняем логотип на "Назад" или иконку папки
        // mainLogoImg.src = 'back_icon.png'; // Можно поменять картинку
        
        orbitMenu.classList.add('active'); // Показываем новые
    }, 400);
}

// 3. Возврат назад (при клике на центр, если мы в папке)
function goBack() {
    orbitMenu.classList.remove('active');
    
    setTimeout(() => {
        historyStack.pop(); // Удаляем текущую папку
        
        if (historyStack.length === 0) {
            // Мы вернулись в начало
            renderItems(menuConfig);
            currentLevel = 'root';
        } else {
            // Мы вернулись в предыдущую папку
            const prevFolder = historyStack[historyStack.length - 1];
            renderItems(prevFolder.items);
        }
        orbitMenu.classList.add('active');
    }, 400);
}

// 4. Главный клик по логотипу
mainToggle.addEventListener('click', () => {
    if (historyStack.length > 0) {
        // Если мы в папке - кнопка работает как "Назад"
        goBack();
    } else {
        // Если мы в корне - кнопка открывает/закрывает меню
        if (!isMenuOpen) {
            renderItems(menuConfig);
            // Небольшая задержка чтобы браузер отрисовал DOM перед анимацией
            setTimeout(() => orbitMenu.classList.add('active'), 10);
            isMenuOpen = true;
        } else {
            orbitMenu.classList.remove('active');
            isMenuOpen = false;
        }
    }
});