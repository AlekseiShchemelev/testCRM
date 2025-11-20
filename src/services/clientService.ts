// src/services/clientService.ts - Сервис для работы с клиентами
/**
 * Этот файл содержит все CRUD операции (Create, Read, Update, Delete)
 * для работы с клиентами через Firebase Firestore.
 *
 * Особенности архитектуры:
 * - Централизованная бизнес-логика
 * - Валидация данных на уровне сервиса
 * - Обработка ошибок сети и авторизации
 * - Безопасность через проверку userId
 * - TypeScript типизация для безопасности
 */

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

/**
 * Ссылка на коллекцию "clients" в Firestore
 *
 * Firestore структура:
 * clients (коллекция)
 *   └── {userId} (документ пользователя)
 *       └── {clientId} (документ клиента)
 *
 * В данном случае используется плоская структура:
 * clients (коллекция)
 *   └── {clientId} (документ с полем userId)
 */
const clientsCollection = collection(db, "clients");

/**
 * Получает ID текущего авторизованного пользователя
 *
 * @returns {string | undefined} ID пользователя или undefined если не авторизован
 *
 * Используется для:
 * - Фильтрации данных по пользователю
 * - Обеспечения безопасности (пользователь видит только свои данные)
 * - Аудита действий
 */
const getCurrentUserId = () => {
  return auth.currentUser?.uid;
};

/**
 * Вспомогательная функция для обработки ошибок сети
 *
 * Firebase и другие API могут возвращать разные типы ошибок:
 * - Сетевые ошибки (ERR_NETWORK)
 * - Ошибки аутентификации
 * - Ошибки доступа к данным
 * - Ошибки валидации
 *
 * @param {any} err - Объект ошибки
 * @returns {object | null} Информация об ошибке сети или null
 */
const handleNetworkError = (err: any) => {
  // Проверяем код ошибки и состояние сети
  if (err.code === "ERR_NETWORK" || !navigator.onLine) {
    // Возвращаем информацию об ошибке для обработки в компонентах
    return { type: "network", message: "Нет подключения к интернету" };
  }
  return null;
};

/**
 * Валидация данных клиента
 *
 * Выполняет проверку обязательных полей и форматов данных.
 * Разная логика для создания и обновления.
 *
 * @param {Partial<Client>} client - Данные клиента для валидации
 * @param {boolean} isUpdate - Флаг обновления (true) или создания (false)
 * @returns {string[]} Массив сообщений об ошибках
 */
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
  // Разрешаем цифры, пробелы, дефисы, плюс и скобки
  if (client.phone && !/^[\d\s\-\+\(\)]+$/.test(client.phone)) {
    errors.push("Некорректный формат телефона");
  }

  return errors;
};

/**
 * Получает список всех клиентов текущего пользователя
 *
 * @returns {Promise<Client[]>} Массив клиентов, отсортированный по дате создания
 *
 * Особенности:
 * - Фильтрация по userId для безопасности
 * - Сортировка по createdAt (новые первыми)
 * - Обработка ошибок сети и авторизации
 * - Возврат пустого массива если пользователь не авторизован
 */
export const getClients = async (): Promise<Client[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    /**
     * query() - создает запрос к Firestore
     * where("userId", "==", userId) - фильтр по ID пользователя
     * orderBy("createdAt", "desc") - сортировка по дате создания (новые первыми)
     */
    const q = query(
      clientsCollection,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    /**
     * getDocs() - выполняет запрос и возвращает snapshot
     * snapshot.docs - массив документов
     * doc.data() - данные документа
     * doc.id - ID документа
     */
    const snapshot = await getDocs(q);

    // Преобразуем документы в объекты Client
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

/**
 * Добавляет нового клиента
 *
 * @param {Omit<Client, "id" | "createdAt">} client - Данные клиента без ID и createdAt
 * @returns {Promise<string>} ID созданного документа
 *
 * Процесс:
 * 1. Проверка авторизации пользователя
 * 2. Валидация данных
 * 3. Добавление userId и createdAt
 * 4. Сохранение в Firestore
 * 5. Возврат ID созданного документа
 */
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
    /**
     * addDoc() - добавляет новый документ в коллекцию
     * Возвращает Reference на созданный документ
     */
    const docRef = await addDoc(clientsCollection, {
      ...client, // Все поля клиента
      userId, // ID текущего пользователя для безопасности
      createdAt: new Date().toISOString(), // Временная метка создания
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

/**
 * Обновляет данные клиента
 *
 * @param {string} id - ID клиента для обновления
 * @param {Partial<Client>} updates - Поля для обновления
 *
 * Процесс:
 * 1. Проверка авторизации
 * 2. Валидация обновляемых данных
 * 3. Обновление документа в Firestore
 */
export const updateClient = async (id: string, updates: Partial<Client>) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("Пользователь не авторизован");

  // Валидация обновляемых данных (только для непустых полей)
  const validationErrors = validateClientData(updates, true);
  if (validationErrors.length > 0) {
    throw new Error(`Ошибка валидации: ${validationErrors.join(", ")}`);
  }

  try {
    /**
     * doc() - создает reference на конкретный документ
     * updateDoc() - обновляет поля документа
     */
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

/**
 * Удаляет клиента
 *
 * @param {string} id - ID клиента для удаления
 *
 * Процесс:
 * 1. Проверка авторизации
 * 2. Удаление документа из Firestore
 */
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
 * Возвращает клиентов, у которых встреча в указанный день
 *
 * Используется для календаря и планирования встреч.
 * Выполняет сложный запрос по диапазону дат.
 *
 * @param {Date} date - Дата для поиска встреч
 * @returns {Promise<Client[]>} Массив клиентов с встречами в указанную дату
 */
export const getClientsByDate = async (date: Date): Promise<Client[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    // Создаем диапазон дат для поиска
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0); // Начало дня (00:00:00.000)

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999); // Конец дня (23:59:59.999)

    /**
     * Форматирует дату в строку для запроса Firestore
     * Firestore требует точного формата ISO string
     */
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

    /**
     * Сложный запрос с несколькими условиями:
     * 1. where("userId", "==", userId) - фильтр по пользователю
     * 2. where("meetingDate", ">=", startStr) - дата >= начала дня
     * 3. where("meetingDate", "<=", endStr) - дата <= конца дня
     * 4. orderBy("meetingDate") - сортировка по времени встречи
     */
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
