// src/services/historyService.ts
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";
import type { HistoryEntry } from "../types";

interface HistoryEntryInput {
  clientId: string;
  action: HistoryEntry["action"];
  details?: string;
}

const historyCollection = collection(db, "history");

const getCurrentUserId = () => {
  return auth.currentUser?.uid;
};

// Вспомогательная функция для обработки ошибок сети
const handleNetworkError = (err: any) => {
  if (err.code === "ERR_NETWORK" || !navigator.onLine) {
    return { type: "network", message: "Нет подключения к интернету" };
  }
  return null;
};

// Валидация данных записи истории
const validateHistoryEntry = (entry: HistoryEntryInput): string[] => {
  const errors: string[] = [];

  if (!entry.clientId?.trim()) {
    errors.push("ID клиента обязателен");
  }

  if (
    !entry.action ||
    ![
      "created",
      "updated",
      "deleted",
      "meeting_completed",
      "meeting_cancelled",
    ].includes(entry.action)
  ) {
    errors.push("Некорректное действие");
  }

  return errors;
};

export const getHistory = async (): Promise<HistoryEntry[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    const q = query(
      historyCollection,
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as HistoryEntry)
    );
  } catch (err: any) {
    const networkError = handleNetworkError(err);
    if (networkError) {
      throw new Error(networkError.message);
    }
    console.error("Ошибка при получении истории:", err);
    throw new Error("Не удалось загрузить историю действий");
  }
};

export const addHistoryEntry = async (entry: HistoryEntryInput) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Пользователь не авторизован");

  // Валидация данных
  const validationErrors = validateHistoryEntry(entry);
  if (validationErrors.length > 0) {
    throw new Error(`Ошибка валидации: ${validationErrors.join(", ")}`);
  }

  try {
    await addDoc(historyCollection, {
      ...entry,
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    const networkError = handleNetworkError(err);
    if (networkError) {
      // История не критична, можно не показывать ошибку пользователю
      console.warn(
        "Не удалось сохранить запись в историю:",
        networkError.message
      );
      return;
    }
    console.error("Ошибка при добавлении записи в историю:", err);
    throw new Error("Не удалось сохранить действие в историю");
  }
};

export const clearHistory = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    const q = query(historyCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return; // История уже пуста
    }

    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (err: any) {
    const networkError = handleNetworkError(err);
    if (networkError) {
      throw new Error(
        networkError.message +
          ". Очистка истории будет выполнена при подключении."
      );
    }
    console.error("Ошибка при очистке истории:", err);
    throw new Error("Не удалось очистить историю. Попробуйте еще раз.");
  }
};
