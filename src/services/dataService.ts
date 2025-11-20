// src/services/dataService.ts
import { clearHistory } from "./historyService";
import { deleteClient } from "./clientService";
import { getClients } from "./clientService";

export const clearAllData = async () => {
  try {
    // 1. Получаем всех клиентов
    const clients = await getClients();

    if (clients.length === 0) {
      // Если клиентов нет, просто очищаем историю
      await clearHistory();
      return { success: true, message: "Данные очищены" };
    }

    // 2. Удаляем всех клиентов с обработкой ошибок
    const deletePromises = clients
      .filter((client) => client.id) // Фильтруем клиентов с id
      .map((client) => deleteClient(client.id!));

    const results = await Promise.allSettled(deletePromises);

    // Подсчитываем успешные и неудачные операции
    const successful = results.filter(
      (result) => result.status === "fulfilled"
    ).length;
    const failed = results.filter(
      (result) => result.status === "rejected"
    ).length;

    // 3. Очищаем историю (даже если удаление клиентов частично не удалось)
    try {
      await clearHistory();
    } catch (error) {
      console.warn("Не удалось очистить историю:", error);
      // Не прерываем процесс из-за ошибки очистки истории
    }

    // Возвращаем результат с информацией о выполненных операциях
    if (failed === 0) {
      return {
        success: true,
        message: `Успешно удалено ${successful} клиентов и очищена история`,
      };
    } else if (successful > 0) {
      return {
        success: true,
        message: `Удалено ${successful} клиентов, ${failed} не удалось удалить. История очищена.`,
      };
    } else {
      throw new Error("Не удалось удалить ни одного клиента");
    }
  } catch (error: any) {
    console.error("Ошибка при очистке данных:", error);
    throw new Error(`Не удалось очистить данные: ${error.message}`);
  }
};
