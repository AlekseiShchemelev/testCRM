// src/utils/exportUtils.ts - Утилиты для экспорта данных

/**
 * Получает клиентов из Firebase через clientService
 */
const getClientsFromFirebase = async (): Promise<any[]> => {
  try {
    console.log("🔍 Получение клиентов из Firebase...");

    // Импортируем функцию getClients из clientService
    const { getClients } = await import("../services/clientService");

    // Получаем клиентов из Firebase
    const clients = await getClients();
    console.log("✅ Клиенты из Firebase:", clients);

    return clients || [];
  } catch (error) {
    console.error("❌ Ошибка при получении клиентов из Firebase:", error);

    // Пробуем получить из localStorage как fallback
    try {
      const localData = localStorage.getItem("clients");
      if (localData) {
        console.log("✅ Используем клиенты из localStorage");
        return JSON.parse(localData);
      }
    } catch (localError) {
      console.error("❌ Ошибка при получении из localStorage:", localError);
    }

    return [];
  }
};

/**
 * Экспортирует историю действий в CSV файл с полной информацией о клиентах
 * @param history - массив записей истории
 * @param filename - имя файла для скачивания
 * @param showSuccess - функция для показа успешного сообщения
 */
export const exportHistoryToCSV = async (
  history: any[],
  filename: string,
  showSuccess?: (message: string) => void
) => {
  try {
    console.log("📊 Начало экспорта истории...");

    // Получаем всех клиентов из Firebase
    const clients = await getClientsFromFirebase();
    console.log("📋 Всего клиентов из Firebase:", clients.length);
    console.log("📝 Записей истории:", history.length);

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
      // Ищем клиента по ID
      const client = clients.find((c: any) => c.id === h.clientId);

      console.log("🔍 Поиск клиента для записи:", {
        historyId: h.id,
        clientId: h.clientId,
        найденКлиент: client ? "✅" : "❌",
        имяКлиента: client?.fullName || "Не найдено",
      });

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

      // Экранируем данные для CSV
      const escapeCSV = (field: any) => {
        if (field === null || field === undefined) return "";
        const stringField = String(field);
        // Если поле содержит запятые, кавычки или переносы строк, заключаем в кавычки
        if (
          stringField.includes(",") ||
          stringField.includes('"') ||
          stringField.includes("\n")
        ) {
          return '"' + stringField.replace(/"/g, '""') + '"';
        }
        return stringField;
      };

      // Получаем данные клиента
      const clientName = client?.fullName || "Неизвестно";
      const clientPhone = client?.phone || "";
      const clientAddress = client?.address || "";
      const meetingDate = client?.meetingDate
        ? new Date(client.meetingDate).toLocaleString("ru-RU")
        : "";
      const listingUrl = client?.listingUrl || "";

      return [
        new Date(h.timestamp).toLocaleString("ru-RU"),
        actionText,
        h.clientId,
        clientName,
        clientPhone,
        clientAddress,
        meetingDate,
        listingUrl,
        h.details || "",
      ].map(escapeCSV);
    });

    // Используем запятые как разделители и добавляем BOM для корректного отображения кириллицы
    const content = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
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
      showSuccess(`История экспортирована (${history.length} записей)`);
    }
  } catch (error) {
    console.error("❌ Ошибка при экспорте истории:", error);
    if (showSuccess) {
      showSuccess("Произошла ошибка при экспорте истории");
    }
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
