document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsArea = document.getElementById('results-area');
    const tagFilters = document.getElementById('tag-filters');
    
    let db = []; // База данных
    let selectedTags = new Set(); // Выбранные теги
    
    // ПЕРЕМЕННЫЕ ДЛЯ ОПТИМИЗАЦИИ (Кнопка "Ещё")
    let currentFilteredItems = []; // Текущий список найденного
    let itemsToShow = 5; // Сколько показывать сразу
    const loadMoreStep = 10; // Сколько добавлять при нажатии кнопки

    // 1. Загружаем данные по ссылке
    const databaseUrl = 'https://gist.githubusercontent.com/SolvexIT/6c9d9ebc89835f8812cfb66d18268324/raw';

    fetch(databaseUrl)
        .then(response => {
            if (!response.ok) throw new Error('Ошибка сети');
            return response.json();
        })
        .then(data => {
            db = data;
            createTagFilters(db);
            filterAndRender(false); // Показываем первые itemsToShow при старте
        })
        .catch(error => {
            console.error('Ошибка:', error);
            resultsArea.innerHTML = '<div class="no-results">Ошибка загрузки базы. Проверьте интернет.</div>';
        });

    // --- ОПТИМИЗАЦИЯ: DEBOUNCE (Задержка поиска) ---
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Слушаем ввод (задержка 300мс перед поиском)
    searchInput.addEventListener('input', debounce(() => {
        filterAndRender();
    }, 300));

    // --- ГЛАВНАЯ ФУНКЦИЯ ФИЛЬТРАЦИИ ---
    function filterAndRender(reset = true) {
        const query = searchInput.value.toLowerCase().trim();
        
        // 1. Фильтруем данные в памяти
        currentFilteredItems = db.filter(item => {
            // Проверка тегов
            if (selectedTags.size > 0) {
                const itemTags = item.tags.split(',').map(t => t.trim());
                // Если у статьи нет ни одного выбранного тега -> скрываем
                const hasTag = Array.from(selectedTags).some(tag => itemTags.includes(tag));
                if (!hasTag) return false;
            }

            // Если поиск пустой и теги не выбраны -> показываем всё
            if (!query && selectedTags.size === 0) return true;

            // Проверка текста (Имя, Теги, Описание)
            const inName = item.name.toLowerCase().includes(query);
            const inTags = item.tags.toLowerCase().includes(query);
            const inDescription = item.description ? item.description.toLowerCase().includes(query) : false;
            
            return inName || inTags || inDescription;
        });

        // 2. Сбрасываем счетчик показанных элементов, если reset
        if (reset) {
            itemsToShow = loadMoreStep;
        }

        // 3. Рисуем результаты
        renderResults();
    }

    // --- ФУНКЦИЯ ОТРИСОВКИ (С кнопкой "Ещё") ---
    function renderResults() {
        resultsArea.innerHTML = ''; // Очищаем старое

        if (currentFilteredItems.length === 0) {
            resultsArea.innerHTML = '<div class="no-results">Ничего не найдено...<br>Напишите нам в <a href="https://teletype.in/@solvex/support" target="_blank">поддержку</a>!</div>';
            return;
        }

        // Берем только часть массива (от 0 до itemsToShow)
        const itemsToRender = currentFilteredItems.slice(0, itemsToShow);

        itemsToRender.forEach(item => {
            const card = document.createElement('a');
            card.className = 'result-card';
            card.href = item.link;
            if(item.link.startsWith('http')) card.target = "_blank";

            // Красивые теги внутри карточки
            const tagsHtml = item.tags.split(',').map(tag => `<span class="tag_container">#${tag.trim()}</span>`).join(' ');

            card.innerHTML = `
                <span class="result-title">${item.name}</span>
                <span class="result-link">${item.link}</span>
                <div class="result-description">${item.description || ''}</div>
                <div class="result-tags">${tagsHtml}</div>
            `;
            
            // Анимацию можно оставить, если карточек немного
            card.style.animation = "fadeIn 0.5s ease";
            resultsArea.appendChild(card);
        });

        // --- МАГИЯ КНОПКИ "ПОКАЗАТЬ ЕЩЁ" ---
        // Если реальных результатов больше, чем мы показали -> рисуем кнопку
        if (currentFilteredItems.length > itemsToShow) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'load-more-btn'; // Класс из CSS
            loadMoreBtn.textContent = 'Показать ещё';
            
            loadMoreBtn.addEventListener('click', () => {
                itemsToShow += loadMoreStep; // Увеличиваем лимит
                renderResults(); // Перерисовываем
            });

            resultsArea.appendChild(loadMoreBtn);
        }
    }

    // --- ФИЛЬТРЫ ТЕГОВ (Твой код) ---
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
                    // При нажатии показываем все теги, игнорируя лимит
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

        // Общая функция обновления после клика по тегу
        function updateTagsUI() {
            renderSelectedTags();
            renderAvailableTags(tagSearchInput.value);
            filterAndRender(); // <-- Самое важное: запускаем поиск
        }

        tagSearchInput.addEventListener('input', (e) => {
            renderAvailableTags(e.target.value);
        });

        renderAvailableTags();
        renderSelectedTags();
    }
});

// Добавляем стиль анимации появления карточек (если его нет в CSS)
if (!document.getElementById('dynamic-styles')) {
    const styleSheet = document.createElement("style");
    styleSheet.id = 'dynamic-styles';
    styleSheet.innerText = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(styleSheet);
}