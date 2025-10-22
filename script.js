

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM-элементы ---
    const allAppsContainer = document.getElementById('all-apps-container');
    const appDetailPage = document.getElementById('app-detail-page');
    const homePage = document.getElementById('home-page');
    const navButtons = document.querySelectorAll('.nav-button');
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResults');
    const reposPage = document.getElementById('repos-page');
    const repoListContainer = document.getElementById('repo-list-container');
    const repoDetailPage = document.getElementById('repo-detail-page');
    const repoDetailIcon = document.getElementById('repo-detail-icon');
    const repoDetailName = document.getElementById('repo-detail-name');
    const repoDetailUrl = document.getElementById('repo-detail-url');
    const repoAppsList = document.getElementById('repo-apps-list');
    const backButtonRepoDetail = document.querySelector('#repo-detail-page .back-button-in-banner');

    // Модальное окно загрузки
    const downloadModal = document.getElementById('download-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalAppIcon = document.getElementById('modal-app-icon');
    const modalAppName = document.getElementById('modal-app-name');
    const modalAppDeveloper = document.getElementById('modal-app-developer');
    const modalAppSize = document.getElementById('modal-app-size');
    const progressPercentage = document.querySelector('.progress-percentage');
    const progressRingProgress = document.querySelector('.progress-ring-progress');
    const progressRingBackground = document.querySelector('.progress-ring-background');

    // Модальное окно добавления репозитория
    const addRepoModal = document.getElementById('add-repo-modal');
    const addRepoButton = document.getElementById('add-repo-button');
    const closeModalAddRepo = document.getElementById('close-add-repo-modal');
    const cancelAddRepoBtn = document.getElementById('cancel-add-repo');
    const confirmAddRepoBtn = document.getElementById('confirm-add-repo');
    const repoUrlInput = document.getElementById('repo-url-input');

    // Модальное окно сертификатов
    const certManagerModal = document.getElementById('cert-manager-modal');
    const ipaFileInput = document.getElementById('ipaFileInput');
    const uploadIpaButton = document.querySelector('.upload-ipa-button');

    // Страница Download
    const downloadPage = document.getElementById('download-page');

    // Другие элементы
    const backButtonDetailPage = document.querySelector('.back-button-in-banner'); // Общий для app-detail и repo-detail
    const downloadButtonDetail = document.getElementById('download-button-detail'); // Кнопка на странице деталей приложения

    // --- Переменные состояния ---
    let currentAppToDisplay = null; // Текущее приложение для показа деталей
    let downloadInterval = null;
    let allAppsData = []; // Данные из scarlet.json (основной)
    let allReposData = []; // Данные из добавленных репозиториев
    const LOCAL_STORAGE_REPOS_KEY = 'scarletRepos';

    // --- Универсальные функции парсинга JSON ---
    function getNestedValue(obj, keys, defaultValue = null) {
        if (!obj) return defaultValue;
        for (const key of keys) {
            if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
                return obj[key];
            }
        }
        return defaultValue;
    }

    function normalizeApp(appData, repoBaseUrl = null) {
        if (!appData) return null; // Проверка на null/undefined

        const normalized = {
            id: getNestedValue(appData, ['id', 'appId', 'uuid']),
            name: getNestedValue(appData, ['name', 'appName', 'appNameCN', 'title']),
            developer: getNestedValue(appData, ['developer', 'dev', 'author', 'developerName']),
            version: getNestedValue(appData, ['version', 'ver', 'appVersion']),
            description: getNestedValue(appData, ['description', 'desc', 'details', 'summary']),
            icon: getNestedValue(appData, ['icon', 'iconURL', 'appIcon', 'iconUrl']),
            banner: getNestedValue(appData, ['banner', 'headerImage', 'header']),
            size: getNestedValue(appData, ['size', 'fileSize', 'fileSizeMB', 'filesize']),
            down: getNestedValue(appData, ['down', 'downloadUrl', 'ipa', 'url', 'download'])
        };

        // Корректируем URL, если он относительный и есть базовая URL репозитория
        if (repoBaseUrl && normalized.down && typeof normalized.down === 'string' && !normalized.down.startsWith('http')) {
            try {
                normalized.down = new URL(normalized.down, repoBaseUrl).href;
            } catch (e) {
                console.error(`Не удалось сформировать полный URL для ${normalized.name} из ${repoBaseUrl}: ${normalized.down}`, e);
                normalized.down = null;
            }
        }

        if (repoBaseUrl) {
            normalized.repoUrl = repoBaseUrl; // Сохраняем URL репозитория для контекста
        }

        // Проверяем минимально необходимые поля
        if (!normalized.name || !normalized.down) {
            console.warn("Пропущено приложение из-за отсутствия имени или URL скачивания:", appData);
            return null;
        }
        return normalized;
    }

    // --- Функции управления страницами ---
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            console.error(`Страница с ID "${pageId}" не найдена.`);
        }
    }

    // --- Функции управления модальным окном загрузки ---
    function showDownloadModal(app) {
        if (!downloadModal) return;
        modalAppIcon.src = app.icon || 'default-app-icon.png';
        modalAppName.textContent = app.name || 'Unknown App';
        modalAppDeveloper.textContent = app.developer || 'Unknown Developer';
        
        progressPercentage.textContent = '0%';

        const radius = parseFloat(progressRingProgress.getAttribute('r'));
        const circumference = 2 * Math.PI * radius;
        progressRingProgress.style.strokeDasharray = `${circumference}`;
        progressRingProgress.style.strokeDashoffset = `${circumference}`;
        progressRingProgress.style.transition = 'stroke-dashoffset 0.1s linear';
        progressRingProgress.style.stroke = '#ff3b30'; // Красный по умолчанию
        progressRingBackground.style.stroke = 'rgba(255, 255, 255, 0.1)';

        downloadModal.classList.add('active');
        startDownloadSimulation(app.down);
    }

    function hideDownloadModal() {
        if (!downloadModal) return;
        downloadModal.classList.remove('active');
        if (downloadInterval) {
            clearInterval(downloadInterval);
            downloadInterval = null;
        }
    }

    function startDownloadSimulation(downloadUrl) {
        let progress = 0;
        const speed = 3;
        const intervalTime = 70;
        const radius = parseFloat(progressRingProgress.getAttribute('r'));
        const circumference = 2 * Math.PI * radius;

        downloadInterval = setInterval(() => {
            progress += speed;
            if (progress >= 100) {
                progress = 100;
                progressPercentage.textContent = '100%';
                clearInterval(downloadInterval);
                downloadInterval = null;
                progressRingProgress.style.stroke = '#34c759'; // Зеленый при успехе

                setTimeout(() => {
                    // window.open(downloadUrl, '_blank'); // Автоматическое скачивание
                    hideDownloadModal();
                }, 1000);
                return;
            }

            progressPercentage.textContent = `${Math.round(progress)}%`;
            const offset = circumference - (progress / 100) * circumference;
            progressRingProgress.style.strokeDashoffset = offset;
        }, intervalTime);
    }

    // --- Функции управления репозиториями ---
    function saveRepos() {
        localStorage.setItem(LOCAL_STORAGE_REPOS_KEY, JSON.stringify(allReposData));
    }

    function loadRepos() {
        const storedRepos = localStorage.getItem(LOCAL_STORAGE_REPOS_KEY);
        if (storedRepos) {
            try {
                let parsedRepos = JSON.parse(storedRepos);
                allReposData = parsedRepos.map(repo => ({
                    ...repo,
                    // Нормализуем приложения внутри репозитория при загрузке
                    apps: (repo.apps || []).map(app => normalizeApp(app, repo.url)).filter(Boolean)
                }));
                displayRepos();
            } catch (error) {
                console.error("Ошибка при загрузке репозиториев из localStorage:", error);
                allReposData = []; // Сбрасываем, если ошибка парсинга
            }
        } else {
            allReposData = [];
        }
    }

    function addRepo(url) {
        if (!url) return;
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(repoData => {
                const normalizedRepoData = {
                    id: getNestedValue(repoData, ['id', 'repoId']),
                    name: getNestedValue(repoData, ['name', 'repoName', 'title']),
                    icon: getNestedValue(repoData, ['icon', 'iconURL', 'repoIcon']),
                    url: url, // Добавляем URL, если его нет в JSON
                    apps: (repoData.apps || []).map(app => normalizeApp(app, url)).filter(Boolean)
                };

                if (!normalizedRepoData.name) normalizedRepoData.name = 'Unnamed Repository';
                if (!normalizedRepoData.icon) normalizedRepoData.icon = 'default-repo-icon.png';

                // Проверка на дубликаты по URL или ID
                if (allReposData.some(repo => repo.url === url || (repo.id && normalizedRepoData.id && repo.id === normalizedRepoData.id))) {
                    alert("Этот репозиторий уже добавлен.");
                    return;
                }

                allReposData.push(normalizedRepoData);
                saveRepos();
                displayRepos();
                hideAddRepoModal();
            })
            .catch(error => {
                console.error("Ошибка при добавлении репозитория:", error);
                alert(`Не удалось добавить репозиторий. Проверьте ссылку или файл JSON. Ошибка: ${error.message}`);
            });
    }

    function displayRepos() {
        if (!repoListContainer) return;
        repoListContainer.innerHTML = ''; // Очищаем контейнер

        if (allReposData.length === 0) {
            repoListContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Репозитории не добавлены.</p>';
            return;
        }

        allReposData.forEach(repo => {
            const repoElement = document.createElement('div');
            repoElement.classList.add('repo-item');
            repoElement.innerHTML = `
                <img src="${repo.icon}" alt="${repo.name} Icon" class="repo-icon-small">
                <div class="repo-info">
                    <h3 class="repo-name">${repo.name}</h3>
                    <div class="repo-url">${repo.url}</div>
                </div>
            `;

            repoElement.addEventListener('click', () => {
                showRepoDetails(repo);
                showPage('repo-detail-page');
                // Активируем кнопку "Репозитории" в навигации
                navButtons.forEach(btn => btn.classList.remove('active'));
                document.getElementById('nav-repos').classList.add('active');
            });
            repoListContainer.appendChild(repoElement);
        });
    }

    function showRepoDetails(repo) {
        repoDetailIcon.src = repo.icon;
        repoDetailName.textContent = repo.name;
        repoDetailUrl.textContent = repo.url;
        displayRepoApps(repo.apps || [], repo.url);
    }

    function displayRepoApps(apps, repoBaseUrl) {
        if (!repoAppsList) return;
        repoAppsList.innerHTML = '';

        if (apps.length === 0) {
            repoAppsList.innerHTML = '<p style="color: rgba(255,255,255,0.6);">В этом репозитории нет приложений.</p>';
            return;
        }

        apps.forEach(app => {
            const appElement = document.createElement('div');
            appElement.classList.add('app-item', 'regular');
            appElement.innerHTML = `
                <img src="${app.icon}" alt="${app.name} icon" class="app-icon">
                <div class="app-info">
                    <h3 class="app-name">${app.name}</h3>
                    <p class="app-developer">${app.developer}</p>
                    
                </div>
                <button class="download-trigger" aria-label="Скачать ${app.name}">
                    <img src="b-install.png" alt="Install">
                </button>
            `;

            const appInfoDiv = appElement.querySelector('.app-info');
            const appIconImg = appElement.querySelector('.app-icon');
            const downloadTriggerButton = appElement.querySelector('.download-trigger');

            [appInfoDiv, appIconImg].forEach(el => {
                if (el) {
                    el.addEventListener('click', () => {
                        // Показываем детали, если они доступны
                        if (app.description || app.banner) {
                            currentAppToDisplay = app;
                            showAppDetails(app);
                            showPage('app-detail-page');
                        } else {
                            alert("Подробная информация об этом приложении недоступна.");
                        }
                    });
                }
            });

            if (downloadTriggerButton) {
                downloadTriggerButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDownloadModal(app); // app уже нормализован с полным URL
                });
            }
            repoAppsList.appendChild(appElement);
        });
    }

    // --- Функции для модального окна добавления репозитория ---
    function showAddRepoModal() {
        if (!addRepoModal) return;
        addRepoModal.classList.add('active');
        repoUrlInput.value = '';
        repoUrlInput.classList.remove('error');
    }

    function hideAddRepoModal() {
        if (!addRepoModal) return;
        addRepoModal.classList.remove('active');
    }

    // --- Функции загрузки и отображения данных приложений (основной JSON) ---
    async function loadMainAppData() {
        try {
            const response = await fetch('scarlet.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            allAppsData = (data.Jailbreaks || []).map(app => normalizeApp(app)).filter(Boolean);
            displayApps(allAppsData); // Отображаем на главной
        } catch (error) {
            console.error("Ошибка при загрузке scarlet.json:", error);
            allAppsContainer.innerHTML = '<p>Не удалось загрузить приложения. Попробуйте позже.</p>';
        }
    }

    function displayApps(apps) { // Отображение для главной страницы
        if (!allAppsContainer) return;
        allAppsContainer.innerHTML = '';
        if (apps.length === 0) {
             allAppsContainer.innerHTML = '<p>Приложения не найдены.</p>';
             return;
        }
        apps.forEach(app => {
            const appElement = document.createElement('div');
            appElement.classList.add('app-item', 'regular');
            appElement.innerHTML = `
                <img src="${app.icon}" alt="${app.name} icon" class="app-icon">
                <div class="app-info">
                    <h3 class="app-name">${app.name}</h3>
                    <p class="app-developer">${app.developer}</p>
                    
                </div>
                <button class="download-trigger" aria-label="Скачать ${app.name}">
                    <img src="b-install.png" alt="Install">
                </button>
            `;

            const appInfoDiv = appElement.querySelector('.app-info');
            const appIconImg = appElement.querySelector('.app-icon');
            const downloadTriggerButton = appElement.querySelector('.download-trigger');

            [appInfoDiv, appIconImg].forEach(el => {
                if (el) {
                    el.addEventListener('click', () => {
                        currentAppToDisplay = app;
                        showAppDetails(app);
                        showPage('app-detail-page');
                    });
                }
            });

            if (downloadTriggerButton) {
                downloadTriggerButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDownloadModal(app);
                });
            }
            allAppsContainer.appendChild(appElement);
        });
    }

    function showAppDetails(app) { // Отображение деталей приложения
        //const appDetailBanner = document.getElementById('app-detail-banner');
        //if (app.banner) {
            //appDetailBanner.src = app.banner;
     //   } else {
            //appDetailBanner.src = 'placeholder-banner.png';
        //}

        document.getElementById('app-detail-icon').src = app.icon;
        document.getElementById('app-detail-name').textContent = app.name;
        document.getElementById('app-detail-developer').textContent = app.developer;
        document.getElementById('app-detail-version').textContent = `v${app.version}`;
        document.getElementById('app-size').textContent = app.size || 'N/A';

        const descriptionElement = document.getElementById('app-detail-description');
        descriptionElement.innerHTML = `${app.description || 'No description available.'}<span class="more-text">${app.description || ''}</span>`;

        if (downloadButtonDetail) {
            downloadButtonDetail.onclick = () => {
                showDownloadModal(app);
            };
        }
    }

    // --- Функции поиска ---
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let searchResults = [];

        // Объединяем все источники приложений
        let allAvailableApps = [...allAppsData]; // Из scarlet.json

        // Добавляем приложения из всех репозиториев
        allReposData.forEach(repo => {
            if (repo.apps) {
                allAvailableApps = allAvailableApps.concat(repo.apps);
            }
        });

        // Убираем дубликаты, используя Map с уникальным ключом
        const uniqueAppsMap = new Map();
        allAvailableApps.forEach(app => {
            const key = app.id || `${app.name}-${app.developer}-${app.version}`; // Ключ для уникальности
            if (!uniqueAppsMap.has(key)) {
                uniqueAppsMap.set(key, app);
            }
        });
        allAvailableApps = Array.from(uniqueAppsMap.values()); // Преобразуем Map обратно в массив

        if (!searchTerm) {
            // Если поле поиска пустое, показываем контент соответствующей активной страницы
            if (homePage.classList.contains('active')) {
                displayApps(allAppsData); // Показываем все приложения с главного JSON
            } else if (reposPage.classList.contains('active')) {
                displayRepos(); // Показываем все репозитории
            } else if (repoDetailPage.classList.contains('active')) {
                 // Поиск на странице деталей репозитория - обновляем его список
                 const repoNameOrUrl = repoDetailName.textContent || repoDetailUrl.textContent;
                 const currentRepo = allReposData.find(r => r.name === repoNameOrUrl || r.url === repoNameOrUrl);
                 if (currentRepo) {
                     displayRepoApps(currentRepo.apps || [], currentRepo.url);
                 } else {
                     repoAppsList.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Не удалось найти текущий репозиторий.</p>';
                 }
            } else {
                if (searchResultsContainer) searchResultsContainer.innerHTML = '';
            }
            return;
        }

        // Фильтруем объединенный список
        const filteredApps = allAvailableApps.filter(app =>
            app.name.toLowerCase().includes(searchTerm) ||
            (app.developer && app.developer.toLowerCase().includes(searchTerm)) ||
            (app.version && app.version.toLowerCase().includes(searchTerm)) ||
            (app.description && app.description.toLowerCase().includes(searchTerm)) ||
            (app.repoName && app.repoName.toLowerCase().includes(searchTerm)) // Поиск по имени репозитория
        );

        displaySearchResults(filteredApps);
    }

    function displaySearchResults(results) {
        if (!searchResultsContainer) return;
        searchResultsContainer.innerHTML = '';

        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Результаты не найдены.</p>';
            return;
        }

        results.forEach(app => {
            const appElement = document.createElement('div');
            appElement.classList.add('app-item', 'regular');
            appElement.innerHTML = `
                <img src="${app.icon}" alt="${app.name} icon" class="app-icon">
                <div class="app-info">
                    <h3 class="app-name">${app.name}</h3>
                    <p class="app-developer">${app.developer}</p>
                    
                </div>
                <button class="download-trigger" aria-label="Скачать ${app.name}">
                    <img src="b-install.png" alt="Install">
                </button>
            `;

            const appInfoDiv = appElement.querySelector('.app-info');
            const appIconImg = appElement.querySelector('.app-icon');
            const downloadTriggerButton = appElement.querySelector('.download-trigger');

            [appInfoDiv, appIconImg].forEach(el => {
                if (el) {
                    el.addEventListener('click', () => {
                        currentAppToDisplay = app;
                        showAppDetails(app);
                        showPage('app-detail-page');
                    });
                }
            });

            if (downloadTriggerButton) {
                downloadTriggerButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showDownloadModal(app);
                });
            }
            searchResultsContainer.appendChild(appElement);
        });
    }

    // --- Обработчики событий для навигации ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');
            showPage(pageId + '-page');

            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            if (pageId === 'home') {
                currentAppToDisplay = null;
            }
            // При переходе на поиск, обновляем его состояние
            if (pageId === 'search') {
                performSearch();
            }
        });
    });

    // Обработчик для кнопки "Назад" (общий для app-detail и repo-detail)
    if (backButtonDetailPage) {
        backButtonDetailPage.addEventListener('click', () => {
            if (appDetailPage.classList.contains('active')) {
                showPage('home-page');
                document.getElementById('nav-home').classList.add('active');
            } else if (repoDetailPage.classList.contains('active')) {
                showPage('repos-page');
                document.getElementById('nav-repos').classList.add('active');
            }
        });
    }

    // --- Обработчики для модального окна загрузки ---
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideDownloadModal);
    }
    if (downloadModal) {
        downloadModal.addEventListener('click', (event) => {
            if (event.target === downloadModal) {
                hideDownloadModal();
            }
        });
    }

    // --- Обработчики для модального окна добавления репозитория ---
    if (addRepoButton) {
        addRepoButton.addEventListener('click', showAddRepoModal);
    }
    if (closeModalAddRepo) {
        closeModalAddRepo.addEventListener('click', hideAddRepoModal);
    }
    if (cancelAddRepoBtn) {
        cancelAddRepoBtn.addEventListener('click', hideAddRepoModal);
    }
    if (confirmAddRepoBtn) {
        confirmAddRepoBtn.addEventListener('click', () => {
            const url = repoUrlInput.value.trim();
            if (url) {
                addRepo(url);
            } else {
                repoUrlInput.classList.add('error');
            }
        });
    }
    if (addRepoModal) {
        addRepoModal.addEventListener('click', (event) => {
            if (event.target === addRepoModal) {
                hideAddRepoModal();
            }
        });
    }
     if (repoUrlInput) {
        repoUrlInput.addEventListener('input', () => {
            repoUrlInput.classList.remove('error');
        });
    

    

    }

    // --- Обработчик для кнопки "See More" ---
    function setupSeeMore() {
        const seeMoreButtons = document.querySelectorAll('.see-more-button');
        seeMoreButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const descriptionWrapper = e.target.previousElementSibling;
                descriptionWrapper.classList.toggle('expanded');
                if (descriptionWrapper.classList.contains('expanded')) {
                    e.target.textContent = 'See Less';
                } else {
                    e.target.textContent = 'See More';
                }
            });
        });
    }

    // --- Обработчик для поиска ---
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }

    // --- Функция предотвращения выделения текста ---
    function disableSelection() {
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        document.body.style.MozUserSelect = 'none';
    }

    // --- Инициализация ---
    loadRepos();
    loadMainAppData();
    showPage('home-page');
    if (navButtons.length > 0) {
        const navHomeButton = document.getElementById('nav-home');
        if (navHomeButton) {
            navHomeButton.classList.add('active');
        }
    }
    setupSeeMore();
    disableSelection(); // Запрет выделения текста по умолчанию
});

// --- PWA Setup ---
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                    console.log('[PWA] Service Worker registered successfully:', registration.scope);
                    // Можно добавить логику для обновления SW, если registration.active !== registration.installing
                })
                .catch((error) => {
                    console.error('[PWA] Service Worker registration failed:', error);
                });
        });
    } else {
        console.log('[PWA] Service Workers are not supported in this browser.');
    }
}

// Вызовите функцию регистрации Service Worker
registerServiceWorker();

// --- Инициализация сертификатов ---
// Убедитесь, что setupCertificateManager() вызывается после регистрации SW
//document.addEventListener('DOMContentLoaded', () => {
    //setupCertificateManager(); // Ваша функция инициализации сертификатов
    // ... другой ваш код инициализации ...
