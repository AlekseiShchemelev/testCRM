import { useState, useEffect } from "react";
import {
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Download,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import type { HistoryEntry } from "../types";
import { getHistory, clearHistory } from "../services/historyService";
import ConfirmDialog from "../components/ConfirmDialog";
import { useNotifications } from "../hooks/useNotifications";
import {
  exportHistoryToCSV,
  createFilenameWithDate,
} from "../utils/exportUtils";

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const { showSuccess, showError } = useNotifications();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    loadHistory();
    loadClients();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (err: any) {
      console.error("Ошибка загрузки истории:", err);
      showError(err.message || "Не удалось загрузить историю");
    }
  };

  const loadClients = () => {
    try {
      // Пробуем разные возможные ключи
      const clientsData = localStorage.getItem("clients");
      const customersData = localStorage.getItem("customers");

      if (clientsData) {
        const parsedClients = JSON.parse(clientsData);
        setClients(parsedClients);
        console.log("Загружены клиенты из localStorage:", parsedClients);
      } else if (customersData) {
        const parsedCustomers = JSON.parse(customersData);
        setClients(parsedCustomers);
        console.log("Загружены клиенты из customers:", parsedCustomers);
      } else {
        console.log("Клиенты не найдены в localStorage");
      }
    } catch (error) {
      console.error("Ошибка загрузки клиентов:", error);
    }
  };

  const handleExportToExcel = () => {
    const filename = createFilenameWithDate("history");
    exportHistoryToCSV(history, filename, showSuccess);
  };

  const handleClearAll = () => {
    setClearConfirm(true);
  };

  const confirmClearAll = async () => {
    setClearing(true);
    try {
      await clearHistory();
      setHistory([]);
      showSuccess("История успешно очищена");
      setClearConfirm(false);
    } catch (err: any) {
      console.error("Ошибка очистки истории:", err);
      showError(err.message || "Не удалось очистить историю");
    } finally {
      setClearing(false);
    }
  };

  const cancelClearAll = () => {
    setClearConfirm(false);
  };

  const getActionIcon = (action: string) => {
    if (action.includes("добавлен")) return "➕";
    if (action.includes("изменен")) return "✏️";
    if (action.includes("удален")) return "🗑️";
    if (action.includes("встреча")) return "📅";
    return "📋";
  };

  const getActionColor = (action: string) => {
    if (action.includes("добавлен")) return "success";
    if (action.includes("изменен")) return "info";
    if (action.includes("удален")) return "error";
    if (action.includes("встреча")) return "warning";
    return "default";
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
          <HistoryIcon
            sx={{ fontSize: { xs: 28, sm: 32 }, color: "primary.main" }}
          />
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.25rem" },
            }}
          >
            История действий
          </Typography>
        </Box>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          Здесь отображаются все изменения в списке клиентов и операции с
          данными.
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
          startIcon={<Download />}
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
            Экспорт истории
          </Box>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Экспорт в CSV
          </Box>
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={<ClearIcon />}
          onClick={handleClearAll}
          disabled={history.length === 0 || clearing}
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
          }}
        >
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            {clearing ? "Очистка..." : "Очистить историю"}
          </Box>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {clearing ? "Очистка..." : "Очистить данные"}
          </Box>
        </Button>
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
              key={entry.id!}
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
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    backgroundColor: `${getActionColor(entry.action)}.light`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  {getActionIcon(entry.action)}
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
                    {entry.action}
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

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.8rem" },
                      wordBreak: "break-word",
                    }}
                  >
                    👤 ID клиента: {entry.clientId}
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

      {/* Диалог подтверждения очистки истории */}
      <ConfirmDialog
        open={clearConfirm}
        title="Очистить историю?"
        message="Вы уверены, что хотите очистить всю историю действий? Это действие нельзя отменить."
        confirmText="Очистить"
        cancelText="Отмена"
        severity="warning"
        loading={clearing}
        onConfirm={confirmClearAll}
        onCancel={cancelClearAll}
      />
    </Box>
  );
}
