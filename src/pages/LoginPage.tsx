// src/pages/LoginPage.tsx
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Container,
} from "@mui/material";
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const from = (location.state as any)?.from?.pathname || "/";

  const auth = getAuth();

  // Проверяем, не авторизован ли уже пользователь
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate(from, { replace: true });
      }
    });
    return () => unsubscribe();
  }, [auth, from, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Перенаправление произойдёт через onAuthStateChanged
    } catch (err: any) {
      console.error("Ошибка входа:", err);
      let errorMessage = "Не удалось войти. Попробуйте позже.";

      // Более детальная обработка ошибок
      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "Окно входа было закрыто. Попробуйте снова.";
      } else if (err.code === "auth/popup-blocked") {
        errorMessage =
          "Всплывающее окно заблокировано. Разрешите всплывающие окна для этого сайта.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Ошибка сети. Проверьте подключение к интернету.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          width: "100%",
          maxWidth: 480,
          borderRadius: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Логотип и заголовок */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              backgroundColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "1.5rem",
              mx: "auto",
              mb: 2,
              boxShadow: "0 4px 20px rgba(25, 118, 210, 0.3)",
            }}
          >
            R
          </Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.75rem", sm: "2rem" },
              background: "linear-gradient(45deg, #1976d2, #42a5f5)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            RealtorCRM
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontWeight: 400,
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            Система управления клиентами
          </Typography>
        </Box>

        {/* Описание */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              lineHeight: 1.6,
              fontSize: { xs: "0.9rem", sm: "1rem" },
            }}
          >
            Войдите в систему, чтобы начать работу с клиентами и встречами
          </Typography>
        </Box>

        {/* Ошибки */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2,
              "& .MuiAlert-message": {
                width: "100%",
              },
            }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Кнопка входа */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleGoogleLogin}
          fullWidth
          disabled={loading}
          size={isMobile ? "large" : "large"}
          sx={{
            py: { xs: 1.5, sm: 1.75 },
            borderRadius: 2,
            fontSize: { xs: "1rem", sm: "1.1rem" },
            fontWeight: 600,
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
            "&:hover": {
              boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)",
              transform: "translateY(-1px)",
            },
            "&:disabled": {
              backgroundColor: "action.disabledBackground",
              color: "action.disabled",
              boxShadow: "none",
              transform: "none",
            },
            transition: "all 0.2s ease-in-out",
          }}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Box
                component="img"
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0Y1RjVGNSIvPgo8cGF0aCBkPSJNMTMuMyA1LjZIMTVWNC41SDYuNVY1LjZIOFY2LjVIMTQuNVY4SDYuNVY5LjVIOFYxMC41SDE0LjVWMTJINi41VjEzSDhWMTQuNUgxNC41VjE2SDZWMjBIMTRWMjEuNUgxNS4yVjE5SDYuNVYxNy41SDhWMTVIMTQuNVYxMy42SDE2LjRWMTIuM0gxMy4zVjUuNloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo="
                alt="Google"
                sx={{ width: 20, height: 20 }}
              />
            )
          }
        >
          {loading ? "Вход..." : "Войти через Google"}
        </Button>

        {/* Дополнительная информация */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              lineHeight: 1.4,
            }}
          >
            Используя сервис, вы соглашаетесь с{" "}
            <Box
              component="span"
              sx={{
                color: "primary.main",
                textDecoration: "underline",
                cursor: "pointer",
                "&:hover": {
                  color: "primary.dark",
                },
              }}
            >
              политикой конфиденциальности
            </Box>
          </Typography>
        </Box>

        {/* Индикатор статуса */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "success.main",
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%": {
                    opacity: 1,
                  },
                  "50%": {
                    opacity: 0.5,
                  },
                  "100%": {
                    opacity: 1,
                  },
                },
              }}
            />
            Сервис доступен
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
