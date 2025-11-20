// src/hooks/useNotifications.tsx - Система уведомлений
/**
 * Эта система уведомлений демонстрирует альтернативный подход к глобальному состоянию
 * без использования React Context API.
 *
 * Архитектурные решения:
 * - Глобальные переменные для хранения состояния
 * - Система подписок/подписчиков для обновления компонентов
 * - Простая и эффективная реализация для небольших приложений
 * - Material UI Snackbar для отображения
 *
 * Преимущества данного подхода:
 * - Простота реализации
 * - Отсутствие re-render'ов от Context
 * - Минимальный overhead
 *
 * Недостатки:
 * - Глобальные переменные (потенциальные проблемы с SSR)
 * - Сложнее тестировать
 * - Не подходит для больших приложений
 */

import React, { useState, useCallback } from "react";
import { Snackbar, Alert, AlertTitle } from "@mui/material";

/**
 * Типы для вариантов уведомлений
 * Соответствуют типам Alert из Material UI
 */
export type NotificationVariant = "success" | "error" | "warning" | "info";

/**
 * Интерфейс состояния уведомления
 * Определяет структуру данных для каждого уведомления
 */
export interface NotificationState {
  /** Уникальный ID уведомления */
  id: string;
  /** Текст сообщения */
  message: string;
  /** Тип уведомления (определяет цвет и иконку) */
  variant: NotificationVariant;
  /** Заголовок уведомления (опционально) */
  title?: string;
  /** Время автоскрытия в миллисекундах (опционально) */
  autoHideDuration?: number;
  /** Флаг постоянного отображения (не скрывать автоматически) */
  persist?: boolean;
}

/**
 * Счетчик для генерации уникальных ID уведомлений
 * Используется простой инкремент, достаточно для большинства случаев
 */
let notificationIdCounter = 0;

// Глобальный стейт для уведомлений (альтернатива Context API)
/**
 * Массив активных уведомлений
 * Хранится как глобальная переменная для простого доступа из любого места
 */
let notificationsState: NotificationState[] = [];

/**
 * Массив функций-подписчиков на изменения уведомлений
 * Каждый компонент, использующий useNotifications, регистрирует свою функцию
 * для получения обновлений состояния
 */
let listeners: Array<(notifications: NotificationState[]) => void> = [];

/**
 * Уведомляет всех подписчиков об изменении состояния уведомлений
 *
 * Создает копию массива уведомлений и передает её всем зарегистрированным
 * функциям-подписчикам. Это обеспечивает синхронизацию между компонентами.
 */
const notifyListeners = () => {
  listeners.forEach((listener) => listener([...notificationsState]));
};

/**
 * Показывает новое уведомление
 *
 * @param {string} message - Текст сообщения
 * @param {NotificationVariant} variant - Тип уведомления (по умолчанию "info")
 * @param {object} options - Дополнительные опции
 * @returns {string} ID созданного уведомления
 */
export const showNotification = (
  message: string,
  variant: NotificationVariant = "info",
  options: {
    title?: string;
    autoHideDuration?: number;
    persist?: boolean;
  } = {}
) => {
  // Генерируем уникальный ID для уведомления
  const id = `notification_${++notificationIdCounter}`;

  // Создаем объект уведомления
  const notification: NotificationState = {
    id,
    message,
    variant,
    ...options,
  };

  // Добавляем уведомление в глобальное состояние
  notificationsState.push(notification);

  // Уведомляем всех подписчиков об изменении
  notifyListeners();

  // Автоматически скрываем уведомление если не указано persist
  if (!options.persist) {
    // Для ошибок даем больше времени на прочтение
    const duration =
      options.autoHideDuration || (variant === "error" ? 6000 : 4000);

    // Устанавливаем таймер для автоскрытия
    setTimeout(() => {
      hideNotification(id);
    }, duration);
  }

  return id;
};

/**
 * Скрывает уведомление по ID
 *
 * @param {string} id - ID уведомления для скрытия
 */
export const hideNotification = (id: string) => {
  // Фильтруем массив, удаляя уведомление с указанным ID
  notificationsState = notificationsState.filter((n) => n.id !== id);
  // Уведомляем подписчиков об изменении
  notifyListeners();
};

/**
 * Скрывает все активные уведомления
 */
export const hideAllNotifications = () => {
  // Очищаем массив уведомлений
  notificationsState = [];
  // Уведомляем подписчиков об изменении
  notifyListeners();
};

/**
 * Хук для использования системы уведомлений в компонентах
 *
 * Возвращает объект с:
 * - notifications: массив активных уведомлений
 * - showSuccess, showError, showWarning, showInfo: методы для показа уведомлений
 * - hide, hideAll: методы для скрытия уведомлений
 *
 * @returns {object} Методы и состояние для работы с уведомлениями
 */
export const useNotifications = () => {
  // Локальное состояние компонента для хранения копии уведомлений
  const [notifications, setNotifications] = useState<NotificationState[]>([
    ...notificationsState,
  ]);

  /**
   * Регистрирует функцию-подписчик для получения обновлений
   *
   * @param {Function} listener - Функция для вызова при изменении уведомлений
   * @returns {Function} Функция отписки
   */
  const subscribe = (
    listener: (notifications: NotificationState[]) => void
  ) => {
    // Добавляем функцию в массив подписчиков
    listeners.push(listener);

    // Возвращаем функцию отписки
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  };

  /**
   * Подписываемся на изменения глобального состояния уведомлений
   * при монтировании компонента и отписываемся при размонтировании
   */
  React.useEffect(() => {
    const unsubscribe = subscribe(setNotifications);
    return unsubscribe; // Отписка при размонтировании
  }, []);

  /**
   * Удобные методы для показа уведомлений разных типов
   * Каждый метод устанавливает соответствующий variant
   */

  const showSuccess = (
    message: string,
    options?: Omit<NotificationState, "id" | "message" | "variant">
  ) => {
    return showNotification(message, "success", options);
  };

  const showError = (
    message: string,
    options?: Omit<NotificationState, "id" | "message" | "variant">
  ) => {
    return showNotification(message, "error", options);
  };

  const showWarning = (
    message: string,
    options?: Omit<NotificationState, "id" | "message" | "variant">
  ) => {
    return showNotification(message, "warning", options);
  };

  const showInfo = (
    message: string,
    options?: Omit<NotificationState, "id" | "message" | "variant">
  ) => {
    return showNotification(message, "info", options);
  };

  // Мемоизированные функции для предотвращения лишних ре-рендеров
  const hide = useCallback((id: string) => {
    hideNotification(id);
  }, []);

  const hideAll = useCallback(() => {
    hideAllNotifications();
  }, []);

  return {
    notifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hide,
    hideAll,
  };
};

/**
 * Компонент для отображения уведомлений
 *
 * Рендерит каждое активное уведомление как Material UI Snackbar
 * с соответствующим Alert компонентом.
 *
 * Позиционируется внизу экрана по центру.
 * Каждое уведомление имеет небольшое смещение для визуального разделения.
 */
export const NotificationsContainer = () => {
  const { notifications, hide } = useNotifications();

  return (
    <>
      {/* Маппим массив уведомлений на компоненты Snackbar */}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true} // Snackbar всегда открыт, управляем видимостью через наличие в массиве
          onClose={() => hide(notification.id)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          sx={{
            // Позиционируем каждое уведомление с небольшим смещением
            "&:not(:last-child)": {
              marginBottom: 1,
            },
          }}
        >
          <Alert
            onClose={() => hide(notification.id)}
            severity={notification.variant}
            variant="filled"
            sx={{
              width: "100%",
              borderRadius: 2,
              fontSize: "0.875rem",
              fontWeight: 500,
              "& .MuiAlert-message": {
                width: "100%",
              },
            }}
          >
            {/* Отображаем заголовок если он есть */}
            {notification.title && (
              <AlertTitle sx={{ fontWeight: 600 }}>
                {notification.title}
              </AlertTitle>
            )}
            {/* Основной текст сообщения */}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};
