// src/components/PropertyGallery.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

interface PropertyGalleryProps {
  open: boolean;
  onClose: () => void;
  photos: string[];
}

export default function PropertyGallery({
  open,
  onClose,
  photos,
}: PropertyGalleryProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Проверяем наличие фотографий
  if (!photos.length) {
    return null;
  }

  const goToNext = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, []);

  // Обработка клавиатурной навигации
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrev();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Предотвращаем скролл страницы когда галерея открыта
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, goToNext, goToPrev]);

  // Сброс индекса при смене фотографий
  useEffect(() => {
    if (currentPhotoIndex >= photos.length) {
      setCurrentPhotoIndex(0);
    }
  }, [photos.length, currentPhotoIndex]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      maxWidth={false}
      PaperProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <DialogContent
        sx={{
          padding: 0,
          backgroundColor: "transparent",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Кнопка закрытия */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: isMobile ? 16 : 24,
            right: isMobile ? 16 : 24,
            color: "white",
            zIndex: 10,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
          }}
          size={isMobile ? "medium" : "large"}
        >
          <CloseIcon />
        </IconButton>

        {/* Кнопка предыдущей фотографии */}
        {photos.length > 1 && (
          <IconButton
            onClick={goToPrev}
            sx={{
              position: "absolute",
              left: isMobile ? 8 : 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
              zIndex: 10,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(8px)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
            size={isMobile ? "medium" : "large"}
          >
            <ChevronLeft sx={{ fontSize: isMobile ? 24 : 32 }} />
          </IconButton>
        )}

        {/* Кнопка следующей фотографии */}
        {photos.length > 1 && (
          <IconButton
            onClick={goToNext}
            sx={{
              position: "absolute",
              right: isMobile ? 8 : 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
              zIndex: 10,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(8px)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
            }}
            size={isMobile ? "medium" : "large"}
          >
            <ChevronRight sx={{ fontSize: isMobile ? 24 : 32 }} />
          </IconButton>
        )}

        {/* Основное изображение */}
        <Box
          component="img"
          src={photos[currentPhotoIndex]}
          alt={`Фото ${currentPhotoIndex + 1}`}
          sx={{
            maxWidth: isMobile ? "95vw" : "90vw",
            maxHeight: isMobile ? "80vh" : "90vh",
            objectFit: "contain",
            borderRadius: isMobile ? 0 : 2,
            boxShadow: isMobile ? "none" : "0 8px 32px rgba(0, 0, 0, 0.3)",
            transition: "transform 0.3s ease-in-out",
            "&:hover": {
              transform: isMobile ? "none" : "scale(1.02)",
            },
          }}
          onClick={photos.length > 1 ? goToNext : undefined}
        />

        {/* Индикация текущей фотографии */}
        {photos.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: isMobile ? 16 : 24,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 1,
              zIndex: 10,
            }}
          >
            {photos.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentPhotoIndex(index)}
                sx={{
                  width: isMobile ? 8 : 12,
                  height: isMobile ? 8 : 12,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentPhotoIndex
                      ? "white"
                      : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor:
                      index === currentPhotoIndex
                        ? "white"
                        : "rgba(255, 255, 255, 0.8)",
                    transform: "scale(1.2)",
                  },
                }}
              />
            ))}
          </Box>
        )}

        {/* Счетчик фотографий */}
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            bottom: isMobile ? 48 : 56,
            right: isMobile ? 16 : 24,
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            padding: "4px 8px",
            borderRadius: 1,
            fontSize: isMobile ? "0.7rem" : "0.75rem",
            fontWeight: 500,
          }}
        >
          {currentPhotoIndex + 1} из {photos.length}
        </Typography>

        {/* Инструкции для пользователя */}
        {photos.length > 1 && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: isMobile ? 60 : 80,
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: isMobile ? "0.7rem" : "0.75rem",
              textAlign: "center",
              backgroundColor: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(8px)",
              padding: "4px 12px",
              borderRadius: 1,
            }}
          >
            Используйте ← → или нажмите на изображение
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
