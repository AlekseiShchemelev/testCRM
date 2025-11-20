// src/components/VoiceTextField.tsx
import { useState, useRef, useEffect } from "react";
import {
  TextField,
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Popover,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  isSpeechRecognitionSupported,
  startSpeechRecognition,
  stopSpeechRecognition,
  getRecognitionStatus,
  getSupportedLanguages,
  type SupportedLanguage,
  type SpeechRecognitionOptions,
} from "../utils/speechUtils";

interface VoiceTextFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  multiline?: boolean;
  minRows?: number;
  type?: string;
  required?: boolean;
  onVoiceInput?: (text: string, confidence: number) => void;
  language?: SupportedLanguage;
  confidenceThreshold?: number;
  enableSettings?: boolean;
  showConfidence?: boolean;
  autoRestart?: boolean;
  placeholder?: string;
}

export default function VoiceTextField({
  label,
  name,
  value,
  onChange,
  multiline = false,
  minRows = 1,
  type = "text",
  required = false,
  onVoiceInput,
  language = "ru-RU",
  confidenceThreshold = 0.7,
  enableSettings = true,
  showConfidence = false,
  autoRestart = false,
  placeholder,
}: VoiceTextFieldProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(
    null
  );
  const [currentLanguage, setCurrentLanguage] =
    useState<SupportedLanguage>(language);
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onVoiceInputRef = useRef(onVoiceInput);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Обновляем ref при изменении onVoiceInput
  useEffect(() => {
    onVoiceInputRef.current = onVoiceInput;
  }, [onVoiceInput]);

  // Проверка поддержки Speech Recognition
  useEffect(() => {
    if (!isInitialized.current) {
      setIsSupported(isSpeechRecognitionSupported());
      isInitialized.current = true;
    }
  }, []);

  // Обработка клавиатурных событий
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Если фокус на поле ввода и нажат Escape
      if (
        document.activeElement === inputRef.current &&
        event.key === "Escape"
      ) {
        if (isRecording) {
          event.preventDefault();
          // Вызываем напрямую, так как handleVoiceInput не стабилен
          stopSpeechRecognition();
        }
      }

      // Если нажат Ctrl+M или Cmd+M - активировать голосовой ввод
      if ((event.ctrlKey || event.metaKey) && event.key === "m") {
        event.preventDefault();
        if (!isProcessing) {
          // Вызываем напрямую, так как handleVoiceInput не стабилен
          setError(null);
          setIsRecording(true);
          setIsProcessing(true);
          setInterimTranscript("");
          setConfidence(0);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, isProcessing]);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Обработка голосового ввода
  const handleVoiceInput = async () => {
    if (!isSupported) {
      setError(
        "Голосовой ввод не поддерживается в этом браузере. Используйте Chrome или Edge."
      );
      return;
    }

    if (isRecording || isProcessing) {
      // Останавливаем запись
      stopSpeechRecognition();
      setIsRecording(false);
      setIsProcessing(false);
      setInterimTranscript("");
      return;
    }

    try {
      setError(null);
      setIsRecording(true);
      setIsProcessing(true);
      setInterimTranscript("");
      setConfidence(0);

      const options: SpeechRecognitionOptions = {
        lang: currentLanguage,
        interimResults: true,
        maxAlternatives: 3,
        confidenceThreshold,
        autoRestart,
        onStart: () => {
          setIsRecording(true);
          setIsProcessing(true);
        },
        onResult: (transcript: string, conf: number, isFinal: boolean) => {
          setConfidence(conf);

          if (isFinal) {
            setInterimTranscript("");
            if (conf >= confidenceThreshold) {
              onVoiceInputRef.current?.(transcript, conf);
            }
          } else {
            setInterimTranscript(transcript);
          }
        },
        onError: (errorMessage: string) => {
          setError(errorMessage);
          setIsRecording(false);
          setIsProcessing(false);
          setInterimTranscript("");
        },
        onEnd: () => {
          setIsRecording(false);
          setIsProcessing(false);
          setInterimTranscript("");
        },
      };

      await startSpeechRecognition(options);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось запустить распознавание речи"
      );
      setIsRecording(false);
      setIsProcessing(false);
      setInterimTranscript("");
    }
  };

  // Автоматическое скрытие ошибки
  useEffect(() => {
    if (error) {
      timeoutRef.current = setTimeout(() => {
        setError(null);
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [error]);

  // Обработка изменения языка
  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setCurrentLanguage(newLanguage);
    setSettingsAnchor(null);
  };

  // Получение статуса распознавания
  const recognitionStatus = getRecognitionStatus();

  // Если голосовой ввод не поддерживается, показываем обычное поле
  if (!isSupported) {
    return (
      <TextField
        ref={inputRef}
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        fullWidth
        required={required}
        size={isMobile ? "medium" : "small"}
        multiline={multiline}
        minRows={minRows}
        type={type}
        placeholder={placeholder}
        InputLabelProps={type === "datetime-local" ? { shrink: true } : {}}
        sx={{ "& .MuiInputBase-root": { borderRadius: "12px" } }}
        helperText="Голосовой ввод недоступен в этом браузере"
      />
    );
  }

  const displayValue = interimTranscript || value;
  const showInterim = interimTranscript && isRecording;

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <TextField
        ref={inputRef}
        label={label}
        name={name}
        value={displayValue}
        onChange={onChange}
        fullWidth
        required={required}
        size={isMobile ? "medium" : "small"}
        multiline={multiline}
        minRows={minRows}
        type={type}
        placeholder={placeholder || (showInterim ? "Говорите..." : placeholder)}
        InputLabelProps={type === "datetime-local" ? { shrink: true } : {}}
        sx={{
          "& .MuiInputBase-root": {
            borderRadius: "12px",
            pr: enableSettings || isSupported ? 10 : 3,
          },
          "& .MuiInputBase-input": {
            "&::placeholder": {
              color: showInterim ? "primary.main" : "text.secondary",
              opacity: showInterim ? 1 : 0.6,
            },
          },
        }}
        InputProps={{
          endAdornment: (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {/* Кнопка настроек */}
              {enableSettings && (
                <Tooltip title="Настройки голосового ввода (Ctrl+M для активации)">
                  <IconButton
                    size={isMobile ? "medium" : "small"}
                    onClick={(e) => setSettingsAnchor(e.currentTarget)}
                    sx={{
                      color: "text.secondary",
                      "&:hover": { color: "primary.main" },
                    }}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Кнопка микрофона */}
              <Tooltip
                title={
                  isRecording
                    ? "Остановить запись (Esc)"
                    : "Начать запись (Ctrl+M)"
                }
              >
                <IconButton
                  size={isMobile ? "medium" : "small"}
                  onClick={handleVoiceInput}
                  disabled={isProcessing}
                  sx={{
                    color: isRecording ? "error.main" : "primary.main",
                    backgroundColor: isRecording
                      ? "error.lighter"
                      : "transparent",
                    "&:hover": {
                      backgroundColor: isRecording
                        ? "error.light"
                        : "action.hover",
                    },
                    "&:disabled": {
                      color: "action.disabled",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  {isProcessing ? (
                    <CircularProgress
                      size={isMobile ? 20 : 16}
                      color="inherit"
                    />
                  ) : isRecording ? (
                    <StopIcon fontSize="small" />
                  ) : (
                    <MicIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          ),
        }}
      />

      {/* Статус записи */}
      {isRecording && (
        <Box
          sx={{
            position: "absolute",
            top: isMobile ? -40 : -32,
            right: 0,
            backgroundColor: "error.main",
            color: "white",
            px: isMobile ? 2 : 1.5,
            py: isMobile ? 0.75 : 0.5,
            borderRadius: isMobile ? "12px" : "8px",
            fontSize: isMobile ? "0.8rem" : "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            zIndex: 1000,
            animation: "pulse 1.5s infinite",
            boxShadow: "0 4px 12px rgba(244, 67, 54, 0.3)",
            "@keyframes pulse": {
              "0%": { opacity: 1, transform: "scale(1)" },
              "50%": { opacity: 0.8, transform: "scale(1.02)" },
              "100%": { opacity: 1, transform: "scale(1)" },
            },
          }}
        >
          <MicIcon sx={{ fontSize: isMobile ? "1rem" : "0.9rem" }} />
          <Box component="span">
            {isProcessing ? "Обработка..." : "Говорите..."}
            {showConfidence && confidence > 0 && (
              <Box component="span" sx={{ ml: 1, opacity: 0.8 }}>
                ({Math.round(confidence * 100)}%)
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Ошибки */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mt: 1,
            borderRadius: "8px",
            "& .MuiAlert-message": {
              width: "100%",
            },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Подсказка по горячим клавишам */}
      {isSupported && !isRecording && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            mt: 0.5,
            display: "block",
            fontSize: "0.7rem",
            opacity: 0.7,
          }}
        >
          Подсказка: используйте Ctrl+M для быстрой активации микрофона
        </Typography>
      )}

      {/* Поповер с настройками */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 2,
            minWidth: 280,
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          },
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontSize: "1rem" }}>
          Настройки голосового ввода
        </Typography>

        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Язык</InputLabel>
          <Select
            value={currentLanguage}
            label="Язык"
            onChange={(e) =>
              handleLanguageChange(e.target.value as SupportedLanguage)
            }
          >
            {Object.entries(getSupportedLanguages()).map(([code, name]) => (
              <MenuItem key={code} value={code}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
          <Typography variant="body2" gutterBottom>
            Статус: {recognitionStatus.isActive ? "Активен" : "Неактивен"}
          </Typography>
          <Typography variant="body2">
            Текущий язык:{" "}
            {getSupportedLanguages()[currentLanguage] || currentLanguage}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
            Горячие клавиши: Ctrl+M для активации, Esc для остановки
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
}
