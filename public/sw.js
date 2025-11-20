// public/sw.js
const CACHE_NAME = 'realtor-crm-v1';
const API_CACHE = 'api-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Перехватываем запросы к Firestore
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Если это запрос к Firebase (Firestore), пробуем синхронизировать в фоне при ошибке
  if (url.hostname.includes('firestore.googleapis.com') && event.request.method === 'POST') {
    event.respondWith(
      handleFirestoreRequest(event.request)
    );
  } else {
    // Обычный кэш для статики
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});

async function handleFirestoreRequest(request) {
  try {
    // Пробуем отправить запрос
    const response = await fetch(request.clone());
    if (response.ok) {
      return response;
    }
  } catch (err) {
    // Нет интернета → сохраняем запрос на потом
    const queue = await getOutbox();
    const entry = {
      id: Date.now(),
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.clone().text(),
      timestamp: Date.now()
    };
    queue.push(entry);
    await setOutbox(queue);

    // Регистрируем фоновую синхронизацию (если поддерживается)
    if (self.registration.sync) {
      self.registration.sync.register('sync-outbox');
    }

    // Возвращаем "успешный" ответ, чтобы UI не сломался
    return new Response(JSON.stringify({ queued: true }), { status: 202 });
  }

  // Если ответ пришёл, но не OK — прокидываем ошибку
  return fetch(request);
}

// Background Sync: отправка накопленных изменений
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    event.waitUntil(syncOutbox());
  }
});

async function syncOutbox() {
  const queue = await getOutbox();
  const failed = [];

  for (const entry of queue) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body
      });

      if (!response.ok) {
        failed.push(entry);
      }
      // Успешно отправлено → удаляем из очереди
    } catch (err) {
      failed.push(entry); // Остаётся в очереди
    }
  }

  await setOutbox(failed);
}

// Работа с IndexedDB для хранения очереди
function getOutbox() {
  return new Promise((resolve) => {
    const open = indexedDB.open('realtor-crm-db', 1);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
    };
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }
    };
  });
}

function setOutbox(queue) {
  return new Promise((resolve) => {
    const open = indexedDB.open('realtor-crm-db', 1);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      store.clear();
      queue.forEach(item => store.put(item));
      tx.oncomplete = () => resolve();
    };
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }
    };
  });
}