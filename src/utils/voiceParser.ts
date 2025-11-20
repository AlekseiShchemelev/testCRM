// src/utils/voiceParser.ts

/**
 * Парсит голосовую команду и возвращает объект с данными клиента
 * @param text Распознанный текст от SpeechRecognition
 * @returns Частичный объект клиента (только заполненные поля)
 */
export const parseVoiceInput = (text: string): Partial<{
  fullName: string;
  phone: string;
  address: string;
}> => {
  const result: Partial<{ fullName: string; phone: string; address: string }> = {};

  // Регулярные выражения для поиска данных
  const patterns = {
    // Ищет после слов: фио, имя, зовут и т.п.
    fullName: /(?:фио|имя|фамилия|зовут|мое имя|меня зовут)\s*[:\-]?\s*([А-Яа-яЁё\s]+)/i,
    // Ищет цифры (телефон может быть с пробелами, скобками, дефисами)
    phone: /(?:телефон|номер|мобильный|связь)\s*[:\-]?\s*(\d[\d\s\-\(\)]{7,})/i,
    // Адрес — всё, что после "адрес", "место", "где"
    address: /(?:адрес|место|расположение|где|находится)\s*[:\-]?\s*([А-Яа-яЁё\d\s\-,\.]+)/i,
  };

  const matches = {
    fullName: text.match(patterns.fullName),
    phone: text.match(patterns.phone),
    address: text.match(patterns.address),
  };

  // Обработка ФИО
  if (matches.fullName) {
    let name = matches.fullName[1].trim();
    // Удаляем возможные служебные слова в начале
    name = name
      .replace(/^(это|мой|моё|мои|зовут|фио|имя|фамилия|меня)\s*/i, '')
      .trim();
    if (name) result.fullName = name;
  }

  // Обработка телефона
  if (matches.phone) {
    // Оставляем только цифры
    const digits = matches.phone[1].replace(/\D/g, '');
    // Принимаем номера от 10 цифр (например, 9155151234)
    if (digits.length >= 10) {
      // Форматируем как +7...
      result.phone = '+' + (digits.startsWith('8') ? '7' + digits.slice(1) : digits);
    }
  }

  // Обработка адреса
  if (matches.address) {
    let addr = matches.address[1].trim();
    // Удаляем возможные лишние слова
    addr = addr.replace(/^(это|мой|моё|адрес|место|где)\s*/i, '').trim();
    if (addr) result.address = addr;
  }

  return result;
};