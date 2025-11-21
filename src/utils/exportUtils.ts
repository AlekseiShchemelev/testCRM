// src/utils/exportUtils.ts - Утилиты для экспорта данных

/**
 * Экспортирует историю действий в CSV файл с полной информацией о клиентах
 * @param history - массив записей истории
 * @param filename - имя файла для скачивания
 * @param showSuccess - функция для показа успешного сообщения
 */
export const exportHistoryToCSV = (
  history: any[],
  filename: string,
  showSuccess?: (message: string) => void
) => {
  // Получаем всех клиентов для дополнительной информации
  const clients = JSON.parse(localStorage.getItem("clients") || "[]");

  const headers = [
    "Дата и время",
    "Действие",
    "ID клиента",
    "ФИО клиента",
    "Телефон",
    "Адрес",
    "Дата и время встречи",
    "Ссылка на объявление",
    "Детали",
  ];

  const csvRows = history.map((h) => {
    const client = clients.find((c: any) => c.id === h.clientId);

    // Форматируем действие для читаемости
    let actionText = "";
    switch (h.action) {
      case "created":
        actionText = "Создан";
        break;
      case "updated":
        actionText = "Изменен";
        break;
      case "deleted":
        actionText = "Удален";
        break;
      case "meeting_completed":
        actionText = "Встреча завершена";
        break;
      case "meeting_cancelled":
        actionText = "Встреча отменена";
        break;
      default:
        actionText = h.action;
    }

    return [
      new Date(h.timestamp).toLocaleString("ru-RU"),
      actionText,
      h.clientId,
      client?.fullName || "Неизвестно",
      client?.phone || "",
      client?.address || "",
      client?.meetingDate
        ? new Date(client.meetingDate).toLocaleString("ru-RU")
        : "",
      client?.listingUrl || "",
      h.details || "",
    ];
  });

  const content = [
    headers.join("\t"),
    ...csvRows.map((row) => row.join("\t")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv; charset=utf-8",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  if (showSuccess) {
    showSuccess("История экспортирована с полной информацией о клиентах");
  }
};

/**
 * Создает имя файла с текущей датой
 * @param prefix - префикс имени файла
 * @returns имя файла с датой
 */
export const createFilenameWithDate = (prefix: string): string => {
  const date = new Date().toISOString().split("T")[0];
  return `${prefix}_${date}.csv`;
};