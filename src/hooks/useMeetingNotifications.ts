// src/hooks/useMeetingNotifications.ts
import { useEffect } from "react";
import { getClientsByDate } from "../services/clientService";

export const useMeetingNotifications = () => {
  useEffect(() => {
    // Проверяем поддержку уведомлений
    if (!("Notification" in window)) {
      console.warn("Браузер не поддерживает уведомления");
      return;
    }

    // Функция для запроса разрешения на уведомления
    const requestNotificationPermission = async () => {
      if (Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          console.log("Разрешение на уведомления:", permission);
        } catch (error) {
          console.warn("Ошибка при запросе разрешения на уведомления:", error);
        }
      }
    };

    // Функция для проверки предстоящих встреч
    const checkUpcomingMeetings = async () => {
      try {
        const now = new Date();
        const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);

        // Получаем встречи на дату через 15 минут
        const meetings = await getClientsByDate(fifteenMinutesLater);

        // Фильтруем встречи, которые действительно в ближайшие 15 минут
        const upcomingMeetings = meetings.filter((client) => {
          const meetingTime = new Date(client.meetingDate);
          const timeDiff = meetingTime.getTime() - now.getTime();
          return timeDiff > 0 && timeDiff <= 15 * 60 * 1000; // Между сейчас и 15 минутами
        });

        // Показываем уведомления для предстоящих встреч
        upcomingMeetings.forEach((client) => {
          // Проверяем, что разрешение на уведомления получено
          if (Notification.permission === "granted") {
            // Создаем уникальный идентификатор для предотвращения дублирования
            const notificationId = `meeting_${client.id}_${client.meetingDate}`;

            // Проверяем, не было ли уже показано уведомление для этой встречи
            if (!sessionStorage.getItem(notificationId)) {
              new Notification("Напоминание о встрече", {
                body: `Встреча с ${client.fullName} через ${Math.ceil(
                  (new Date(client.meetingDate).getTime() - now.getTime()) /
                    (1000 * 60)
                )} минут\n📍 ${client.address}`,
                icon: "/icons/icon-192x192.png",
                tag: notificationId, // Для группировки уведомлений
                requireInteraction: false,
              });

              // Сохраняем информацию о показанном уведомлении
              sessionStorage.setItem(notificationId, "shown");
            }
          }
        });
      } catch (error) {
        console.error("Ошибка при проверке предстоящих встреч:", error);
        // Не прерываем интервал из-за ошибки
      }
    };

    // Запрашиваем разрешение при инициализации
    requestNotificationPermission();

    // Запускаем первую проверку через 5 секунд
    const initialTimeout = setTimeout(checkUpcomingMeetings, 5000);

    // Устанавливаем интервал для регулярной проверки (каждую минуту)
    const interval = setInterval(checkUpcomingMeetings, 60 * 1000);

    // Очистка при размонтировании компонента
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);
};
