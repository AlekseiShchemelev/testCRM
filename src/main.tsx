// src/main.tsx - Точка входа в React приложение
/**
 * Этот файл является точкой входа в React приложение.
 * Здесь происходит инициализация и монтирование корневого компонента App.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/global.css";

/**
 * createRoot() - новый API React 18+ для создания корневого узла
 * Заменяет устаревший ReactDOM.render()
 *
 * Преимущества:
 * - Concurrent Features (конкурентные возможности)
 * - Automatic Batching (автоматическое батчинг)
 * - Better Error Handling (лучшая обработка ошибок)
 *
 * ! - оператор non-null assertion (TypeScript)
 * Указывает, что document.getElementById('root') никогда не вернет null
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  /**
   * React.StrictMode - компонент для разработки
   *
   * Функции:
   * - Выявляет небезопасные жизненные циклы
   * - Предупреждает об использовании устаревшего API строковых рефов
   * - Предупреждает об устаревшем findDOMNode API
   * - Обнаруживает непредвиденные побочные эффекты
   * - Обнаруживает устаревший контекст API
   * - Обеспечивает переиспользование состояния
   *
   * В продакшене не влияет на производительность
   */
  <React.StrictMode>
    {/* Главный компонент приложения */}
    <App />
  </React.StrictMode>
);
