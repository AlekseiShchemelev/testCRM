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
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { addClient, updateClient } from "../services/clientService";
import { addHistoryEntry } from "../services/historyService";
import { useNotifications } from "../hooks/useNotifications";
import type { Client } from "../types";
import VoiceTextField from "./VoiceTextField";

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

    Array.from(files).forEach((file) => {
      // Проверяем тип файла (только изображения)
      if (!file.type.startsWith("image/")) {
        console.warn(
          `Файл ${file.name} не является изображением и будет пропущен`
        );
        processedCount++;
        return;
      }

      // Убираем ограничения по размеру файла - принимаем любые размеры
      const reader = new FileReader();
      reader.onload = () => {
        newPhotos.push(reader.result as string);
        processedCount++;

        // Когда все файлы обработаны, обновляем состояние
        if (processedCount === files.length) {
          setPhotos((prev) => [...prev, ...newPhotos]);
        }
      };

      reader.onerror = () => {
        console.error(`Ошибка при чтении файла ${file.name}`);
        processedCount++;
        if (processedCount === files.length) {
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

  const navigatePhoto = (direction: "prev" | "next") => {
    if (selectedPhotoIndex === null) return;

    if (direction === "prev") {
      setSelectedPhotoIndex(
        selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : photos.length - 1
      );
    } else {
      setSelectedPhotoIndex(
        selectedPhotoIndex < photos.length - 1 ? selectedPhotoIndex + 1 : 0
      );
    }
  };

  const title = client ? "Редактировать клиента" : "Добавить нового клиента";

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

      {/* Полноэкранный просмотр фото */}
      {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          onClick={closePhotoViewer}
        >
          <Box
            sx={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              alignItems: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[selectedPhotoIndex]}
              alt={`Фото ${selectedPhotoIndex + 1}`}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />

            {/* Кнопка закрытия */}
            <IconButton
              onClick={closePhotoViewer}
              sx={{
                position: "absolute",
                top: -40,
                right: 0,
                color: "white",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Кнопки навигации */}
            {photos.length > 1 && (
              <>
                <IconButton
                  onClick={() => navigatePhoto("prev")}
                  sx={{
                    position: "absolute",
                    left: -50,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                  }}
                >
                  <ChevronLeft fontSize="large" />
                </IconButton>
                <IconButton
                  onClick={() => navigatePhoto("next")}
                  sx={{
                    position: "absolute",
                    right: -50,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                  }}
                >
                  <ChevronRight fontSize="large" />
                </IconButton>
              </>
            )}

            {/* Счетчик фото */}
            {photos.length > 1 && (
              <Typography
                sx={{
                  position: "absolute",
                  bottom: -40,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "white",
                  fontSize: "0.9rem",
                }}
              >
                {selectedPhotoIndex + 1} из {photos.length}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
