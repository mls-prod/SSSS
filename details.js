document.addEventListener('DOMContentLoaded', () => {
    // --- Элементы ---
    const backButton = document.querySelector('.back-button-in-banner'); // Изменен селектор
    const appBanner = document.getElementById('app-detail-banner');
    const appIcon = document.getElementById('app-detail-icon');
    const appName = document.getElementById('app-detail-name');
    const appDeveloper = document.getElementById('app-detail-developer');
    const appVersion = document.getElementById('app-detail-version');
    const appSize = document.getElementById('app-size');
    const appDescription = document.getElementById('app-detail-description');
    const descriptionContentElement = document.querySelector('.app-description-content');
    const seeMoreButton = document.querySelector('.see-more-button');
    const appScreenshotsContainer = document.getElementById('app-screenshots');
    const downloadButton = document.getElementById('download-button-detail');

    // --- Данные приложения (замените на реальные) ---
    const appData = {
        banner: 'bannerapp.png',
        icon: 'images/app-icon-example.png',
        name: 'Scarlet',
        developer: 'DebianArch64',
        version: 'v1.2.5',
        size: '180.2 MB', // Вес будет здесь
        description: `Scarlet App.`,
        longDescription: `Scarlet App.`,
        screenshots: [
            'images/screenshot-ql-1.jpg',
            'images/screenshot-ql-2.jpg',
            'images/screenshot-ql-3.jpg',
            'images/screenshot-ql-4.jpg',
            'images/screenshot-ql-5.jpg',
        ],
        downloadUrl: '#'
    };

    // --- Заполнение данными ---
    // appBanner.src = appData.banner;
    appBanner.alt = `Баннер приложения ${appData.name}`;
    appIcon.src = appData.icon;
    appIcon.alt = `Иконка приложения ${appData.name}`;
    appName.textContent = appData.name;
    appDeveloper.textContent = appData.developer;
    appVersion.textContent = appData.version;
    appSize.textContent = appData.size; // Теперь вес устанавливается здесь
    appDescription.innerHTML = appData.description + `<span class="more-text">` + appData.longDescription + `</span>`;
    downloadButton.href = appData.downloadUrl;

    // --- Генерация скриншотов ---
    appData.screenshots.forEach(screenshotSrc => {
        const screenshotItem = document.createElement('div');
        screenshotItem.className = 'screenshot-item';
        const img = document.createElement('img');
        img.src = screenshotSrc;
        img.alt = 'Screenshot';
        screenshotItem.appendChild(img);
        appScreenshotsContainer.appendChild(screenshotItem);
    });

    // --- Логика "See More" для описания ---
    let descriptionExpanded = false;
    const pElement = descriptionContentElement.querySelector('p'); // Находим параграф один раз

    // Проверяем, нужно ли показать кнопку "See More"
    const lineHeight = parseFloat(getComputedStyle(pElement).lineHeight);
    const maxDescriptionHeight = 100; // Соответствует max-height в CSS

    // Делаем небольшую паузу, чтобы DOM полностью отрисовался и offsetHeight был точным
    setTimeout(() => {
        const currentHeight = pElement.offsetHeight;
        if (currentHeight > maxDescriptionHeight) {
            seeMoreButton.textContent = 'See More';
            descriptionContentElement.classList.remove('expanded');
            pElement.style.maxHeight = `${maxDescriptionHeight}px`;
        } else {
            seeMoreButton.style.display = 'none';
            descriptionContentElement.classList.add('expanded');
            pElement.style.maxHeight = 'none';
        }
    }, 50); // Небольшая задержка

    seeMoreButton.addEventListener('click', () => {
        descriptionExpanded = !descriptionExpanded;
        descriptionContentElement.classList.toggle('expanded');
        seeMoreButton.textContent = descriptionExpanded ? 'See Less' : 'See More';

        if (descriptionExpanded) {
            pElement.style.maxHeight = '1000px'; // Большое значение для раскрытия
        } else {
            pElement.style.maxHeight = `${maxDescriptionHeight}px`; // Возвращаем начальную высоту
        }
    });

    // --- Обработка кнопки "Назад" ---
    backButton.addEventListener('click', () => {
        console.log('Back button clicked!');
        window.history.back(); // Или другая логика навигации
    });
});