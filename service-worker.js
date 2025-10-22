// service-worker.js

const CACHE_NAME = 'scarletVcW'; // Уникальное имя для вашего кэша
const urlsToCache = [
    '/', 
    '/index.html', 
    '/certmg.js.js', 
    '/details.js', 
    '/repos.js', 
    '/script.js', 
    '/search.js', 




    '/sw.js', 




// Главная страница
    '/banner.css', // Главный HTML файл (если отличается от корня)
    '/down.css', // Ваш основной CSS файл
    '/navbarM.css', // CSS для модальных окон
    '/status.css', // Иконка загрузки IPA (пример)
    '/style.css', // Ваш скрипт для сертификатов
    '/service-worker.js', 
    '/manifest.json', 
    '/scarlet.json', 
    '/+.png', 
    '/add.png', 
    '/b-install.png', 
    '/banner-1.png', 
    '/bannerapp.png', 
    '/icon.png', 
    '/ipadown.png', 
    '/navdown.png', 
    '/navhome.png', 
    '/navsearch.png', 





// Ваш основной скрипт
    // Добавьте сюда все ресурсы, которые должны быть доступны офлайн:
    // - Другие CSS файлы
    // - JavaScript файлы (если есть)
    // - Изображения (иконки, логотипы)
    // - Шрифты
    // - Возможно, сам JSON с данными приложений, если он небольшой
    // - Любые другие статические файлы, которые необходимы для отображения
];

// --- Событие установки Service Worker ---
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing Service Worker...');
    // event.waitUntil() гарантирует, что Service Worker будет установлен только после
    // завершения операции внутри (в данном случае, кэширования ресурсов).
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell...');
                return cache.addAll(urlsToCache); // Добавляем все URL в кэш
            })
            .then(() => {
                console.log('[Service Worker] App shell cached successfully.');
                // self.skipWaiting(); // Можно раскомментировать, чтобы SW активировался сразу, без перезагрузки страницы
            })
            .catch((error) => {
                console.error('[Service Worker] Failed to cache app shell:', error);
            })
    );
});

// --- Событие активации Service Worker ---
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating Service Worker...');
    // event.waitUntil() гарантирует, что активация завершится перед тем, как SW начнет управлять страницами.
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            // Удаляем старые кэши, если они есть
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('[Service Worker] Old caches deleted.');
            // return self.clients.claim(); // Важно, чтобы SW начал управлять всеми клиентами (окнами)
        })
        .catch(error => console.error('[Service Worker] Error during activation:', error))
    );
});

// --- Событие перехвата запросов ---
self.addEventListener('fetch', (event) => {
    console.log('[Service Worker] Fetching:', event.request.url);

    // Проверяем, является ли запрос к тому же источнику (origin)
    // Если нет, не кэшируем (например, запросы к API или внешним ресурсам, если они есть)
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request) // Пытаемся найти ресурс в кэше
                .then((response) => {
                    if (response) {
                        console.log('[Service Worker] Found in cache:', event.request.url);
                        return response; // Возвращаем кэшированный ответ
                    }

                    // Если в кэше не найдено, делаем запрос к сети
                    console.log('[Service Worker] Not found in cache, fetching from network:', event.request.url);
                    return fetch(event.request)
                        .then((networkResponse) => {
                            // Если ответ из сети успешен, кэшируем его для будущих запросов
                            // Важно: не кэшируем динамические ответы или ошибки
                            if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
                                console.log('[Service Worker] Caching network response:', event.request.url);
                                // Клонируем ответ, так как response.clone() нужен для кэширования,
                                // а оригинал идет в браузер.
                                const responseToCache = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(event.request, responseToCache);
                                    });
                            }
                            return networkResponse; // Возвращаем оригинальный ответ сети
                        })
                        .catch((error) => {
                            console.error('[Service Worker] Network request failed:', event.request.url, error);
                            // В случае ошибки сети, можно вернуть офлайн-страницу или пустой ответ
                            // return new Response('<h1>Offline</h1><p>You are offline.</p>', { headers: {'Content-Type': 'text/html'} });
                            return new Response(null, { status: 404, statusText: 'Not Found' }); // Или вернуть 404
                        });
                })
                .catch((error) => {
                    console.error('[Service Worker] Error during fetch event:', error);
                    // return new Response('<h1>Offline</h1><p>You are offline.</p>', { headers: {'Content-Type': 'text/html'} });
                    return new Response(null, { status: 500, statusText: 'Internal Server Error' });
                })
        );
    } else {
        // Если запрос не к тому же источнику, просто отправляем его в сеть
        // console.log('[Service Worker] Request to different origin, bypassing cache:', event.request.url);
        return; // Не перехватываем запросы к другим доменам
    }
});

// --- Обработка push-уведомлений (опционально) ---
// self.addEventListener('push', (event) => {
//     const options = {
//         body: 'This is a notification from your PWA!',
//         icon: '/icon-192x192.png', // Путь к вашей иконке уведомления
//         vibrate: [100, 200, 100, 200, 100, 200]
//     };
//     event.waitUntil(
//         self.registration.showNotification('PWA Notification', options)
//     );
// });

// --- Обработка клика по уведомлению (опционально) ---
// self.addEventListener('notificationclick', (event) => {
//     console.log('[Service Worker] Notification click:', event.notification.tag);
//     // Закрываем уведомление
//     event.notification.close();
//     // Открываем главное окно приложения или конкретную страницу
//     event.waitUntil(
//         clients.openWindow('/') // Открываем главную страницу
//     );
// });