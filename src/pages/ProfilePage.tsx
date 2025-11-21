// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getHistory, clearHistory } from "../services/historyService";
import { clearAllData } from "../services/dataService";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNotifications } from "../hooks/useNotifications";
import type { HistoryEntry } from "../types";

export default function ProfilePage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { showSuccess, showError, showWarning } = useNotifications();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email);
    } else {
      navigate("/login", { replace: true });
    }

    const loadHistory = async () => {
      try {
        const data = await getHistory();
        setHistory(data.slice(0, 10));
        setError(null);
      } catch (err: any) {
        console.error("Ошибка загрузки истории:", err);
        setError(err.message || "Не удалось загрузить историю");
      }
    };
    loadHistory();
  }, [auth, navigate]);

  const handleExportToExcel = () => {
    // Формируем CSV с разными вариантами для надежности
    const headers = ["Дата и время", "Действие", "ID клиента", "Детали"];

    const csvRows = history.map((h) => [
      new Date(h.timestamp).toLocaleString("ru-RU"),
      h.action,
      h.clientId,
      h.details || "",
    ]);

    // Вариант 1: UTF-8 с BOM и разделителем табуляции
    const contentV1 = [
      headers.join("\t"),
      ...csvRows.map((row) => row.join("\t")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + contentV1], {
      type: "text/csv; charset=utf-8",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `profile_history_${new Date().toISOString().split("T")[0]}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(
      "Файл экспортирован. Если в Excel некорректное отображение, попробуйте открыть через 'Данные' → 'Получить данные' → 'Из текста/CSV'"
    );
  };

  const handleClearAll = () => {
    setClearConfirm(true);
  };

  const confirmClearAll = async () => {
    setClearing(true);
    try {
      const result = await clearAllData();
      setHistory([]);
      setError(null);
      showSuccess(result.message || "Все данные успешно удалены!");
      setClearConfirm(false);
    } catch (err: any) {
      console.error("Ошибка очистки:", err);
      showError(err.message || "Не удалось очистить данные");
    } finally {
      setClearing(false);
    }
  };

  const cancelClearAll = () => {
    setClearConfirm(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error("Ошибка выхода:", err);
      showError(err.message || "Не удалось выйти из аккаунта");
    } finally {
      setSigningOut(false);
    }
  };

  const stats = history.reduce(
    (acc, entry) => {
      if (entry.action === "created") acc.created++;
      else if (entry.action === "updated") acc.updated++;
      else if (entry.action === "deleted") acc.deleted++;
      return acc;
    },
    { created: 0, updated: 0, deleted: 0 }
  );

  const getActionText = (action: HistoryEntry["action"]) => {
    switch (action) {
      case "created":
        return "добавлен";
      case "updated":
        return "обновлён";
      case "deleted":
        return "удалён";
      case "meeting_completed":
        return "встреча состоялась";
      case "meeting_cancelled":
        return "встреча отменена";
      default:
        return action;
    }
  };

  return (
    <Box
      className="content-wrapper fade-in"
      sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}
    >
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: { xs: 1, sm: 2 },
          }}
        >
          <PersonIcon
            sx={{ fontSize: { xs: 28, sm: 32 }, color: "primary.main" }}
          />
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.25rem" },
            }}
          >
            {userEmail || "Профиль"}
          </Typography>
        </Box>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          Ваша активность в приложении и настройки аккаунта
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: { xs: 1, sm: 2 },
          mb: { xs: 2, sm: 3 },
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportToExcel}
          sx={{
            minWidth: { xs: "100%", sm: "auto" },
            height: { xs: 48, sm: 56 },
            borderRadius: "12px",
            px: { xs: 3, sm: 2 },
            fontSize: { xs: "1rem", sm: "0.875rem" },
            fontWeight: 600,
            borderColor: "primary.main",
            color: "primary.main",
            "&:hover": {
              backgroundColor: "primary.lighter",
              borderColor: "primary.dark",
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            Экспорт данных
          </Box>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Экспорт в CSV
          </Box>
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={
            clearing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <DeleteIcon />
            )
          }
          onClick={handleClearAll}
          disabled={clearing}
          sx={{
            minWidth: { xs: "100%", sm: "auto" },
            height: { xs: 48, sm: 56 },
            borderRadius: "12px",
            px: { xs: 3, sm: 2 },
            fontSize: { xs: "1rem", sm: "0.875rem" },
            fontWeight: 600,
            bgcolor: "error.main",
            "&:hover": {
              bgcolor: "error.dark",
            },
            "&:disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            {clearing ? "Удаление..." : "Удалить все данные"}
          </Box>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {clearing ? "Очистка..." : "Очистить всё"}
          </Box>
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={
            signingOut ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <LogoutIcon />
            )
          }
          onClick={handleSignOut}
          disabled={signingOut}
          sx={{
            minWidth: { xs: "100%", sm: "auto" },
            height: { xs: 48, sm: 56 },
            borderRadius: "12px",
            px: { xs: 3, sm: 2 },
            fontSize: { xs: "1rem", sm: "0.875rem" },
            fontWeight: 600,
            bgcolor: "secondary.main",
            "&:hover": {
              bgcolor: "secondary.dark",
            },
            "&:disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            {signingOut ? "Выход..." : "Выйти из аккаунта"}
          </Box>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {signingOut ? "Выход..." : "Выйти"}
          </Box>
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 24, color: "primary.main" }} />
          <Typography variant="h6" fontWeight="bold">
            Статистика активности
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(auto-fit, minmax(200px, 1fr))",
            },
            gap: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: { xs: 2, sm: 2.5 },
              textAlign: "center",
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                elevation: 2,
                borderColor: "primary.main",
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
              <Box
                sx={{
                  width: { xs: 48, sm: 40 },
                  height: { xs: 48, sm: 40 },
                  borderRadius: "50%",
                  bgcolor: "primary.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: { xs: 20, sm: 16 },
                }}
              >
                ➕
              </Box>
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              color="primary.main"
              sx={{ fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 0.5 }}
            >
              {stats.created}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Добавлено клиентов
            </Typography>
          </Paper>

          <Paper
            elevation={1}
            sx={{
              p: { xs: 2, sm: 2.5 },
              textAlign: "center",
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                elevation: 2,
                borderColor: "warning.main",
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
              <Box
                sx={{
                  width: { xs: 48, sm: 40 },
                  height: { xs: 48, sm: 40 },
                  borderRadius: "50%",
                  bgcolor: "warning.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: { xs: 20, sm: 16 },
                }}
              >
                ✏️
              </Box>
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              color="warning.main"
              sx={{ fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 0.5 }}
            >
              {stats.updated}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Изменено данных
            </Typography>
          </Paper>

          <Paper
            elevation={1}
            sx={{
              p: { xs: 2, sm: 2.5 },
              textAlign: "center",
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                elevation: 2,
                borderColor: "error.main",
              },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
              <Box
                sx={{
                  width: { xs: 48, sm: 40 },
                  height: { xs: 48, sm: 40 },
                  borderRadius: "50%",
                  bgcolor: "error.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: { xs: 20, sm: 16 },
                }}
              >
                🗑️
              </Box>
            </Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              color="error.main"
              sx={{ fontSize: { xs: "2rem", sm: "2.5rem" }, mb: 0.5 }}
            >
              {stats.deleted}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Удалено записей
            </Typography>
          </Paper>
        </Box>
      </Box>

      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <HistoryIcon sx={{ fontSize: 24, color: "primary.main" }} />
          <Typography variant="h6" fontWeight="bold">
            Последние действия
          </Typography>
        </Box>

        {history.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fill, minmax(320px, 1fr))",
                md: "repeat(auto-fill, minmax(380px, 1fr))",
              },
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {history.map((entry) => (
              <Paper
                key={entry.id || entry.timestamp}
                elevation={1}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    elevation: 2,
                    borderColor: "primary.main",
                  },
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      backgroundColor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    {entry.action === "created" && "➕"}
                    {entry.action === "updated" && "✏️"}
                    {entry.action === "deleted" && "🗑️"}
                    {entry.action === "meeting_completed" && "✅"}
                    {entry.action === "meeting_cancelled" && "❌"}
                    {![
                      "created",
                      "updated",
                      "deleted",
                      "meeting_completed",
                      "meeting_cancelled",
                    ].includes(entry.action) && "📋"}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        wordBreak: "break-word",
                        lineHeight: 1.4,
                        mb: 0.5,
                      }}
                    >
                      Клиент {getActionText(entry.action)}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        mb: 1,
                      }}
                    >
                      📅{" "}
                      {new Date(entry.timestamp).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>

                    {entry.details && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          fontSize: { xs: "0.75rem", sm: "0.8rem" },
                          fontStyle: "italic",
                          wordBreak: "break-word",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        💬 {entry.details}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 5 },
              textAlign: "center",
              borderRadius: "16px",
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "action.hover",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1,
              }}
            >
              <HistoryIcon sx={{ fontSize: 32, color: "text.secondary" }} />
            </Box>
            <Typography
              variant="h6"
              color="text.primary"
              sx={{ fontSize: { xs: "1rem", sm: "1.125rem" } }}
            >
              История пуста
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 300 }}
            >
              История действий появится здесь после первых операций с клиентами
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Диалог подтверждения очистки всех данных */}
      <ConfirmDialog
        open={clearConfirm}
        title="Удалить все данные?"
        message="Вы уверены, что хотите удалить ВСЕ данные (клиентов и историю)? Это действие нельзя отменить."
        confirmText="Удалить всё"
        cancelText="Отмена"
        severity="error"
        loading={clearing}
        onConfirm={confirmClearAll}
        onCancel={cancelClearAll}
      />
    </Box>
  );
}
