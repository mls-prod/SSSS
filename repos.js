// script.js

// --- Глобальные переменные ---
let currentView = 'repos'; // Отслеживаем текущее отображение ('repos', 'repo-detail', 'app-detail')
let reposData = []; // Массив для хранения данных о репозиториях
let currentRepoApps = []; // Массив для хранения приложений текущего репозитория

// --- Элементы DOM ---
const mainContent = document.getElementById('main-content');
const reposSection = document.getElementById('installedAppsSection');
const repoDetailPage = document.getElementById('repo-detail-page');
const installedAppsList = document.getElementById('installedAppsList');
const repoAppsList = document.getElementById('repo-apps-list');

// Модальное окно
const addRepoModal = document.getElementById('add-repo-modal');
const repoUrlInput = document.getElementById('repo-url-input');
const closeModalBtn = addRepoModal.querySelector('.close-modal');
const cancelAddRepoBtn = document.getElementById('cancel-add-repo');
const confirmAddRepoBtn = document.getElementById('confirm-add-repo');

// Элементы страницы приложения


// Элементы страницы репозитория
const repoDetailIcon = document.getElementById('repo-detail-icon');
const repoDetailName = document.getElementById('repo-detail-name');
const repoDetailUrl = document.getElementById('repo-detail-url');
const repoDetailBackButton = repoDetailPage.querySelector('.back-button-in-banner');

// Элементы секции репозиториев
const addRepoButton = document.getElementById('add-repo-button');

// --- Функции ---

// Функция для переключения между видами страниц
function navigateTo(view, data = null) {
    // Скрываем все страницы
    reposSection.style.display = 'none';
    repoDetailPage.style.display = 'none';
    appDetailPage.style.display = 'none';

    // Показываем нужную страницу
    switch (view) {
        case 'repos':
            reposSection.style.display = 'block';
            currentView = 'repos';
            // Опционально: перезагрузить список репозиториев при возврате
            renderRepos();
            break;
        case 'repo-detail':
            if (data) {
                renderRepoDetail(data);
                repoDetailPage.style.display = 'block';
                currentView = 'repo-detail';
            }
            break;
       
    }
}

// Функция для получения данных из JSON файла по URL
async function fetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching JSON:", error);
        alert(`Failed to fetch data from ${url}. Please check the URL and try again.`);
        return null;
    }
}

// Функция для рендеринга списка репозиториев
function renderRepos() {
    installedAppsList.innerHTML = ''; // Очищаем список
    if (reposData.length === 0) {
        installedAppsList.innerHTML = '<p>No repositories added yet. Click the "+" to add one.</p>';
        return;
    }

    reposData.forEach(repo => {
        const repoItem = document.createElement('div');
        repoItem.classList.add('aapp-item');
        repoItem.dataset.repoUrl = repo.url; // Сохраняем URL для идентификации

        repoItem.innerHTML = `
            <img src="${repo.icon || 'https://via.placeholder.com/40/CCCCCC/FFFFFF?text=R'}" alt="${repo.name} Icon" class="aapp-icon">
            <div class="aapp-details">
                <h2 class="aapp-name">${repo.name}</h2>
                <div class="aapp-siterepo">${repo.url}</div>
            </div>
        `;
        repoItem.addEventListener('click', () => {
            // Загружаем приложения репозитория перед переходом
            fetchRepoApps(repo.url, repo);
        });
        installedAppsList.appendChild(repoItem);
        installedAppsList.appendChild(document.createElement('div')).classList.add('sseparator-line'); // Добавляем разделитель
    });
}

// Функция для загрузки приложений из репозитория
async function fetchRepoApps(repoUrl, repoInfo) {
    const appsData = await fetchJson(repoUrl);
    if (appsData && appsData.apps && Array.isArray(appsData.apps)) {
        // Сохраняем данные о приложениях для текущего репозитория
        currentRepoApps = appsData.apps.map(app => ({ ...app, repoUrl: repoInfo.url, repoName: repoInfo.name })); // Добавляем информацию о репозитории
        navigateTo('repo-detail', { ...repoInfo, apps: currentRepoApps });
    } else {
        alert("Invalid repository JSON format or no 'apps' array found.");
    }
}

// Функция для рендеринга детальной страницы репозитория
function renderRepoDetail(repo) {
    repoDetailIcon.src = repo.icon || 'https://via.placeholder.com/80/CCCCCC/FFFFFF?text=R';
    repoDetailName.textContent = repo.name;
    repoDetailUrl.textContent = repo.url;
    repoAppsList.innerHTML = ''; // Очищаем список приложений

    if (repo.apps && repo.apps.length > 0) {
        repo.apps.forEach(app => {
            const appItem = document.createElement('div');
            appItem.classList.add('repo-app-item');
            appItem.dataset.appId = app.id || app.name; // Используем id или name как идентификатор

            appItem.innerHTML = `
                <img src="${app.icon || 'https://via.placeholder.com/40/CCCCCC/FFFFFF?text=A'}" alt="${app.name} Icon" class="aapp-icon">
                <div class="repo-app-details">
                    <h4>${app.name}</h4>
                    <span class="developer">${app.developer || 'Unknown Developer'}</span>
                    <span class="version">v${app.version || 'N/A'}</span>
                </div>
                <button class="download-button-png" data-app-info='${JSON.stringify(app)}' aria-label="View App">
                    <img src="https://www.pngall.com/wp-content/uploads/2016/07/Arrow-PNG-Image.png" alt="View">
                </button>
            `;
            repoAppsList.appendChild(appItem);
        });
    } else {
        repoAppsList.innerHTML = '<p>No apps found in this repository.</p>';
    }
}

// Функция для рендеринга детальной страницы приложения
function renderAppDetail(app) {
    // Устанавливаем баннер (если есть)
    appDetailBanner.src = app.banner || 'https://via.placeholder.com/900x250/EEEEEE/333333?text=No+Banner';
    appDetailBanner.alt = `${app.name} Banner`;

    // Основная информация
    appDetailIcon.src = app.icon || 'https://via.placeholder.com/80/CCCCCC/FFFFFF?text=A';
    appDetailIcon.alt = `${app.name} Icon`;
    appDetailName.textContent = app.name;
    appDetailDeveloper.textContent = app.developer || 'Unknown Developer';
    appDetailVersion.textContent = `v${app.version || 'N/A'}`;
    appDetailSize.textContent = `${(app.size / 1024 / 1024).toFixed(2)} MB` || '0.0 MB'; // Конвертируем байты в МБ

    // Описание (с поддержкой "See More")
    appDetailDescription.textContent = app.description || 'No description available.';
    const seeMoreButton = appDetailPage.querySelector('.see-more-button');
    if (app.description && app.description.length > 150) { // Показываем "See More" только если описание длинное
        seeMoreButton.style.display = 'block';
        seeMoreButton.addEventListener('click', () => {
            const descriptionContent = appDetailPage.querySelector('.app-description-content');
            descriptionContent.classList.toggle('expanded');
            seeMoreButton.textContent = descriptionContent.classList.contains('expanded') ? 'See Less' : 'See More';
        });
    } else {
        seeMoreButton.style.display = 'none';
    }

    // Кнопка загрузки (здесь просто заглушка, можно добавить реальную логику)
    downloadButtonDetail.onclick = () => {
        alert(`Downloading ${app.name}... (Feature not implemented)`);
        // Здесь может быть логика для перехода по ссылке app.downloadUrl
    };
}


// --- Обработчики событий ---

// Кнопка "плюс" для добавления репозитория
addRepoButton.addEventListener('click', () => {
    addRepoModal.style.display = 'block';
});

// Закрытие модального окна по крестику
closeModalBtn.addEventListener('click', () => {
    addRepoModal.style.display = 'none';
    repoUrlInput.value = ''; // Очищаем поле ввода
});

// Закрытие модального окна по кнопке "Cancel"
cancelAddRepoBtn.addEventListener('click', () => {
    addRepoModal.style.display = 'none';
    repoUrlInput.value = ''; // Очищаем поле ввода
});

// Подтверждение добавления репозитория
confirmAddRepoBtn.addEventListener('click', async () => {
    const url = repoUrlInput.value.trim();
    if (!url) {
        alert('Please enter a repository URL.');
        return;
    }

    const repoData = await fetchJson(url);
    if (repoData) {
        // Проверяем наличие необходимых полей
        if (repoData.name && repoData.icon) {
            // Добавляем новый репозиторий
            reposData.push({
                name: repoData.name,
                url: url,
                icon: repoData.icon
            });
            renderRepos(); // Обновляем список репозиториев
            addRepoModal.style.display = 'none'; // Закрываем модальное окно
            repoUrlInput.value = ''; // Очищаем поле ввода
        } else {
            alert('Repository JSON must contain "name" and "icon" fields.');
        }
    }
    // Ошибка fetchJson уже выводит сообщение
});

// Назад из детальной страницы приложения
appDetailBannerBackButton.addEventListener('click', () => {
    navigateTo('repo-detail', { ...currentRepoApps[0].repoInfo, apps: currentRepoApps }); // Возвращаемся к списку приложений репозитория
});

// Назад из детальной страницы репозитория
repoDetailBackButton.addEventListener('click', () => {
    navigateTo('repos'); // Возвращаемся к списку репозиториев
});

// Обработка кликов по кнопкам "View App" в списке репозитория
repoAppsList.addEventListener('click', (event) => {
    const target = event.target;
    const downloadButton = target.closest('.download-button-png'); // Ищем ближайшую кнопку загрузки

    if (downloadButton) {
        const appInfoString = downloadButton.dataset.appInfo;
        if (appInfoString) {
            try {
                const appData = JSON.parse(appInfoString);
                navigateTo('app-detail', appData);
            } catch (e) {
                console.error("Error parsing app data:", e);
                alert("Could not load app details.");
            }
        }
    }
});


// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем сохраненные репозитории (если есть, например, из localStorage)
    // Для примера, добавим один репозиторий по умолчанию
    reposData = [
        {
            name: "Scarlet Repo",
            url: "https://raw.githubusercontent.com/DebianArch64/Scarlet/refs/heads/master/Scarlet.json", // Пример URL
            icon: "https://raw.githubusercontent.com/DebianArch64/Scarlet/refs/heads/master/icon.png"
        }
    ];

    renderRepos(); // Отображаем список репозиториев при загрузке страницы
});