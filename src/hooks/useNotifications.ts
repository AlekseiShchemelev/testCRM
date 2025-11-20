import React, { useState, useCallback } from "react";
import { Snackbar, Alert, AlertTitle } from "@mui/material";

export type NotificationVariant = "success" | "error" | "warning" | "info";

export interface NotificationState {
  id: string;
  message: string;
  variant: NotificationVariant;
  title?: string;
  autoHideDuration?: number;
  persist?: boolean;
}

let notificationIdCounter = 0;

// Глобальный стейт для уведомлений (простая реализация без контекста)
let notificationsState: NotificationState[] = [];
let listeners: Array<(notifications: NotificationState[]) => void> = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...notificationsState]));
};

export const showNotification = (
  message: string,
  variant: NotificationVariant = "info",
  options: {
    title?: string;
    autoHideDuration?: number;
    persist?: boolean;
  } = {}
) => {
  const id = `notification_${++notificationIdCounter}`;
  const notification: NotificationState = {
    id,
    message,
    variant,
    ...options,
  };

  notificationsState.push(notification);
  notifyListeners();

  // Автоматически скрываем уведомление если не persist
  if (!options.persist) {
    const duration =
      options.autoHideDuration || (variant === "error" ? 6000 : 4000);
    setTimeout(() => {
      hideNotification(id);
    }, duration);
  }

  return id;
};

export const hideNotification = (id: string) => {
  notificationsState = notificationsState.filter((n) => n.id !== id);
  notifyListeners();
};

export const hideAllNotifications = () => {
  notificationsState = [];
  notifyListeners();
};

// Хук для использования в компонентах
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationState[]>([
    ...notificationsState,
  ]);

  // Подписываемся на изменения
  const subscribe = useCallback(
    (listener: (notifications: NotificationState[]) => void) => {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    []
  );

  // Обновляем локальный стейт при изменениях
  useState(() => {
    const unsubscribe = subscribe(setNotifications);
    return unsubscribe;
  });

  const showSuccess = useCallback(
    (
      message: string,
      options?: Omit<NotificationState, "id" | "message" | "variant">
    ) => {
      return showNotification(message, "success", options);
    },
    []
  );

  const showError = useCallback(
    (
      message: string,
      options?: Omit<NotificationState, "id" | "message" | "variant">
    ) => {
      return showNotification(message, "error", options);
    },
    []
  );

  const showWarning = useCallback(
    (
      message: string,
      options?: Omit<NotificationState, "id" | "message" | "variant">
    ) => {
      return showNotification(message, "warning", options);
    },
    []
  );

  const showInfo = useCallback(
    (
      message: string,
      options?: Omit<NotificationState, "id" | "message" | "variant">
    ) => {
      return showNotification(message, "info", options);
    },
    []
  );

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

// Компонент для отображения уведомлений
export const NotificationsContainer = () => {
  const { notifications, hide } = useNotifications();

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
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
            {notification.title && (
              <AlertTitle sx={{ fontWeight: 600 }}>
                {notification.title}
              </AlertTitle>
            )}
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};
