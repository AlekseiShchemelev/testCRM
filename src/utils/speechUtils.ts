// src/utils/speechUtils.ts
// Типы для Speech Recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionError) => any)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechGrammarList {
  [index: number]: SpeechGrammar;
  length: number;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Кэш для избежания повторного создания экземпляров
let recognitionInstance: SpeechRecognition | null = null;
let isRecognitionActive = false;

// Поддерживаемые языки
export const SUPPORTED_LANGUAGES = {
  "ru-RU": "Русский",
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  "de-DE": "Deutsch",
  "fr-FR": "Français",
  "es-ES": "Español",
  "it-IT": "Italiano",
  "pt-PT": "Português",
  "zh-CN": "中文 (简体)",
  "ja-JP": "日本語",
  "ko-KR": "한국어",
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Настройки по умолчанию
const DEFAULT_OPTIONS = {
  lang: "ru-RU" as SupportedLanguage,
  continuous: false,
  interimResults: true,
  maxAlternatives: 3,
  confidenceThreshold: 0.7,
  autoRestart: false,
  restartDelay: 1000,
};

export interface SpeechRecognitionOptions {
  lang?: SupportedLanguage;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  confidenceThreshold?: number;
  autoRestart?: boolean;
  restartDelay?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (transcript: string, confidence: number, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

export const isSpeechRecognitionSupported = (): boolean => {
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
};

export const getSupportedLanguages = (): Record<string, string> => {
  if (!isSpeechRecognitionSupported()) return {};
  return SUPPORTED_LANGUAGES;
};

export const createSpeechRecognition = (
  options: SpeechRecognitionOptions = {}
): SpeechRecognition => {
  if (!isSpeechRecognitionSupported()) {
    throw new Error("Speech Recognition API не поддерживается в этом браузере");
  }

  // Переиспользуем существующий экземпляр, если он не активен
  if (recognitionInstance && !isRecognitionActive) {
    return recognitionInstance;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  // Применяем настройки
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  recognition.lang = finalOptions.lang;
  recognition.continuous = finalOptions.continuous;
  recognition.interimResults = finalOptions.interimResults;
  recognition.maxAlternatives = finalOptions.maxAlternatives;

  // Сохраняем экземпляр для переиспользования
  recognitionInstance = recognition;

  return recognition;
};

export const startSpeechRecognition = (
  options: SpeechRecognitionOptions = {}
): Promise<{ transcript: string; confidence: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const recognition = createSpeechRecognition(options);
      const finalOptions = { ...DEFAULT_OPTIONS, ...options };

      let finalTranscript = "";
      let highestConfidence = 0;

      const handleResult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const alternative = result[0];

          if (result.isFinal) {
            finalTranscript += alternative.transcript;
            highestConfidence = Math.max(
              highestConfidence,
              alternative.confidence
            );

            // Вызываем callback для финального результата
            finalOptions.onResult?.(
              alternative.transcript,
              alternative.confidence,
              true
            );
          } else {
            // Вызываем callback для промежуточного результата
            finalOptions.onResult?.(
              alternative.transcript,
              alternative.confidence,
              false
            );
          }
        }
      };

      const handleError = (event: SpeechRecognitionError) => {
        isRecognitionActive = false;
        const errorMessage = getErrorMessage(event.error);
        finalOptions.onError?.(errorMessage);
        reject(new Error(errorMessage));
      };

      // Устанавливаем обработчики событий
      recognition.onresult = handleResult;
      recognition.onerror = handleError;
      recognition.onstart = () => {
        isRecognitionActive = true;
        finalOptions.onStart?.();
      };
      recognition.onend = () => {
        isRecognitionActive = false;
        finalOptions.onEnd?.();

        // Автоматический перезапуск если включен
        if (finalOptions.autoRestart && !recognition.continuous) {
          setTimeout(() => {
            if (!isRecognitionActive) {
              startSpeechRecognition(finalOptions).then(resolve).catch(reject);
            }
          }, finalOptions.restartDelay);
        } else if (finalTranscript) {
          // Возвращаем результат если есть транскрипт
          resolve({
            transcript: finalTranscript.trim(),
            confidence: highestConfidence,
          });
        }
      };
      recognition.onspeechstart = finalOptions.onSpeechStart;
      recognition.onspeechend = finalOptions.onSpeechEnd;
      recognition.onaudiostart = finalOptions.onAudioStart;
      recognition.onaudioend = finalOptions.onAudioEnd;

      // Запускаем распознавание
      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
};

export const stopSpeechRecognition = (): void => {
  if (recognitionInstance && isRecognitionActive) {
    recognitionInstance.stop();
    isRecognitionActive = false;
  }
};

export const abortSpeechRecognition = (): void => {
  if (recognitionInstance && isRecognitionActive) {
    recognitionInstance.abort();
    isRecognitionActive = false;
  }
};

export const getRecognitionStatus = (): {
  isSupported: boolean;
  isActive: boolean;
  currentLanguage: string;
} => {
  return {
    isSupported: isSpeechRecognitionSupported(),
    isActive: isRecognitionActive,
    currentLanguage: recognitionInstance?.lang || "ru-RU",
  };
};

// Вспомогательная функция для получения понятных сообщений об ошибках
const getErrorMessage = (error: string): string => {
  const errorMessages: Record<string, string> = {
    "no-speech": "Речь не обнаружена. Попробуйте говорить громче.",
    "audio-capture": "Микрофон не найден или недоступен.",
    "not-allowed":
      "Доступ к микрофону запрещен. Разрешите доступ в настройках браузера.",
    network: "Ошибка сети. Проверьте подключение к интернету.",
    "language-not-supported": "Язык не поддерживается.",
    "service-not-allowed": "Сервис распознавания речи недоступен.",
    "bad-grammar": "Ошибка грамматики.",
    aborted: "Распознавание прервано пользователем.",
    "context-not-allowed": "Контекст не разрешен.",
    "start-but-no-speech-for-while":
      "Начато распознавание, но речь не обнаружена.",
    "speech-unavailable": "Речь недоступна.",
    "speech-input-too-short": "Слишком короткий ввод.",
    "speech-input-too-long": "Слишком длинный ввод.",
    network: "Ошибка сети.",
    "audio-capture": "Ошибка захвата аудио.",
    "not-allowed": "Доступ запрещен.",
    aborted: "Операция прервана.",
  };

  return errorMessages[error] || `Неизвестная ошибка: ${error}`;
};

// Утилита для создания грамматики (для улучшения точности)
export const createGrammarList = (words: string[]): SpeechGrammarList => {
  if (!("SpeechGrammarList" in window)) {
    return null as any;
  }

  const SpeechGrammarList = (window as any).SpeechGrammarList;
  const grammarList = new SpeechGrammarList();

  words.forEach((word) => {
    const grammar = `#JSGF V1.0; grammar ${word}; public <word> = ${word} ;`;
    grammarList.addFromString(grammar, 1.0);
  });

  return grammarList;
};

// Утилита для очистки ресурсов
export const cleanupSpeechRecognition = (): void => {
  if (recognitionInstance) {
    if (isRecognitionActive) {
      recognitionInstance.stop();
    }
    recognitionInstance = null;
    isRecognitionActive = false;
  }
};
