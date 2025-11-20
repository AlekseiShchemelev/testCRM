// src/components/ClientCard.tsx
import { useState, useCallback } from "react";
import { Card, CardMedia, Typography, Box } from "@mui/material";
import ActionMenu from "./ActionMenu";
import PropertyGallery from "./PropertyGallery";
import type { Client } from "../types";
import { Link as LinkIcon } from "@mui/icons-material";
import { Button } from "@mui/material";

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: () => void;
  onMarkCompleted: () => void;
  onMarkCancelled: () => void;
  onShowOnMap: () => void;
  onShowRoute: () => void;
}

export default function ClientCard({
  client,
  onEdit,
  onDelete,
  onMarkCompleted,
  onMarkCancelled,
  onShowOnMap,
  onShowRoute,
}: ClientCardProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);

  const openPropertyGallery = (photos: string[]) => {
    setGalleryPhotos(photos);
    setIsGalleryOpen(true);
  };

  const closePropertyGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);

  return (
    <Card
      elevation={1}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        mb: { xs: 1.5, sm: 1 },
        p: { xs: 1.5, sm: 1 },
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "divider",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          elevation: 3,
          borderColor: "primary.main",
          transform: "translateY(-1px)",
        },
        gap: { xs: 1, sm: 0 },
      }}
    >
      {/* Миниатюра */}
      <Box
        sx={{
          position: "relative",
          mr: { xs: 0, sm: 1.5 },
          alignSelf: { xs: "center", sm: "flex-start" },
          mt: { xs: 0, sm: 0.5 },
        }}
      >
        <CardMedia
          component="img"
          sx={{
            width: { xs: 80, sm: 60, md: 70 },
            height: { xs: 80, sm: 60, md: 70 },
            borderRadius: "8px",
            objectFit: "cover",
            flexShrink: 0,
            cursor: client.propertyPhotos?.length ? "pointer" : "default",
            transition: "transform 0.2s ease-in-out",
            "&:hover": client.propertyPhotos?.length
              ? { transform: "scale(1.05)" }
              : {},
          }}
          image={
            client.propertyPhotos?.[0] ||
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHZpZXdCb3g9IjAgMCA3MCA3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzUiIGN5PSIzNSIgcj0iMzUiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Ik0yMSAxMWMtMS42MTYgMC0zIDEuMzg0LTMgM3MzIDEuMzg0IDMgMyAzdjJjMCAxLjYxNi0xLjM4NCAzLTMgM0MtNS4zODYgMjEuNSA0IDE5LjEwNCA0IDE3VjE0YzAtMS42MTYgMS4zODQtMyAzLTN6bTAgMmMtMi4yMDcgMC00IDEuNzkzLTQgNEMxNyAxNC43OTcgMTguMjA3IDEzIDE5IDEzYzEuNzkzIDAgMyAxLjc5MyAzIDRjMCAyLjIwNy0xLjIwNyA0LTQgNHptMCA0Yy0zLjMyNCAwLTEwIDEuNjc2LTEwIDZWNWMwIDQuMzI0IDYuNjc2IDYgMTAgNnMxMC0xLjY3NiAxMC02VjE5YzAtNC4zMjQtNi42NzYtNi0xMC02eiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4KPC9zdmc+"
          }
          alt="Фото объекта"
          onClick={() => {
            if (client.propertyPhotos?.length) {
              openPropertyGallery(client.propertyPhotos);
            }
          }}
          title="Нажмите для просмотра фото"
        />
        {client.propertyPhotos && client.propertyPhotos.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: -4, sm: 2 },
              right: { xs: -4, sm: 2 },
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "white",
              borderRadius: "50%",
              width: { xs: 24, sm: 20 },
              height: { xs: 24, sm: 20 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: { xs: "0.75rem", sm: "0.7rem" },
              cursor: "pointer",
              border: "2px solid white",
            }}
            onClick={(e) => {
              e.stopPropagation();
              openPropertyGallery(client.propertyPhotos!);
            }}
          >
            +{client.propertyPhotos.length - 1}
          </Box>
        )}
      </Box>

      {/* Основная информация */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0, // Важно для правильного переноса текста
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: "1rem", sm: "1.125rem" },
            fontWeight: 600,
            wordBreak: "break-word",
            lineHeight: 1.3,
          }}
        >
          {client.fullName}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "0.875rem" } }}
          >
            📞 {client.phone}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: "0.875rem", sm: "0.875rem" },
              wordBreak: "break-word",
              lineHeight: 1.4,
            }}
          >
            📍 {client.address}
          </Typography>
        </Box>

        {/* Комментарии */}
        {client.comments && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              fontSize: { xs: "0.8rem", sm: "0.85rem" },
              fontStyle: "italic",
              lineHeight: 1.4,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            💬 {client.comments}
          </Typography>
        )}

        {/* Ссылка на объявление */}
        {client.listingUrl && (
          <Box sx={{ mt: 0.5 }}>
            <Button
              component="a"
              href={client.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="outlined"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                fontWeight: 500,
                color: "primary.main",
                borderColor: "primary.main",
                py: { xs: 0.5, sm: 0.75 },
                px: { xs: 1, sm: 1.5 },
                "&:hover": {
                  backgroundColor: "primary.lighter",
                  borderColor: "primary.dark",
                },
              }}
              startIcon={<LinkIcon fontSize="small" />}
            >
              Смотреть объявление
            </Button>
          </Box>
        )}

        {/* Дата встречи */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: "auto",
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            pt: 0.5,
          }}
        >
          📅{" "}
          {new Date(client.meetingDate).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          • 🕐{" "}
          {new Date(client.meetingDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Box>

      {/* Действия */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "center", sm: "flex-start" },
          justifyContent: { xs: "space-between", sm: "center" },
          mt: { xs: 1, sm: 0 },
          pt: { xs: 1, sm: 0.5 },
          borderTop: { xs: "1px solid", sm: "none" },
          borderColor: { xs: "divider", sm: "transparent" },
          gap: 1,
        }}
      >
        <ActionMenu
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkCompleted={onMarkCompleted}
          onMarkCancelled={onMarkCancelled}
          onShowOnMap={onShowOnMap}
          onShowRoute={onShowRoute}
          compact={false}
        />
      </Box>

      {/* Галерея фото */}
      <PropertyGallery
        open={isGalleryOpen}
        onClose={closePropertyGallery}
        photos={galleryPhotos}
      />
    </Card>
  );
}
