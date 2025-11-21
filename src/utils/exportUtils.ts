// Альтернативная версия функции экспорта
export const exportHistoryToCSV = (
  history: any[],
  filename: string,
  showSuccess?: (message: string) => void
) => {
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

  const csvContent = history.map((h) => {
    const client = clients.find((c: any) => c.id === h.clientId);

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

  // Создаем CSV с правильной кодировкой
  let csv = headers.join(",") + "\n";
  csvContent.forEach(row => {
    csv += row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",") + "\n";
  });

  // Используем UTF-8 с BOM
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv; charset=utf-8"
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);

  if (showSuccess) {
    showSuccess("История экспортирована в CSV");
  }
};
