document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsArea = document.getElementById('results-area');
    const tagFilters = document.getElementById('tag-filters');
    let db = []; // Сюда загрузим данные
    let selectedTags = new Set(); // Выбранные теги

    // 1. Загружаем данные из JSON файла
    fetch('Data/data.json')
        .then(response => response.json())
        .then(data => {
            db = data;
            createTagFilters(db);
            renderResults(db); // Показываем всё сразу при входе
        })
        .catch(error => console.error('Ошибка загрузки базы данных:', error));

    // Функция создания фильтров тегов
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

        // Функция отображения доступных тегов
        function renderAvailableTags(filter = '') {
            const filteredTags = sortedTags.filter(tag => tag.toLowerCase().includes(filter.toLowerCase()) && !selectedTags.has(tag));
            availableTags.innerHTML = '';
            const limit = 10; // Показывать первые 10
            const toShow = filteredTags.slice(0, limit);
            toShow.forEach(tag => {
                const tagEl = document.createElement('a');
                tagEl.className = 'tag_container available-tag';
                tagEl.textContent = `#${tag}`;
                tagEl.href = '#';
                tagEl.style.animation = 'fadeInTag 0.3s ease';
                tagEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    selectedTags.add(tag);
                    renderSelectedTags();
                    renderAvailableTags(tagSearchInput.value);
                    filterAndRender();
                });
                availableTags.appendChild(tagEl);
            });
            if (filteredTags.length > limit) {
                const moreBtn = document.createElement('button');
                moreBtn.className = 'tag_container more-tags-btn';
                moreBtn.textContent = 'Ещё...';
                moreBtn.addEventListener('click', () => {
                    // Показать все
                    availableTags.innerHTML = '';
                    filteredTags.forEach(tag => {
                        const tagEl = document.createElement('a');
                        tagEl.className = 'tag_container available-tag';
                        tagEl.textContent = `#${tag}`;
                        tagEl.href = '#';
                        tagEl.style.animation = 'fadeInTag 0.3s ease';
                        tagEl.addEventListener('click', (e) => {
                            e.preventDefault();
                            selectedTags.add(tag);
                            renderSelectedTags();
                            renderAvailableTags(tagSearchInput.value);
                            filterAndRender();
                        });
                        availableTags.appendChild(tagEl);
                    });
                });
                availableTags.appendChild(moreBtn);
            }
        }

        // Функция отображения выбранных тегов
        function renderSelectedTags() {
            selectedTagsDiv.innerHTML = '';
            selectedTags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag_container selected-tag';
                tagEl.innerHTML = `#${tag} <span class="remove-tag">&times;</span>`;
                tagEl.querySelector('.remove-tag').addEventListener('click', () => {
                    selectedTags.delete(tag);
                    renderSelectedTags();
                    renderAvailableTags(tagSearchInput.value);
                    filterAndRender();
                });
                selectedTagsDiv.appendChild(tagEl);
            });
        }

        // Обработчик ввода в поиск тегов
        tagSearchInput.addEventListener('input', (e) => {
            renderAvailableTags(e.target.value);
        });

        // Инициализация
        renderAvailableTags();
        renderSelectedTags();
    }

    // 2. Слушаем ввод текста
    searchInput.addEventListener('input', () => {
        filterAndRender();
    });

    // Функция фильтрации и отрисовки
    function filterAndRender() {
        const query = searchInput.value.toLowerCase();
        let filtered = db;

        // Фильтр по тексту
        if (query) {
            filtered = filtered.filter(item => {
                const inName = item.name.toLowerCase().includes(query);
                const inTags = item.tags.toLowerCase().includes(query);
                const inDescription = item.description.toLowerCase().includes(query);
                return inName || inTags || inDescription;
            });
        }

        // Фильтр по тегам
        if (selectedTags.size > 0) {
            filtered = filtered.filter(item => {
                const itemTags = item.tags.split(',').map(t => t.trim());
                return Array.from(selectedTags).some(tag => itemTags.includes(tag));
            });
        }

        renderResults(filtered);
    }

    // 3. Функция отрисовки карточек
    function renderResults(items) {
        resultsArea.innerHTML = ''; // Очистить текущее

        if (items.length === 0) {
            resultsArea.innerHTML = '<div class="no-results">Ничего не найдено...<br>Напишите нам в <a href="https://teletype.in/@solvex/support" target="_blank">поддержку</a>!</div>';
            return;
        }

        items.forEach(item => {
            // Создаем HTML карточки
            const card = document.createElement('a');
            card.className = 'result-card';
            card.href = item.link;
            
            // Если ссылка ведет на внешний сайт, открываем в новой вкладке
            if(item.link.startsWith('http')) {
               card.target = "_blank";
            }

            card.innerHTML = `
                <span class="result-title">${item.name}</span>
                <span class="result-link">${item.link}</span>
                <div class="result-description">${item.description}</div>
                <div class="result-tags">${item.tags.split(',').map(tag => `<a class="tag_container">#${tag.trim()}</a>`).join(' ')}</div>
            `;
            
            // Добавляем плавное появление
            card.style.animation = "fadeIn 0.5s ease";
            
            resultsArea.appendChild(card);
        });
    }
});

// Добавим анимацию появления в стили через JS (или можно в CSS)
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(styleSheet);