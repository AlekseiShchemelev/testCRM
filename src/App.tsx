// src/App.tsx
import { BrowserRouter, Routes, Route, Suspense } from "react-router-dom";
import React, { lazy } from "react";
import {
  Box,
  Container,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import { useMeetingNotifications } from "./hooks/useMeetingNotifications";
import {
  usePreloadComponents,
  preloadMainPages,
} from "./hooks/usePreloadComponents";
import { NotificationsContainer } from "./hooks/useNotifications";

// Lazy loading для оптимизации производительности
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

// Компонент загрузки
const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      py: 4,
      minHeight: "200px",
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      Загрузка...
    </Typography>
  </Box>
);

function App() {
  useMeetingNotifications();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Предзагрузка компонентов для улучшения производительности
  const { preloadComponent } = usePreloadComponents();

  useEffect(() => {
    preloadMainPages(preloadComponent);
  }, [preloadComponent]);

  return (
    <BrowserRouter>
      <Box
        className="app-container"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "background.default",
          overflowX: "hidden", // Предотвращение горизонтального скролла
        }}
      >
        <Header />

        <Box
          component="main"
          className="main-content fade-in"
          sx={{
            flexGrow: 1,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            py: { xs: 1, sm: 2 },
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <Container
            maxWidth="lg"
            disableGutters={isMobile}
            sx={{
              width: "100%",
              maxWidth: isMobile ? "100%" : isTablet ? "900px" : "1200px",
              mx: "auto",
              px: { xs: 0, sm: 2 }, // Убираем padding на мобильных
            }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <ClientsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute>
                      <ClientsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </Container>
        </Box>

        {/* Контейнер для уведомлений */}
        <NotificationsContainer />
      </Box>
    </BrowserRouter>
  );
}

export default App;
