# Настройка Firebase

## Переменные окружения

Перед запуском приложения необходимо настроить переменные окружения для Firebase.

### 1. Создайте файл .env в корне проекта

```bash
cp .env.example .env
```

### 2. Заполните файл .env своими данными из Firebase Console

Получите конфигурацию Firebase:
1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. Перейдите в Settings > General
4. В разделе "Your apps" найдите веб-приложение или создайте новое
5. Скопируйте конфигурацию и заполните .env файл

Пример заполненного .env файла:
```env
VITE_FIREBASE_API_KEY=AIzaSyDn24WoPngXE49Ax0ETVV51XolhTbfvo74
VITE_FIREBASE_AUTH_DOMAIN=realtor-crm-e217e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=realtor-crm-e217e
VITE_FIREBASE_STORAGE_BUCKET=realtor-crm-e217e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=73073318558
VITE_FIREBASE_APP_ID=1:73073318558:web:af820f8dd3b1e67ec7f98f
VITE_FIREBASE_MEASUREMENT_ID=G-RJT0XV28BF
```

### 3. Важные замечания

- Файл `.env` автоматически игнорируется Git (добавлен в .gitignore)
- Никогда не коммитьте файл `.env` с реальными ключами в систему контроля версий
- Для разных сред (development, production) используйте разные .env файлы
- Переменные должны начинаться с `VITE_` чтобы быть доступными в браузере

### 4. Безопасность

- Firebase API ключи для клиентских приложений по умолчанию ограничены доменами
- Убедитесь, что в Firebase Console настроены правильные ограничения доменов
- Регулярно ротируйте ключи в продакшене