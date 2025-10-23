document.addEventListener('DOMContentLoaded', () => {
    const accountButton = document.getElementById('account-button');
    const accountModal = document.getElementById('account-modal');
    const closeButton = accountModal.querySelector('.cclose-button');

    const loginSection = document.getElementById('login-section');
    const registrationSection = document.getElementById('registration-section');
    const userInfoSection = document.getElementById('user-info-section');

    const usernameLoginInput = document.getElementById('username-login');
    const passwordLoginInput = document.getElementById('password-login');
    const loginButton = document.getElementById('login-button');

    const usernameRegisterInput = document.getElementById('username-register');
    const passwordRegisterInput = document.getElementById('password-register');
    const passwordConfirmInput = document.getElementById('password-confirm');
    const registerButton = document.getElementById('register-button');

    const registerLink = document.getElementById('register-link');
    const loginLink = document.getElementById('login-link');

    const userAvatar = document.getElementById('user-avatar');
    const statusText = document.getElementById('status-text');
    const userCredits = document.getElementById('user-credits');

    const changePasswordButton = document.getElementById('change-password-button');
    const logoutButton = document.getElementById('logout-button');

    const leaderboardList = document.getElementById('leaderboard-list');

    // --- Функции для управления модальным окном ---

    function openModal() {
        accountModal.style.display = 'block';
        // Получаем актуальные данные пользователя и топ
        fetchUserInfo();
        fetchLeaderboard();
    }

    function closeModal() {
        accountModal.style.display = 'none';
        // Сбрасываем форму в состояние логина при закрытии
        loginSection.style.display = 'block';
        registrationSection.style.display = 'none';
        userInfoSection.style.display = 'none';
        usernameLoginInput.value = '';
        passwordLoginInput.value = '';
        usernameRegisterInput.value = '';
        passwordRegisterInput.value = '';
        passwordConfirmInput.value = '';
    }

    // --- Функции для переключения между логином и регистрацией ---

    function showLoginSection() {
        loginSection.style.display = 'block';
        registrationSection.style.display = 'none';
        userInfoSection.style.display = 'none'; // Убедимся, что секция пользователя скрыта
    }

    function showRegistrationSection() {
        loginSection.style.display = 'none';
        registrationSection.style.display = 'block';
        userInfoSection.style.display = 'none';
    }

    function showUserInfoSection(userData) {
        loginSection.style.display = 'none';
        registrationSection.style.display = 'none';
        userInfoSection.style.display = 'block';

        // Отображаем аватар (если есть, иначе стандартный)
        userAvatar.src = userData.avatar ? `uploads/${userData.avatar}` : 'uploads/default_avatar.png'; // Укажите путь к вашим аватарам
        userAvatar.alt = `${userData.username}'s avatar`;

        // Отображаем статус
        statusText.textContent = userData.status.toUpperCase();
        statusText.className = `status-${userData.status}`; // Добавляем класс для стилизации

        userCredits.textContent = userData.credits;
    }

    // --- Обработчики событий ---

    accountButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target === accountModal) {
            closeModal();
        }
    });

    registerLink.addEventListener('click', (event) => {
        event.preventDefault();
        showRegistrationSection();
    });

    loginLink.addEventListener('click', (event) => {
        event.preventDefault();
        showLoginSection();
    });

    // --- Обработчики для кнопок действий ---

    loginButton.addEventListener('click', async () => {
        const username = usernameLoginInput.value.trim();
        const password = passwordLoginInput.value.trim();

        if (!username || !password) {
            alert('Пожалуйста, введите username и пароль.');
            return;
        }

        try {
            const response = await fetch('https://cu843470.tw1.ru/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                alert(`Добро пожаловать, ${data.username}!`);
                showUserInfoSection(data); // Показываем информацию о пользователе
                // Здесь можно установить куки или сессию, чтобы сохранять состояние входа
                // document.cookie = `session_token=${data.session_token}; path=/`;
            } else {
                alert(`Ошибка входа: ${data.message}`);
            }
        } catch (error) {
            console.error('Ошибка при входе:', error);
            alert('Произошла ошибка при попытке входа. Пожалуйста, попробуйте позже.');
        }
    });

    registerButton.addEventListener('click', async () => {
        const username = usernameRegisterInput.value.trim();
        const password = passwordRegisterInput.value.trim();
        const passwordConfirm = passwordConfirmInput.value.trim();

        if (!username || !password || !passwordConfirm) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        if (password !== passwordConfirm) {
            alert('Пароли не совпадают.');
            return;
        }

        try {
            const response = await fetch('https://cu843470.tw1.ru/register.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                alert('Регистрация прошла успешно!');
                showLoginSection(); // Переключаемся обратно на логин
            } else {
                alert(`Ошибка регистрации: ${data.message}`);
            }
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            alert('Произошла ошибка при попытке регистрации. Пожалуйста, попробуйте позже.');
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('https://cu843470.tw1.ru/logout.php', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.success) {
                alert('Вы успешно вышли из аккаунта.');
                showLoginSection();
                // Удаляем куки или сессию
                // document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            } else {
                alert('Ошибка при выходе.');
            }
        } catch (error) {
            console.error('Ошибка при выходе:', error);
            alert('Произошла ошибка при попытке выхода.');
        }
    });

    // --- Функции для получения данных с сервера ---

    async function fetchUserInfo() {
        try {
            const response = await fetch('https://cu843470.tw1.ru/get_user_info.php', {
                method: 'GET',
                headers: {
                    // Если используете сессии/токены, передавайте их здесь
                    // 'Authorization': `Bearer ${getSessionToken()}`
                }
            });

            const data = await response.json();

            if (data.loggedIn) {
                showUserInfoSection(data);
            } else {
                showLoginSection(); // Если не залогинен, показываем форму логина
            }
        } catch (error) {
            console.error('Ошибка при получении информации о пользователе:', error);
            showLoginSection(); // В случае ошибки тоже показываем логин
        }
    }

    async function fetchLeaderboard() {
        try {
            const response = await fetch('https://cu843470.tw1.ru/get_leaderboard.php', {
                method: 'GET',
            });
            const data = await response.json();

            if (data.success) {
                leaderboardList.innerHTML = ''; // Очищаем предыдущий список
                data.users.forEach(user => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="leaderboard-item-username">
                            <img src="${user.avatar ? 'uploads/' + user.avatar : 'uploads/default_avatar.png'}" alt="Avatar" class="leaderboard-avatar">
                            <span>${user.username}</span>
                        </div>
                        <span class="leaderboard-item-credits">${user.credits}</span>
                    `;
                    leaderboardList.appendChild(listItem);
                });
            } else {
                leaderboardList.innerHTML = '<li>Не удалось загрузить топ.</li>';
            }
        } catch (error) {
            console.error('Ошибка при получении топ игроков:', error);
            leaderboardList.innerHTML = '<li>Ошибка загрузки.</li>';
        }
    }

    // --- Инициализация ---
    // При загрузке страницы пытаемся показать информацию о пользователе (если он залогинен)
    fetchUserInfo();
    fetchLeaderboard(); // Загружаем топ при первой загрузке страницы
});