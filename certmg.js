// certmg.js

// --- Глобальные переменные ---
let selectedIpaFile = null; // Хранит выбранный IPA файл
let currentImportState = 0; // 0: начальное, 1: выбрано P12, 2: выбрано MobileProvision, 3: введен пароль
let selectedP12File = null; // Хранит выбранный P12 файл
let selectedMobileProvisionFile = null; // Хранит выбранный MobileProvision файл
let certificatePassword = null; // Хранит пароль для P12
let selectedCertificateForManager = null; // Хранит выбранный сертификат для отображения/удаления в менеджере

const certificates = []; // Список импортированных сертификатов
const CERTIFICATES_LS_KEY = 'scarletCertificates'; // Ключ для localStorage

// --- DOM-элементы ---
// Кнопка и input для выбора IPA
const ipaFileInput = document.getElementById('ipaFileInput');
const uploadIpaButton = document.querySelector('.upload-ipa-button');

// Модальное окно управления сертификатами
const certificateManagerModal = document.getElementById('certificate-manager-modal');
const closeManagerModalBtn = document.getElementById('close-manager-modal');
const certListManager = document.getElementById('cert-list-manager');
const importCertificateMainButton = document.getElementById('import-certificate-main-button');
const p12FileInput = document.getElementById('p12FileInput'); // Скрытый input для P12
const mobileprovisionFileInput = document.getElementById('mobileprovisionFileInput'); // Скрытый input для MobileProvision
const closeManagerFooterBtn = document.getElementById('close-manager-footer-button');

// Модальное окно ввода пароля
const passwordModal = document.getElementById('password-modal');
const passwordInput = document.getElementById('password-input');
const cancelPasswordModalBtn = document.getElementById('cancel-password-modal');
const confirmPasswordModalBtn = document.getElementById('confirm-password-modal');
const passwordModalTitle = document.querySelector('#password-modal .modal-header h2'); // Заголовок модалки пароля

// --- Функции управления модальными окнами ---
function showCertificateManagerModal() {
    if (!certificateManagerModal) { console.error("Certificate Manager Modal not found!"); return; }
    console.log("Showing Certificate Manager Modal...");
    certificateManagerModal.classList.add('active');
    renderCertListManager();
}

function hideCertificateManagerModal() {
    if (!certificateManagerModal) return;
    certificateManagerModal.classList.remove('active');
}

function showPasswordModal(promptTitle = "Enter Password") {
    if (!passwordModal) { console.error("Password Modal not found!"); return; }
    if (passwordModalTitle) passwordModalTitle.textContent = promptTitle;
    passwordInput.value = '';
    passwordModal.classList.add('active');
}

function hidePasswordModal() {
    if (!passwordModal) return;
    passwordModal.classList.remove('active');
    passwordInput.value = '';
}

// --- Функции управления сертификатами ---
function saveCertificates() {
    localStorage.setItem(CERTIFICATES_LS_KEY, JSON.stringify(certificates));
    console.log(`Saved ${certificates.length} certificates.`);
}

function loadCertificates() {
    console.log("Loading certificates...");
    const storedCerts = localStorage.getItem(CERTIFICATES_LS_KEY);
    if (storedCerts) {
        try {
            certificates.length = 0;
            JSON.parse(storedCerts).forEach(certData => {
                certificates.push(certData);
            });
            console.log(`Loaded ${certificates.length} certificates.`);
        } catch (error) {
            console.error("Error parsing certificates from localStorage:", error);
            certificates.length = 0;
        }
    } else {
        certificates.length = 0;
        console.log("No certificates found in localStorage.");
    }
    renderCertListManager();
}

function renderCertListManager() {
    if (!certListManager) { console.error("Cert list manager container not found!"); return; }
    certListManager.innerHTML = '';

    if (certificates.length === 0) {
        certListManager.innerHTML = '<p class="empty-list-message">No certificates imported yet.</p>';
        return;
    }

    certificates.forEach((cert, index) => {
        const certItem = document.createElement('div');
        certItem.classList.add('cert-item-manager');

        const isRevoked = cert.revoked || false;
        const statusClass = isRevoked ? 'revoked' : 'signed';
        const statusText = isRevoked ? 'Revoked' : 'Signed';

        let expiresText = 'Unknown';
        try {
            if (cert.expires) {
                const date = new Date(cert.expires);
                if (!isNaN(date.getTime())) {
                    expiresText = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                }
            }
        } catch (e) {
            console.error("Error formatting expiry date:", cert.expires, e);
            expiresText = 'Invalid Date';
        }

        certItem.innerHTML = `
            <div class="radio-wrapper" data-cert-index="${index}">
                <div class="radio-button ${selectedCertificateForManager === cert ? 'selected' : ''}"></div>
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
            <button class="delete-cert-button" aria-label="Delete Certificate" data-cert-index="${index}">🗑️</button> <!-- Кнопка удаления -->
        `;

        // Обработчик выбора сертификата
        certItem.querySelector('.radio-wrapper').addEventListener('click', () => {
            selectCertificateForManager(cert);
        });

        // Обработчик удаления сертификата
        certItem.querySelector('.delete-cert-button').addEventListener('click', (event) => {
            event.stopPropagation(); // Предотвращаем срабатывание выбора при клике на удаление
            deleteCertificate(index);
        });

        certListManager.appendChild(certItem);
    });
}

function selectCertificateForManager(cert) {
    selectedCertificateForManager = cert;
    renderCertListManager();
}

function deleteCertificate(index) {
    if (index >= 0 && index < certificates.length) {
        const certName = certificates[index].name || 'Unnamed Certificate';
        if (confirm(`Are you sure you want to delete certificate "${certName}"?`)) {
            certificates.splice(index, 1); // Удаляем из массива
            saveCertificates();
            renderCertListManager(); // Обновляем отображение
            // Если удаленный сертификат был выбран, сбрасываем выбор
            if (selectedCertificateForManager && selectedCertificateForManager === certName) { // Проверка по имени, если объекты не совпадают
                selectedCertificateForManager = null;
            }
            console.log(`Certificate at index ${index} deleted.`);
        }
    }
}

// --- Функция импорта сертификата (последовательная) ---
function startCertificateImportProcess() {
    // Сброс состояний перед началом нового импорта
    currentImportState = 0;
    selectedP12File = null;
    selectedMobileProvisionFile = null;
    certificatePassword = null;
    selectedCertificateForManager = null; // Сбрасываем выбор, если был

    // 1. Триггер выбора P12 файла
    console.log("Starting import: Prompting for .p12 file...");
    p12FileInput.click();
}

// Обработчик для P12 файла
function handleP12FileSelect() {
    if (p12FileInput.files.length > 0) {
        selectedP12File = p12FileInput.files[0];
        console.log(`P12 file selected: ${selectedP12File.name}`);
        currentImportState = 1; // Устанавливаем состояние: P12 выбран

        // 2. Триггер выбора MobileProvision файла
        setTimeout(() => {
            console.log("Prompting for .mobileprovision file...");
            mobileprovisionFileInput.click();
        }, 100);
    } else {
        console.log("P12 file selection cancelled.");
        resetImportProcess(); // Сброс, если пользователь отменил выбор
    }
}

// Обработчик для MobileProvision файла
function handleMobileProvisionFileSelect() {
    if (mobileprovisionFileInput.files.length > 0) {
        selectedMobileProvisionFile = mobileprovisionFileInput.files[0];
        console.log(`MobileProvision file selected: ${selectedMobileProvisionFile.name}`);
        currentImportState = 2; // Устанавливаем состояние: MobileProvision выбран

        // 3. Запрашиваем пароль
        showPasswordModal("Enter password for .p12 file");
    } else {
        console.log("MobileProvision file selection cancelled.");
        resetImportProcess(); // Сброс, если пользователь отменил выбор
    }
}

// Обработчик для подтверждения пароля
function handlePasswordConfirmation() {
    if (passwordInput.value) {
        certificatePassword = passwordInput.value;
        console.log("Password entered.");
        hidePasswordModal();
        currentImportState = 3; // Устанавливаем состояние: пароль введен

        // 4. Финальная обработка - добавление сертификата в список
        finalizeCertificateImport();
    } else {
        alert("Password cannot be empty.");
        // Не сбрасываем состояние, чтобы дать пользователю шанс ввести пароль снова
    }
}

// Сброс процесса импорта
function resetImportProcess() {
    currentImportState = 0;
    selectedP12File = null;
    selectedMobileProvisionFile = null;
    certificatePassword = null;
    p12FileInput.value = null;
    mobileprovisionFileInput.value = null;
    console.log("Import process reset.");
}

// Финальный шаг импорта
function finalizeCertificateImport() {
    if (!selectedP12File || !selectedMobileProvisionFile || !certificatePassword || currentImportState < 3) {
        console.error("Import process failed: Missing required information or incorrect state.");
        alert("Error during import: missing required information or process interrupted.");
        resetImportProcess();
        return;
    }

    console.log(`Finalizing import for P12: ${selectedP12File.name}, MP: ${selectedMobileProvisionFile.name}, Password: [provided]`);

    // --- Здесь должна быть реальная логика парсинга P12, MobileProvision и пароля ---
    // Это сложная задача, требующая криптографических библиотек.
    // Ниже - только заглушка.

    const newCertData = {
        // Генерируем уникальный ID или используем имя P12 файла
        id: `cert_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name: `${selectedP12File.name.replace('.p12', '')} + ${selectedMobileProvisionFile.name.replace('.mobileprovision', '')}`, // Примерное имя
        // Извлеченные данные (заглушка)
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Примерно год в будущем
        revoked: false, // По умолчанию не отозван
        // В реальном приложении здесь будут данные, извлеченные из файлов
        // p12RawData: selectedP12File, // Или ссылка на него, если нужно хранить
        // mpRawData: selectedMobileProvisionFile,
        // passwordHash: hash(certificatePassword) // Пароль лучше не хранить напрямую
    };

    certificates.push(newCertData);
    saveCertificates();
    renderCertListManager(); // Обновляем список в менеджере

    alert(`Certificate "${newCertData.name}" imported successfully (mock data).`);

    resetImportProcess(); // Сбрасываем после успешного импорта
}

// --- Инициализация ---
function setupCertificateManager() {
    console.log("Setting up certificate manager event listeners...");

    // 1. Кнопка выбора IPA (короткое нажатие) / Открытие менеджера (долгое нажатие)
    let holdTimer = null;
    const holdDuration = 3000;

    const startHoldOrClick = (event) => {
        event.preventDefault();
        if (event.type === 'mousedown' || event.type === 'touchstart') {
            console.log(`Upload IPA button: ${event.type} detected. Starting hold timer...`);
            holdTimer = setTimeout(() => {
                console.log("Hold duration reached. Opening Certificate Manager...");
                showCertificateManagerModal();
                holdTimer = null; // Таймер сработал
            }, holdDuration);
        } else if (event.type === 'mouseup' || event.type === 'touchend') {
            if (holdTimer) { // Если таймер был запущен и не сработал (короткое нажатие)
                clearTimeout(holdTimer);
                holdTimer = null;
                console.log("Short press detected. Triggering ipaFileInput...");
                ipaFileInput.click(); // Открываем диалог выбора файла
            } else {
                console.log("Hold completed or already handled.");
            }
        }
    };

    uploadIpaButton.addEventListener('mousedown', startHoldOrClick);
    uploadIpaButton.addEventListener('touchstart', startHoldOrClick);
    uploadIpaButton.addEventListener('mouseup', startHoldOrClick);
    uploadIpaButton.addEventListener('touchend', startHoldOrClick);
    // Предотвращаем стандартное поведение, если это ссылка или другая кнопка
    uploadIpaButton.addEventListener('click', (event) => event.preventDefault());

    // 2. Обработчик выбора IPA файла
    ipaFileInput.addEventListener('change', () => {
        if (ipaFileInput.files.length > 0) {
            selectedIpaFile = ipaFileInput.files[0];
            if (selectedIpaFile.name.endsWith('.ipa')) {
                console.log(`Selected IPA file: ${selectedIpaFile.name}`);
                alert(`IPA file "${selectedIpaFile.name}" selected. Use the Certificate Manager to import certificates and proceed with installation.`);
            } else {
                alert("Please select a valid .ipa file.");
                selectedIpaFile = null;
            }
        } else {
            console.log("IPA file selection cancelled.");
            selectedIpaFile = null;
        }
        ipaFileInput.value = null; // Сбрасываем инпут
    });

    // 3. Модальное окно управления сертификатами
    if (closeManagerModalBtn) closeManagerModalBtn.addEventListener('click', hideCertificateManagerModal);
    if (closeManagerFooterBtn) closeManagerFooterBtn.addEventListener('click', hideCertificateManagerModal);
    if (certificateManagerModal) {
        certificateManagerModal.addEventListener('click', (event) => {
            if (event.target === certificateManagerModal) {
                hideCertificateManagerModal();
            }
        });
    }

    // 4. Основная кнопка импорта сертификата
    if (importCertificateMainButton) {
        importCertificateMainButton.addEventListener('click', startCertificateImportProcess);
    }

    // 5. Файловые инпуты для P12 и MobileProvision
    // Эти инпуты вызываются программно кнопками
    if (p12FileInput) {
        p12FileInput.addEventListener('change', handleP12FileSelect);
    }
    if (mobileprovisionFileInput) {
        mobileprovisionFileInput.addEventListener('change', handleMobileProvisionFileSelect);
    }

    // 6. Модальное окно ввода пароля
    if (cancelPasswordModalBtn) {
        cancelPasswordModalBtn.addEventListener('click', () => {
            hidePasswordModal();
            resetImportProcess(); // Сброс процесса при отмене пароля
        });
    }
    if (confirmPasswordModalBtn) {
        confirmPasswordModalBtn.addEventListener('click', handlePasswordConfirmation);
    }
    if (passwordModal) {
        passwordModal.addEventListener('click', (event) => {
            if (event.target === passwordModal) {
                hidePasswordModal();
                resetImportProcess(); // Сброс при закрытии модалки вне
            }
        });
    }

    // 7. Загрузка существующих сертификатов при старте
    loadCertificates();
}

// --- Инициализация ---
// Убедитесь, что эта функция вызывается после загрузки DOM,
// и что она не использует document.addEventListener('DOMContentLoaded', ...) сама по себе.
// Вызовите ее из основного script.js:
// setupCertificateManager();
// Или, если этот файл подключается отдельно и должен работать независимо:
document.addEventListener('DOMContentLoaded', setupCertificateManager);