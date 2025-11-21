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
  initialIndex?: number | null;
}

export default function PropertyGallery({
  open,
  onClose,
  photos,
  initialIndex = 0,
}: PropertyGalleryProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(
    Math.max(0, Math.min(initialIndex || 0, (photos?.length || 1) - 1))
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const goToNext = useCallback(() => {
    if (!photos?.length) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  }, [photos?.length]); // ✅ Добавлен optional chaining

  const goToPrev = useCallback(() => {
    if (!photos?.length) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos?.length]); // ✅ Добавлен optional chaining

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
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, goToNext, goToPrev]);

  // Сброс индекса при смене фотографий
  useEffect(() => {
    if (photos?.length && currentPhotoIndex >= photos.length) {
      setCurrentPhotoIndex(0);
    }
  }, [photos?.length, currentPhotoIndex]);

  // Обновление индекса при изменении initialIndex
  useEffect(() => {
    if (initialIndex !== undefined && initialIndex !== null && photos?.length) {
      const safeIndex = Math.max(0, Math.min(initialIndex, photos.length - 1));
      setCurrentPhotoIndex(safeIndex);
    }
  }, [initialIndex, photos?.length]);

  // ✅ ПЕРЕНЕСЕНО: проверка условий ПОСЛЕ всех хуков
  if (!open || !photos?.length || photos.length === 0) {
    return null;
  }

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
      {/* Остальной JSX код без изменений */}
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
        {/* ... остальной JSX код ... */}
      </DialogContent>
    </Dialog>
  );
}
