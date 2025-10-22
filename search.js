// search.js

// --- Глобальные переменные ---
let appData = null; // Будет содержать данные из основного JSON
let allAvailableApps = []; // Массив для всех приложений (из основного JSON и пользовательских репозиториев)

// --- Получение элементов DOM ---
const searchInput = document.getElementById('searchInput');
const searchResultsDiv = document.getElementById('searchResults');
const searchPage = document.getElementById('search-page'); // Убедитесь, что этот элемент существует в вашем HTML

// --- Вспомогательные функции ---

// Функция для загрузки JSON (может быть общей для всех скриптов)
async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching JSON from ${url}:`, error);
        alert(`Failed to load data from ${url}. Please check the URL.`);
        return null;
    }
}

// Функция для обновления объединенного списка всех доступных приложений
// Адаптирована под вашу структуру JSON (Games, Tweaked и т.д.)
function updateAllAvailableApps() {
    allAvailableApps = []; // Очищаем старый список

    if (!appData) {
        console.warn("appData is not loaded yet. Cannot update allAvailableApps.");
        return;
    }

    // Добавляем приложения из известных категорий
    // Проверяем, что каждая категория существует и является массивом
    if (appData.Games && Array.isArray(appData.Games)) allAvailableApps.push(...appData.Games);
    if (appData.Tweaked && Array.isArray(appData.Tweaked)) allAvailableApps.push(...appData.Tweaked);
    if (appData.Emulators && Array.isArray(appData.Emulators)) allAvailableApps.push(...appData.Emulators);
    if (appData.Jailbreaks && Array.isArray(appData.Jailbreaks)) allAvailableApps.push(...appData.Jailbreaks);
    // Если есть другие категории, добавьте их сюда:
    // if (appData.Utilities && Array.isArray(appData.Utilities)) allAvailableApps.push(...appData.Utilities);

    // Если вы используете пользовательские репозитории, вам нужно будет добавить их сюда тоже:
    // customRepos.forEach(repo => {
    //     if (repo.apps && Array.isArray(repo.apps)) {
    //         allAvailableApps.push(...repo.apps);
    //     }
    // });

    console.log("Updated allAvailableApps:", allAvailableApps); // Для отладки
}

// Функция для рендеринга списка приложений (используется для результатов поиска)
// Предполагается, что createAppItem(app, type) существует и возвращает DOM-элемент
function renderAppList(appsToRender, container) {
    container.innerHTML = ''; // Очищаем контейнер результатов

    if (!appsToRender || appsToRender.length === 0) {
        container.innerHTML = '<p>No apps found.</p>';
        return;
    }

    const resultsList = document.createElement('div');
    resultsList.classList.add('app-list-items'); // Используйте тот же класс, что и для домашней страницы

    appsToRender.forEach(app => {
        // Проверяем, что app существует и имеет необходимые свойства перед созданием элемента
        if (app && app.name) {
            const appItem = createAppItem(app, 'regular'); // 'regular' для поиска
            if (appItem) {
                resultsList.appendChild(appItem);
            }
        } else {
            console.warn("Skipping invalid app entry:", app);
        }
    });

    if (resultsList.hasChildNodes()) {
        container.appendChild(resultsList);
    } else {
        container.innerHTML = '<p>No apps found.</p>'; // Если после фильтрации ничего не добавилось
    }
}

// --- Основная функция поиска ---
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    searchResultsDiv.innerHTML = ''; // Очищаем предыдущие результаты

    // Условие для начала поиска:
    // - Если запрос пустой, ничего не делаем (скрываем результаты или показываем пустой блок)
    // - Если запрос содержит 2 или более символов, начинаем поиск
    if (query.length === 0) {
        // Можно скрыть resultsDiv, если он был виден
        // searchResultsDiv.style.display = 'none';
        return;
    }
    if (query.length < 2) {
        // Можно показать сообщение "Введите больше символов" или просто ничего не делать
        // searchResultsDiv.innerHTML = '<p>Enter at least 2 characters to search.</p>';
        return;
    }

    // Убедимся, что блок результатов виден, если что-то есть
    // searchResultsDiv.style.display = 'block';

    // Фильтруем объединенный список всех доступных приложений
    const filteredApps = allAvailableApps.filter(app => {
        // Безопасная проверка полей
        const appName = app.name ? app.name.toLowerCase() : '';
        const appCategory = app.category ? app.category.toLowerCase() : '';
        const appDescription = app.description ? app.description.toLowerCase() : '';
        const appDeveloper = app.developer ? app.developer.toLowerCase() : ''; // Поиск по разработчику

        return appName.includes(query) ||
               appCategory.includes(query) ||
               appDescription.includes(query) ||
               appDeveloper.includes(query);
    });

    // Рендерим найденные приложения
    renderAppList(filteredApps, searchResultsDiv);
}

// --- Функция инициализации для поиска ---
function initializeSearch() {
    console.log("Initializing search functionality...");

    // Убедитесь, что элементы найдены
    if (!searchInput || !searchResultsDiv || !searchPage) {
        console.error("Search elements not found! Ensure 'searchInput', 'searchResultsDiv', and 'search-page' have correct IDs in HTML.");
        return;
    }

    // Загружаем основной JSON
    const jsonUrl = 'https://usescarlet.com/scarlet.json'; // Укажите ваш основной JSON файл
    fetchJson(jsonUrl)
        .then(data => {
            if (data) {
                appData = data;
                updateAllAvailableApps(); // Обновляем список приложений после загрузки основного JSON
                console.log("Main JSON loaded and appData updated.");

                // Если у вас есть пользовательские репозитории, загрузите их здесь:
                // loadCustomRepos(); // Предполагается, что эта функция определена
                // updateAllAvailableApps(); // И снова обновите список
            } else {
                console.error("Failed to load main JSON for search.");
                // Отобразить сообщение об ошибке пользователю
            }
        })
        .catch(error => {
            console.error("Error during initial fetch for search:", error);
        })
        .finally(() => {
            // Настраиваем слушатель событий для поля ввода поиска
            // Поиск будет происходить при каждом вводе (можно добавить debounce)
            searchInput.addEventListener('input', () => {
                handleSearch();
                // Если вы используете showPage, возможно, нужно будет показать страницу поиска
                // showPage('search-page'); // Пример
            });

            // Обработка, если страница поиска уже видна при загрузке с предзаполненным полем
            if (searchInput.value.trim().length > 0) {
                handleSearch();
            }
        });
}

// --- Вызов инициализации ---
// Предполагается, что этот скрипт подключается после того, как DOM загружен.
// Либо вы можете вызвать initializeSearch() из вашего основного DOMContentLoaded обработчика.
// Например:
// document.addEventListener('DOMContentLoaded', () => {
//     // ... ваш другой код ...
//     initializeSearch();
// });

// Если этот файл подключается отдельно, можно использовать:
document.addEventListener('DOMContentLoaded', initializeSearch);

// --- ВАЖНО: Определите функцию createAppItem ---
// Вам нужно, чтобы функция createAppItem была доступна.
// Если она находится в другом файле, убедитесь, что этот файл подключен ПОСЛЕ search.js,
// или что createAppItem объявлена глобально.
/*
function createAppItem(app, type) {
    // ... ваша реализация функции ...
    // Пример:
    const appItem = document.createElement('div');
    appItem.classList.add('aapp-item'); // Убедитесь, что класс правильный

    appItem.innerHTML = `
        <img src="${app.icon || 'placeholder.png'}" alt="${app.name} Icon" class="aapp-icon">
        <div class="aapp-details">
            <h2 class="aapp-name">${app.name}</h2>
            <div class="aapp-developer">${app.developer || 'Unknown Developer'}</div>
            <div class="aapp-category">${app.category || 'No Category'}</div>
        </div>
    `;
    // Добавьте обработчик клика, если нужно
    return appItem;
}
*/