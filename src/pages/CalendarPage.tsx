// src/pages/CalendarPage.tsx
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  AccessTime,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  isSameDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import type { Client } from "../types";
import { getClientsByDate, updateClient } from "../services/clientService";
import { addHistoryEntry } from "../services/historyService";
import { useNotifications } from "../hooks/useNotifications";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Client[]>([]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClientForStatus, setSelectedClientForStatus] =
    useState<Client | null>(null);

  const { showError } = useNotifications();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const loadMeetings = async () => {
      const data = await getClientsByDate(selectedDate);
      setMeetings(data);
    };
    loadMeetings();
  }, [selectedDate]);

  const renderCalendar = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(start);
    const days = eachDayOfInterval({ start, end });

    const firstDayOfMonth = getDay(start);
    const daysBefore = Array.from({ length: firstDayOfMonth }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() - firstDayOfMonth + i);
      return d;
    });

    const calendarDays = [...daysBefore, ...days];

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: isMobile ? "2px" : "4px",
          mb: 2,
          textAlign: "center",
        }}
      >
        {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((day) => (
          <Box
            key={day}
            sx={{
              fontWeight: "bold",
              py: isMobile ? 0.3 : 0.5,
              fontSize: isMobile ? "0.7rem" : "0.85rem",
              color: "text.secondary",
            }}
          >
            {day}
          </Box>
        ))}

        {calendarDays.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);

          return (
            <Box
              key={idx}
              onClick={() => setSelectedDate(day)}
              sx={{
                py: isMobile ? 0.3 : 0.5,
                cursor: "pointer",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: isSelected ? "bold" : "normal",
                  backgroundColor: isSelected
                    ? "#1976d2"
                    : isTodayDay
                    ? "rgba(25, 118, 210, 0.1)"
                    : "transparent",
                  color: isSelected
                    ? "white"
                    : isCurrentMonth
                    ? "text.primary"
                    : "text.disabled",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                {format(day, "d")}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleStatusClick = (client: Client, element: HTMLElement) => {
    setSelectedClientForStatus(client);
    setAnchorEl(element);
  };

  const handleStatusClose = () => {
    setAnchorEl(null);
    setSelectedClientForStatus(null);
  };

  const handleStatusChange = async (
    newStatus: "planned" | "completed" | "cancelled"
  ) => {
    if (!selectedClientForStatus) return;

    try {
      await updateClient(selectedClientForStatus.id!, { status: newStatus });
      setMeetings((prev) =>
        prev.map((client) =>
          client.id === selectedClientForStatus.id
            ? { ...client, status: newStatus }
            : client
        )
      );
      await addHistoryEntry({
        clientId: selectedClientForStatus.id!,
        action:
          newStatus === "completed"
            ? "meeting_completed"
            : newStatus === "cancelled"
            ? "meeting_cancelled"
            : "updated",
        details: `Статус встречи изменён на: ${newStatus}`,
      });
      handleStatusClose();
    } catch (error: any) {
      console.error("Ошибка при обновлении статуса:", error);
      showError(
        error.message || "Не удалось изменить статус. Попробуйте позже."
      );
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Календарь
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Выберите дату для просмотра встреч.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 1.5 : 2,
          mb: 2,
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: isMobile ? 1 : 2,
          }}
        >
          <Button onClick={handlePrevMonth} startIcon={<ChevronLeft />}>
            {format(currentMonth, "MMMM yyyy", { locale: ru })}
          </Button>
          <Button onClick={handleNextMonth} endIcon={<ChevronRight />} />
        </Box>
        {renderCalendar()}
      </Paper>

      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Встречи на {format(selectedDate, "dd.MM.yyyy")}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Список запланированных встреч на выбранную дату.
      </Typography>

      {meetings.length > 0 ? (
        meetings.map((client) => (
          <Paper
            key={client.id}
            sx={{
              mb: 1.5,
              p: isMobile ? 1.5 : 2,
              borderRadius: "16px",
              display: "flex",
              gap: 1.5,
              alignItems: "center",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                handleStatusClick(client, e.currentTarget);
              }}
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor:
                  client.status === "completed"
                    ? "#4caf50"
                    : client.status === "cancelled"
                    ? "#f44336"
                    : "#1976d2",
                cursor: "pointer",
                "&:hover": { opacity: 0.8 },
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {client.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {client.phone}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.85rem" }}
              >
                {client.address}
              </Typography>
            </Box>
          </Paper>
        ))
      ) : (
        <Paper
          sx={{
            p: 3,
            textAlign: "center",
            borderRadius: "16px",
            backgroundColor: "background.default",
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Нет встреч на эту дату.
          </Typography>
        </Paper>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleStatusClose}
      >
        <MenuItem onClick={() => handleStatusChange("planned")}>
          <ListItemIcon>
            <AccessTime fontSize="small" />
          </ListItemIcon>
          <ListItemText>Запланирована</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange("completed")}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Состоялась</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange("cancelled")}>
          <ListItemIcon>
            <Cancel fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Отменена</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
