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
} from "@mui/material";
import {
  Close as CloseIcon,
  AddAPhoto as AddAPhotoIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { addClient, updateClient } from "../services/clientService";
import { addHistoryEntry } from "../services/historyService";
import { useNotifications } from "../hooks/useNotifications";
import type { Client } from "../types";
import VoiceTextField from "./VoiceTextField";
import PropertyGallery from "./PropertyGallery";

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
    }
  }, [open, client]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    let processedCount = 0;
    let errors: string[] = [];

    // Ограничения для фотографий
    const MAX_PHOTOS = 10; // Максимум 10 фотографий
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 МБ максимум на файл
    const MAX_TOTAL_SIZE = 8 * 1024 * 1024; // 8 МБ общий размер

    // Проверяем общее количество фотографий
    if (photos.length + files.length > MAX_PHOTOS) {
      showError(`Можно загрузить максимум ${MAX_PHOTOS} фотографий`);
      return;
    }

    Array.from(files).forEach((file) => {
      // Проверяем тип файла (только изображения)
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} не является изображением`);
        processedCount++;
        return;
      }

      // Проверяем размер файла
      if (file.size > MAX_FILE_SIZE) {
        errors.push(
          `${file.name} превышает максимальный размер ${
            MAX_FILE_SIZE / 1024 / 1024
          } МБ`
        );
        processedCount++;
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;

        // Проверяем общий размер с новыми фотографиями
        const currentTotalSize = photos.reduce(
          (sum, photo) => sum + photo.length,
          0
        );
        const newPhotoSize = base64String.length;

        if (currentTotalSize + newPhotoSize > MAX_TOTAL_SIZE) {
          errors.push(
            `Общий размер фотографий не может превышать ${
              MAX_TOTAL_SIZE / 1024 / 1024
            } МБ`
          );
          processedCount++;
          return;
        }

        newPhotos.push(base64String);
        processedCount++;

        // Когда все файлы обработаны, обновляем состояние
        if (processedCount === files.length) {
          if (errors.length > 0) {
            showError(errors.join("\n"));
          }
          setPhotos((prev) => [...prev, ...newPhotos]);
        }
      };

      reader.onerror = () => {
        errors.push(`Ошибка при чтении файла ${file.name}`);
        processedCount++;
        if (processedCount === files.length) {
          if (errors.length > 0) {
            showError(errors.join("\n"));
          }
          setPhotos((prev) => [...prev, ...newPhotos]);
        }
      };

      reader.readAsDataURL(file);
    });
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
              Максимум: 10 фото, 2 МБ на файл, 8 МБ общий размер
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
                    {Math.round(
                      photos.reduce(
                        (sum, photo) => sum + photo.length * 0.75,
                        0
                      ) / 1024
                    )}{" "}
                    КБ
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
