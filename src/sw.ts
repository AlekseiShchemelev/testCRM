/// <reference lib="webworker" />

// Объявляем глобальную переменную для TypeScript
declare const self: ServiceWorkerGlobalScope;
declare const __WB_MANIFEST: Array<{ url: string }>;

// src/sw.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Кэшируем статику (HTML, JS, CSS)
precacheAndRoute(self.__WB_MANIFEST);

// API-запросы — сначала сеть, потом кэш
registerRoute(
  ({ url }) => url.pathname.startsWith('/api') || url.hostname.includes('firebaseio.com'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 день
      }),
    ],
  })
);

// Изображения — кэшируем
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
      }),
    ],
  })
);