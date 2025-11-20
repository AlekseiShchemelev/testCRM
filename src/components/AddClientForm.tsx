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
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === files.length) {
          setPhotos((prev) => [...prev, ...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
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
                        }}
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
    </Dialog>
  );
}
