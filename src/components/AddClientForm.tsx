// src/components/AddClientForm.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  LinearProgress,
} from "@mui/material";
import {
  Close as CloseIcon,
  AddAPhoto as AddAPhotoIcon,
  Link as LinkIcon,
  Compress as CompressIcon,
} from "@mui/icons-material";
import { addClient, updateClient } from "../services/clientService";
import { addHistoryEntry } from "../services/historyService";
import { useNotifications } from "../hooks/useNotifications";
import type { Client } from "../types";
import VoiceTextField from "./VoiceTextField";
import PropertyGallery from "./PropertyGallery";
import { processImageFiles, type CompressionResult } from "../utils/imageUtils";

interface AddClientFormProps {
  open: boolean;
  onCancel: () => void;
  onSave: () => void;
  client?: Client;
}

export default function AddClientForm({
  open,
  onCancel,
  onSave,
  client,
}: AddClientFormProps) {
  const initialData: Omit<Client, "id" | "createdAt"> = client
    ? {
        fullName: client.fullName,
        phone: client.phone,
        address: client.address,
        meetingDate: client.meetingDate.slice(0, 16),
        status: client.status,
        propertyPhotos: client.propertyPhotos || [],
        listingUrl: client.listingUrl || "",
        comments: client.comments || "",
      }
    : {
        fullName: "",
        phone: "",
        address: "",
        meetingDate: new Date().toISOString().slice(0, 16),
        status: "planned",
        propertyPhotos: [],
        listingUrl: "",
        comments: "",
      };

  const [formData, setFormData] = useState(initialData);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult[]>(
    []
  );

  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    if (open) {
      if (client) {
        setFormData({
          fullName: client.fullName,
          phone: client.phone,
          address: client.address,
          meetingDate: client.meetingDate.slice(0, 16),
          status: client.status,
          propertyPhotos: client.propertyPhotos || [],
          listingUrl: client.listingUrl || "",
          comments: client.comments || "",
        });
        setPhotos(client.propertyPhotos || []);
      } else {
        setFormData({
          fullName: "",
          phone: "",
          address: "",
          meetingDate: new Date().toISOString().slice(0, 16),
          status: "planned",
          propertyPhotos: [],
          listingUrl: "",
          comments: "",
        });
        setPhotos([]);
      }
      setValidationErrors([]);
      setIsProcessingImages(false);
      setProcessingProgress(0);
      setCompressionInfo([]);
    }
  }, [open, client]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Проверяем общее количество фотографий
    const MAX_PHOTOS = 10;
    if (photos.length + files.length > MAX_PHOTOS) {
      showError(`Можно загрузить максимум ${MAX_PHOTOS} фотографий`);
      return;
    }

    // Настройки сжатия
    const compressionOptions = {
      maxWidth: 1920, // Максимальная ширина
      maxHeight: 1080, // Максимальная высота
      quality: 0.8, // Качество сжатия (80%)
      maxFileSize: 800 * 1024, // 800 КБ максимум на файл
      outputFormat: "jpeg" as const,
    };

    const validationOptions = {
      maxFileSize: 5 * 1024 * 1024, // 5 МБ максимум для исходного файла
      allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    };

    setIsProcessingImages(true);
    setProcessingProgress(0);
    setCompressionInfo([]);

    try {
      // Обрабатываем файлы с сжатием
      const result = await processImageFiles(
        files,
        compressionOptions,
        validationOptions
      );

      if (result.errors.length > 0) {
        showError(result.errors.join("\n"));
      }

      if (result.successful.length > 0) {
        // Преобразуем dataUrl в обычные строки для совместимости
        const newPhotos = result.successful.map((result) => result.dataUrl);

        setPhotos((prev) => [...prev, ...newPhotos]);
        setCompressionInfo(result.successful);

        if (result.successful.length > 0) {
          const totalSavings =
            result.successful.reduce((sum, r) => sum + r.compressionRatio, 0) /
            result.successful.length;
          showSuccess(
            `Успешно обработано ${
              result.successful.length
            } изображений. Средняя экономия: ${totalSavings.toFixed(1)}%`
          );
        }
      }
    } catch (error: any) {
      console.error("Ошибка при обработке изображений:", error);
      showError(`Ошибка при обработке изображений: ${error.message}`);
    } finally {
      setIsProcessingImages(false);
      setProcessingProgress(0);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Клиентская валидация
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.fullName?.trim()) {
      errors.push("ФИО обязательно для заполнения");
    }

    if (!formData.phone?.trim()) {
      errors.push("Телефон обязателен для заполнения");
    }

    if (!formData.address?.trim()) {
      errors.push("Адрес обязателен для заполнения");
    }

    if (!formData.meetingDate?.trim()) {
      errors.push("Дата и время встречи обязательны для заполнения");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    // Клиентская валидация
    if (!validateForm()) {
      return;
    }

    try {
      const clientData: Omit<Client, "id" | "createdAt"> = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        meetingDate: formData.meetingDate,
        status: formData.status,
        listingUrl: formData.listingUrl,
        comments: formData.comments,
      };

      if (photos.length > 0) {
        clientData.propertyPhotos = photos;
      }

      if (client) {
        await updateClient(client.id!, clientData);
        await addHistoryEntry({
          clientId: client.id!,
          action: "updated",
          details: `Обновлены данные: ${clientData.fullName}`,
        });
        showSuccess("Клиент успешно обновлён!");
      } else {
        const newId = await addClient(clientData);
        await addHistoryEntry({
          clientId: newId,
          action: "created",
          details: `Создан новый клиент: ${clientData.fullName}`,
        });
        showSuccess("Клиент успешно добавлен!");
      }

      onSave();
    } catch (error: any) {
      console.error("Ошибка при сохранении клиента:", error);
      showError(
        error.message || "Не удалось сохранить клиента. Попробуйте позже."
      );
    }
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closePhotoViewer = () => {
    setSelectedPhotoIndex(null);
  };

  const title = client ? "Редактировать клиента" : "Добавить нового клиента";

  // ✅ Условный возврат ПОСЛЕ всех хуков
  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "20px",
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: "1.25rem",
          p: 2.5,
        }}
      >
        {title}
        <IconButton onClick={onCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {/* Отображение ошибок валидации */}
        {validationErrors.length > 0 && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: "12px",
              backgroundColor: "error.light",
              color: "error.contrastText",
            }}
          >
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Пожалуйста, исправьте следующие ошибки:
            </Typography>
            {validationErrors.map((error, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                • {error}
              </Typography>
            ))}
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <VoiceTextField
            label="ФИО"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            layout="separated"
            onVoiceInput={(text) =>
              setFormData((prev) => ({ ...prev, fullName: text }))
            }
          />

          <VoiceTextField
            label="Телефон"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            layout="separated"
            onVoiceInput={(text) =>
              setFormData((prev) => ({ ...prev, phone: text }))
            }
          />

          <VoiceTextField
            label="Адрес"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            layout="separated"
            onVoiceInput={(text) =>
              setFormData((prev) => ({ ...prev, address: text }))
            }
          />

          <Box sx={{ position: "relative" }}>
            <TextField
              label="Дата и время встречи"
              name="meetingDate"
              type="datetime-local"
              value={formData.meetingDate}
              onChange={handleChange}
              fullWidth
              required
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiInputBase-root": { borderRadius: "12px" } }}
            />
          </Box>

          {/* Ссылка — без голоса */}
          <TextField
            label="Ссылка на объявление"
            name="listingUrl"
            value={formData.listingUrl || ""}
            onChange={handleChange}
            fullWidth
            size="small"
            placeholder="https://example.com/12345"
            sx={{ "& .MuiInputBase-root": { borderRadius: "12px" } }}
            InputProps={{
              startAdornment: (
                <LinkIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
              ),
            }}
          />

          <VoiceTextField
            label="Комментарии"
            name="comments"
            value={formData.comments || ""}
            onChange={handleChange}
            multiline
            minRows={3}
            layout="separated"
            onVoiceInput={(text) =>
              setFormData((prev) => ({ ...prev, comments: text }))
            }
          />

          {/* Фото объекта */}
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: "medium" }}
            >
              Фото объекта
            </Typography>

            {/* Информация об ограничениях */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1, fontSize: "0.75rem" }}
            >
              <strong>Автоматическое сжатие:</strong> максимум 10 фото,
              1920×1080px, 800 КБ на файл, JPEG качество 80%
              {photos.length > 0 && (
                <span style={{ marginLeft: 8 }}>
                  (Загружено: {photos.length})
                </span>
              )}
            </Typography>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              id="photo-upload"
              style={{ display: "none" }}
            />
            <label htmlFor="photo-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<AddAPhotoIcon />}
                fullWidth
                sx={{ borderRadius: "16px", py: 1.2 }}
              >
                Загрузить фото
              </Button>
            </label>

            {/* Статистика сжатия изображений */}
            {compressionInfo.length > 0 && (
              <Paper
                sx={{
                  p: 1.5,
                  mt: 1.5,
                  borderRadius: "16px",
                  backgroundColor: "success.light",
                  color: "success.contrastText",
                }}
              >
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  📊 Статистика сжатия изображений:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                  {compressionInfo.map((info, index) => (
                    <Box
                      key={index}
                      sx={{
                        minWidth: 120,
                        textAlign: "center",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        p: 1,
                        borderRadius: "8px",
                      }}
                    >
                      <Typography variant="caption" display="block">
                        Фото {index + 1}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {info.compressionRatio.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption">экономии</Typography>
                    </Box>
                  ))}
                </Box>
                <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                  💡 Изображения автоматически сжаты до оптимального качества
                </Typography>
              </Paper>
            )}

            {/* Индикатор обработки изображений */}
            {isProcessingImages && (
              <Paper
                sx={{
                  p: 1.5,
                  mt: 1.5,
                  borderRadius: "16px",
                  backgroundColor: "info.light",
                  color: "info.contrastText",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <CompressIcon />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Сжатие изображений...
                    </Typography>
                    <LinearProgress
                      variant="indeterminate"
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.3)",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "white",
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Paper>
            )}

            {photos.length > 0 && (
              <Paper
                sx={{
                  p: 1.5,
                  mt: 1.5,
                  borderRadius: "16px",
                  backgroundColor: "background.default",
                }}
              >
                {/* Индикатор использования лимитов */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                    px: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Использовано: {photos.length}/10 фото
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Размер:{" "}
                    {(() => {
                      const totalSize = photos.reduce((sum, photo) => {
                        // Приблизительный расчет размера base64 строки
                        return sum + Math.round(photo.length * 0.75);
                      }, 0);
                      return totalSize < 1024 * 1024
                        ? `${Math.round(totalSize / 1024)} КБ`
                        : `${(totalSize / (1024 * 1024)).toFixed(1)} МБ`;
                    })()}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {photos.map((photo, index) => (
                    <Box key={index} sx={{ position: "relative" }}>
                      <img
                        src={photo}
                        alt={`Фото ${index + 1}`}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: "12px",
                          cursor: "pointer",
                        }}
                        onClick={() => handlePhotoClick(index)}
                        title="Нажмите для полноэкранного просмотра"
                      />
                      <IconButton
                        size="small"
                        onClick={() => removePhoto(index)}
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          backgroundColor: "error.main",
                          color: "white",
                          width: 20,
                          height: 20,
                          "&:hover": { backgroundColor: "error.dark" },
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{ borderRadius: "12px", px: 3, py: 1.2 }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            borderRadius: "12px",
            px: 3,
            py: 1.2,
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          {client ? "Сохранить" : "Добавить"}
        </Button>
      </DialogActions>

      {/* Галерея фотографий */}
      <PropertyGallery
        open={selectedPhotoIndex !== null}
        onClose={closePhotoViewer}
        photos={photos}
        initialIndex={selectedPhotoIndex ?? 0}
      />
    </Dialog>
  );
}
