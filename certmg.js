// certmg.js

// --- Глобальные переменные ---
let selectedIpaFile = null; // Хранит выбранный IPA файл
let selectedCertificate = null; // Хранит выбранный сертификат
let certificates = []; // Список импортированных сертификатов
const CERTIFICATES_LS_KEY = 'scarletCertificates'; // Ключ для localStorage

// --- DOM-элементы ---
const ipaFileInput = document.getElementById('ipaFileInput');
const uploadIpaButton = document.querySelector('.upload-ipa-button');
const ipaCertSelectModal = document.getElementById('ipa-cert-select-modal');
const closeIpaCertModal = document.getElementById('close-ipa-cert-modal');
const selectedIpaNameDisplay = document.getElementById('selected-ipa-name');
const certListForSelection = document.getElementById('cert-list-for-selection');
const cancelIpaCertSelectionBtn = document.getElementById('cancel-ipa-cert-selection');
const confirmIpaCertSelectionBtn = document.getElementById('confirm-ipa-cert-selection');

const certificateManagerModal = document.getElementById('certificate-manager-modal');
const closeManagerModalBtn = document.getElementById('close-manager-modal');
const certListManager = document.getElementById('cert-list-manager');
const importP12Button = document.getElementById('import-p12-button');
const importMobileProvisionButton = document.getElementById('import-mobileprovision-button');
const p12FileInput = document.getElementById('p12FileInput');
const mobileprovisionFileInput = document.getElementById('mobileprovisionFileInput');
const closeManagerFooterBtn = document.getElementById('close-manager-footer-button');

// --- Функции управления модальными окнами ---
function showIpaCertSelectModal() {
    if (!ipaCertSelectModal) { console.error("IPA Cert Select Modal not found!"); return; }
    ipaCertSelectModal.classList.add('active');
}

function hideIpaCertSelectModal() {
    if (!ipaCertSelectModal) return;
    ipaCertSelectModal.classList.remove('active');
    resetIpaCertSelectionState();
}

function showCertificateManagerModal() {
    if (!certificateManagerModal) { console.error("Certificate Manager Modal not found!"); return; }
    certificateManagerModal.classList.add('active');
    renderCertListManager(); // Отрисовываем список при открытии
}

function hideCertificateManagerModal() {
    if (!certificateManagerModal) return;
    certificateManagerModal.classList.remove('active');
}

function resetIpaCertSelectionState() {
    selectedIpaFile = null;
    selectedCertificate = null;
    if (selectedIpaNameDisplay) selectedIpaNameDisplay.textContent = "None selected";
    // Очищаем выбор сертификата в списке
    if (certListForSelection) {
        certListForSelection.querySelectorAll('.cert-item-selection').forEach(item => {
            item.querySelector('.radio-button').classList.remove('selected');
        });
    }
}

// --- Функции управления сертификатами ---
function saveCertificates() {
    localStorage.setItem(CERTIFICATES_LS_KEY, JSON.stringify(certificates));
    console.log("Certificates saved.");
}

function loadCertificates() {
    console.log("Loading certificates...");
    const storedCerts = localStorage.getItem(CERTIFICATES_LS_KEY);
    if (storedCerts) {
        try {
            certificates = JSON.parse(storedCerts);
            // Дополнительно можно парсить даты и проверять срок действия, если нужно
            console.log(`Loaded ${certificates.length} certificates.`);
        } catch (error) {
            console.error("Error parsing certificates from localStorage:", error);
            certificates = [];
        }
    } else {
        certificates = [];
        console.log("No certificates found in localStorage.");
    }
    renderCertListManager(); // Обновляем список в менеджере
    renderCertListForSelection(); // Обновляем список для выбора IPA
}

function renderCertListManager() {
    if (!certListManager) return;
    certListManager.innerHTML = ''; // Очищаем

    if (certificates.length === 0) {
        certListManager.innerHTML = '<p class="empty-list-message">No certificates imported yet.</p>';
        return;
    }

    certificates.forEach((cert, index) => {
        const certItem = document.createElement('div');
        certItem.classList.add('cert-item-manager');

        const isRevoked = cert.revoked || false; // Предполагаем, что есть поле revoked
        const statusClass = isRevoked ? 'revoked' : 'signed';
        const statusText = isRevoked ? 'Revoked' : 'Signed';

        // Форматируем дату истечения срока действия (предполагаем, что cert.expires - это строка или timestamp)
        let expiresText = 'Unknown';
        try {
            if (cert.expires) {
                const date = new Date(cert.expires);
                expiresText = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }
        } catch (e) {
            console.error("Error formatting expiry date:", cert.expires);
            expiresText = 'Invalid Date';
        }


        certItem.innerHTML = `
            <div class="radio-wrapper" data-cert-index="${index}">
                <div class="radio-button ${selectedCertificate === cert ? 'selected' : ''}"></div>
            </div>
            <div class="cert-details">
                <div class="cert-name">${cert.name || 'Unnamed Certificate'}</div>
                <div class="cert-meta">
                    <span class="cert-expires-label">Expires:</span>
                    <span class="cert-expires-value">${expiresText}</span>
                    <span class="cert-status-label">Status:</span>
                    <span class="cert-status-value ${statusClass}">${statusText}</span>
                </div>
            </div>
            <!-- <div class="checkmark-right"></div> -->
        `;

        // Добавляем обработчик на клик по строке для выбора сертификата
        certItem.querySelector('.radio-wrapper').addEventListener('click', () => {
            selectCertificateForManager(cert);
        });

        certListManager.appendChild(certItem);
    });
}

function renderCertListForSelection() {
    if (!certListForSelection) return;
    certListForSelection.innerHTML = '';

    if (certificates.length === 0) {
        certListForSelection.innerHTML = '<p class="empty-list-message">No certificates found. Please import them.</p>';
        return;
    }

    certificates.forEach((cert, index) => {
        // Фильтруем только действительные сертификаты для установки IPA
        if (cert.revoked || !cert.expires) return; // Пропускаем отозванные или с неизвестной датой

        const certItem = document.createElement('div');
        certItem.classList.add('cert-item-selection');

        let expiresText = 'Unknown';
        try {
            if (cert.expires) {
                const date = new Date(cert.expires);
                expiresText = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }
        } catch (e) { expiresText = 'Invalid Date'; }

        certItem.innerHTML = `
            <div class="radio-button ${selectedCertificate === cert ? 'selected' : ''}"></div>
            <div class="cert-name">${cert.name || 'Unnamed Certificate'}</div>
            <div class="cert-expires">${expiresText}</div>
        `;

        // Обработчик клика для выбора сертификата
        certItem.addEventListener('click', () => {
            selectCertificateForIPA(cert);
        });

        certListForSelection.appendChild(certItem);
    });
}

function selectCertificateForManager(cert) {
    selectedCertificate = cert;
    renderCertListManager(); // Обновляем UI для выделения
}

function selectCertificateForIPA(cert) {
    selectedCertificate = cert;
    renderCertListForSelection(); // Обновляем UI
}

function importCertificate(file, type) {
    // В реальном приложении здесь была бы сложная логика парсинга .p12 / .mobileprovision
    // С использованием криптографических библиотек (например, forge.js для браузера)
    // Для примера, мы просто добавим заглушку с именем файла и текущей датой

    if (!file) return;
    console.log(`Importing ${type} file: ${file.name}`);

    // Читаем файл как ArrayBuffer (требуется для криптографии)
    const reader = new FileReader();
    reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        // Здесь должна быть реальная логика парсинга

        // Заглушка: создаем объект сертификата
        const newCert = {
            name: file.name.replace(`.${type}`, ''), // Имя файла без расширения
            raw: arrayBuffer, // Сохраняем как ArrayBuffer (для реальной работы)
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Примерно год в будущем
            revoked: false, // По умолчанию не отозван
            type: type // 'p12' или 'mobileprovision'
        };

        // Добавляем или обновляем сертификат
        const existingIndex = certificates.findIndex(c => c.name === newCert.name && c.type === type);
        if (existingIndex !== -1) {
            certificates[existingIndex] = newCert; // Обновляем существующий
        } else {
            certificates.push(newCert); // Добавляем новый
        }

        saveCertificates();
        renderCertListManager(); // Обновляем список в менеджере
        renderCertListForSelection(); // Обновляем список для выбора IPA
        console.log(`Certificate imported: ${newCert.name}`);
    };
    reader.onerror = (event) => {
        console.error("Error reading file:", event.target.error);
        alert(`Error reading file: ${file.name}`);
    };
    reader.readAsArrayBuffer(file);
}

function handleIpaFileSelect() {
    if (ipaFileInput.files.length > 0) {
        selectedIpaFile = ipaFileInput.files[0];
        if (selectedIpaFile.name.endsWith('.ipa')) {
            if (selectedIpaNameDisplay) {
                selectedIpaNameDisplay.textContent = selectedIpaFile.name;
            }
            // Показываем модальное окно выбора сертификата
            showIpaCertSelectModal();
        } else {
            alert("Please select a valid .ipa file.");
            ipaFileInput.value = null; // Сбрасываем выбор
        }
    }
}

// --- Обработчики событий ---
function setupCertificateManager() {
    console.log("Setting up certificate manager event listeners...");

    // 1. Открытие модального окна выбора IPA и сертификата
    if (uploadIpaButton && ipaFileInput) {
        uploadIpaButton.addEventListener('click', () => {
            console.log("Upload IPA button clicked. Triggering ipaFileInput...");
            ipaFileInput.click();
        });
        ipaFileInput.addEventListener('change', handleIpaFileSelect);
    } else {
        console.error("Could not find uploadIpaButton or ipaFileInput.");
    }

    // 2. Модальное окно выбора IPA и сертификата
    if (closeIpaCertModal) {
        closeIpaCertModal.addEventListener('click', hideIpaCertSelectModal);
    }
    if (cancelIpaCertSelectionBtn) {
        cancelIpaCertSelectionBtn.addEventListener('click', hideIpaCertSelectModal);
    }
    if (confirmIpaCertSelectionBtn) {
        confirmIpaCertSelectionBtn.addEventListener('click', () => {
            if (selectedIpaFile && selectedCertificate) {
                console.log(`Installing ${selectedIpaFile.name} with certificate ${selectedCertificate.name}`);
                alert(`Installing ${selectedIpaFile.name} with ${selectedCertificate.name}. (Actual installation not implemented)`);
                // TODO: Здесь будет логика установки IPA с использованием выбранного сертификата
                hideIpaCertSelectModal();
            } else {
                alert("Please select an IPA file and a certificate.");
            }
        });
    }
    if (ipaCertSelectModal) {
        ipaCertSelectModal.addEventListener('click', (event) => {
            if (event.target === ipaCertSelectModal) {
                hideIpaCertSelectModal();
            }
        });
    }

    // 3. Модальное окно управления сертификатами
    if (closeManagerModalBtn) {
        closeManagerModalBtn.addEventListener('click', hideCertificateManagerModal);
    }
    if (closeManagerFooterBtn) {
        closeManagerFooterBtn.addEventListener('click', hideCertificateManagerModal);
    }
    if (certificateManagerModal) {
        certificateManagerModal.addEventListener('click', (event) => {
            if (event.target === certificateManagerModal) {
                hideCertificateManagerModal();
            }
        });
    }

    // 4. Кнопки импорта сертификатов
    if (importP12Button && p12FileInput) {
        importP12Button.addEventListener('click', () => p12FileInput.click());
        p12FileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importCertificate(e.target.files[0], 'p12');
                e.target.value = null; // Сброс для возможности повторного выбора
            }
        });
    }
    if (importMobileProvisionButton && mobileprovisionFileInput) {
        importMobileProvisionButton.addEventListener('click', () => mobileprovisionFileInput.click());
        mobileprovisionFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                importCertificate(e.target.files[0], 'mobileprovision');
                e.target.value = null; // Сброс
            }
        });
    }

    // 5. Загрузка сертификатов при старте
    loadCertificates();
}

// --- Инициализация ---
// Эта функция должна быть вызвана после того, как DOM готов.
// Если вы используете один общий script.js, добавьте вызов setupCertificateManager()
// в конец вашего основного DOMContentLoaded обработчика.
// Если это отдельный скрипт, убедитесь, что он подключается после DOM.
// Здесь предполагается, что он будет вызван из основного скрипта.
// Если он будет загружаться отдельно, добавьте:
// document.addEventListener('DOMContentLoaded', setupCertificateManager);

// Для интеграции с вашим основным скриптом, добавьте этот вызов в конец вашего главного script.js:
// setupCertificateManager();

// Если вы хотите, чтобы этот скрипт работал полностью независимо:
document.addEventListener('DOMContentLoaded', setupCertificateManager);