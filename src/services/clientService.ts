// src/services/clientService.ts
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";
import type { Client } from "../types";

const clientsCollection = collection(db, "clients");

const getCurrentUserId = () => {
  return auth.currentUser?.uid;
};

// Вспомогательная функция для обработки ошибок сети
const handleNetworkError = (err: any) => {
  if (err.code === "ERR_NETWORK" || !navigator.onLine) {
    // Возвращаем информацию об ошибке для обработки в компонентах
    return { type: "network", message: "Нет подключения к интернету" };
  }
  return null;
};

// Валидация данных клиента
const validateClientData = (
  client: Partial<Client>,
  isUpdate = false
): string[] => {
  const errors: string[] = [];

  if (isUpdate) {
    // При обновлении валидируем только непустые поля
    // Пропускаем валидацию пустых полей, чтобы пользователь мог очищать поля
    if (
      client.fullName !== undefined &&
      client.fullName.trim() &&
      client.fullName.trim().length === 0
    ) {
      errors.push("ФИО не может быть пустым при обновлении");
    }

    if (
      client.phone !== undefined &&
      client.phone.trim() &&
      client.phone.trim().length === 0
    ) {
      errors.push("Телефон не может быть пустым при обновлении");
    }

    if (
      client.address !== undefined &&
      client.address.trim() &&
      client.address.trim().length === 0
    ) {
      errors.push("Адрес не может быть пустым при обновлении");
    }

    if (
      client.meetingDate !== undefined &&
      client.meetingDate.trim() &&
      client.meetingDate.trim().length === 0
    ) {
      errors.push("Дата и время встречи не могут быть пустыми при обновлении");
    }
  } else {
    // При создании требуем все обязательные поля
    if (!client.fullName?.trim()) {
      errors.push("ФИО обязательно для заполнения");
    }

    if (!client.phone?.trim()) {
      errors.push("Телефон обязателен для заполнения");
    }

    if (!client.address?.trim()) {
      errors.push("Адрес обязателен для заполнения");
    }

    if (!client.meetingDate?.trim()) {
      errors.push("Дата и время встречи обязательны для заполнения");
    }
  }

  // Проверка формата телефона (если поле передано)
  if (client.phone && !/^[\d\s\-\+\(\)]+$/.test(client.phone)) {
    errors.push("Некорректный формат телефона");
  }

  return errors;
};

export const getClients = async (): Promise<Client[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    const q = query(
      clientsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Client)
    );
  } catch (err: any) {
    const networkError = handleNetworkError(err);
    if (networkError) {
      throw new Error(networkError.message);
    }
    console.error("Ошибка при получении списка клиентов:", err);
    throw new Error("Не удалось загрузить список клиентов");
  }
};

export const addClient = async (
  client: Omit<Client, "id" | "createdAt">
): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Пользователь не авторизован");

  // Валидация данных
  const validationErrors = validateClientData(client, false);
  if (validationErrors.length > 0) {
    throw new Error(`Ошибка валидации: ${validationErrors.join(", ")}`);
  }

  try {
    const docRef = await addDoc(clientsCollection, {
      ...client,
      userId,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (err: any) {
    const networkError = handleNetworkError(err);
    if (networkError) {
      throw new Error(
        networkError.message +
          ". Изменения будут синхронизированы при подключении."
      );
    }
    console.error("Ошибка при добавлении клиента:", err);
    throw new Error("Не удалось добавить клиента. Попробуйте еще раз.");
  }
};

export const updateClient = async (id: string, updates: Partial<Client>) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Пользователь не авторизован");

  // Валидация обновляемых данных (только для непустых полей)
  const validationErrors = validateClientData(updates, true);
  if (validationErrors.length > 0) {
    throw new Error(`Ошибка валидации: ${validationErrors.join(", ")}`);
  }

  try {
    const clientDoc = doc(db, "clients", id);
    await updateDoc(clientDoc, updates);
  } catch (err: any) {
    const networkError = handleNetworkError(err);
    if (networkError) {
      throw new Error(
        networkError.message +
          ". Изменения будут синхронизированы при подключении."
      );
    }
    console.error("Ошибка при обновлении клиента:", err);
    throw new Error("Не удалось обновить данные клиента. Попробуйте еще раз.");
  }
};

export const deleteClient = async (id: string) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Пользователь не авторизован");

  try {
    const clientDoc = doc(db, "clients", id);
    await deleteDoc(clientDoc);
  } catch (err: any) {
    const networkError = handleNetworkError(err);
    if (networkError) {
      throw new Error(
        networkError.message + ". Удаление будет выполнено при подключении."
      );
    }
    console.error("Ошибка при удалении клиента:", err);
    throw new Error("Не удалось удалить клиента. Попробуйте еще раз.");
  }
};

/**
 * Возвращает клиентов, у которых встреча в указанный день.
 */
export const getClientsByDate = async (date: Date): Promise<Client[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const formatDateForQuery = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const startStr = formatDateForQuery(startOfDay);
    const endStr = formatDateForQuery(endOfDay);

    const q = query(
      clientsCollection,
      where("userId", "==", userId),
      where("meetingDate", ">=", startStr),
      where("meetingDate", "<=", endStr),
      orderBy("meetingDate")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Client)
    );
  } catch (err: any) {
    const networkError = handleNetworkError(err);
    if (networkError) {
      throw new Error(networkError.message);
    }
    console.error("Ошибка при получении клиентов по дате:", err);
    throw new Error("Не удалось загрузить встречи на указанную дату");
  }
};
