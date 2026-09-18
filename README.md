# Book Catalog

Тестовое frontend-приложение каталога книг на Vue 3, Vite, Vue Router, Pinia, Axios, Bootstrap 5 и SCSS. 
Контракт backend API описан в `book.yaml`.

## Запуск

```bash
npm install
npm run dev
```

Готовый `.env` уже включен в репозиторий. Адрес приложения Vite покажет в терминале.

В `.env` задаются следующие параметры:

- `VITE_USE_MOCK_API=true` - локальные тестовые данные в режиме разработки
- `VITE_USE_MOCK_API=false` - запросы к существующему Yii2 API
- `VITE_API_BASE_URL=/api/v1` - базовый URL реального API

Mock включается только в dev-режиме. Для mock-авторизации используется логин `demo` и пароль `demo`. В mock доступны каталог, авторы, CRUD, отчет TOP-10 авторов и демонстрационная подписка. При создании книги для подписанного автора запрос к публичному эмулятору SMSPilot проходит через Vite proxy, он требует доступа к `https://smspilot.ru`.

## Сборка

```bash
npm run build
```
