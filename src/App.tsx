// src/App.tsx - Главный компонент приложения
/**
 * Это корневой компонент приложения, который:
 * - Настраивает маршрутизацию
 * - Управляет глобальным состоянием и побочными эффектами
 * - Определяет структуру layout'а
 * - Обрабатывает загрузку компонентов
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { lazy, Suspense } from "react";
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
import { NotificationsContainer } from "./hooks/useNotifications.tsx";

// Lazy loading для оптимизации производительности
/**
 * Lazy Loading (ленивая загрузка) - техника оптимизации
 * Компоненты загружаются только когда они нужны
 *
 * Преимущества:
 * - Уменьшает время первой загрузки (TTI)
 * - Снижает размер bundle'а
 * - Улучшает производительность на медленных устройствах
 * - Позволяет code splitting по маршрутам
 *
 * import() - динамический импорт, возвращает Promise
 */
const ClientsPage = lazy(() => import("./pages/ClientsPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

/**
 * LoadingFallback - компонент для отображения во время загрузки lazy компонентов
 *
 * Suspense отображает fallback когда lazy компонент еще загружается
 */
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

/**
 * Главный компонент App
 *
 * Архитектура:
 * 1. BrowserRouter - провайдер для React Router
 * 2. Header - навигация и брендинг
 * 3. Container - основной контент с адаптивной шириной
 * 4. Routes - маршруты приложения
 * 5. NotificationsContainer - глобальные уведомления
 */
function App() {
  /**
   * useMeetingNotifications - хук для управления уведомлениями о встречах
   * Инициализируется при монтировании компонента
   */
  useMeetingNotifications();

  const theme = useTheme();

  // useMediaQuery - хук Material UI для определения размера экрана
  // Позволяет создавать адаптивный дизайн
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  /**
   * Предзагрузка компонентов для улучшения производительности
   * Хук preloadComponent загружает компоненты в фоне при наведении/наведении
   */
  const { preloadComponent } = usePreloadComponents();

  /**
   * useEffect для предзагрузки основных страниц при старте приложения
   *
   * preloadMainPages - функция, которая загружает все основные страницы
   * в фоновом режиме, чтобы при переходе они открывались мгновенно
   */
  useEffect(() => {
    preloadMainPages(preloadComponent);
  }, []);

  return (
    /**
     * BrowserRouter - провайдер React Router
     * Обеспечивает навигацию и работу с URL
     */
    <BrowserRouter>
      <Box
        className="app-container"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh", // Минимальная высота = высота экрана
          backgroundColor: "background.default",
          overflowX: "hidden", // Предотвращение горизонтального скролла
        }}
      >
        {/* Header - шапка приложения с навигацией */}
        <Header />

        {/* main - основной контент */}
        <Box
          component="main"
          className="main-content fade-in"
          sx={{
            flexGrow: 1, // Занимает все доступное пространство
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            py: { xs: 1, sm: 2 }, // Адаптивные отступы
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          {/* Container - адаптивный контейнер Material UI */}
          <Container
            maxWidth="lg" // Максимальная ширина large
            disableGutters={isMobile} // Убираем отступы на мобильных
            sx={{
              width: "100%",
              maxWidth: isMobile ? "100%" : isTablet ? "900px" : "1200px",
              mx: "auto", // Центрирование
              px: { xs: 0, sm: 2 }, // Убираем padding на мобильных
            }}
          >
            {/* Suspense - обертка для lazy компонентов */}
            <Suspense fallback={<LoadingFallback />}>
              {/* Routes - маршруты приложения */}
              <Routes>
                {/* Страница входа - публичная */}
                <Route path="/login" element={<LoginPage />} />

                {/* Главная страница - защищенная */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <ClientsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Страница клиентов - защищенная */}
                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute>
                      <ClientsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Страница истории - защищенная */}
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />

                {/* Страница календаря - защищенная */}
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />

                {/* Страница профиля - защищенная */}
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

        {/* Контейнер для глобальных уведомлений */}
        {/* Отображается поверх всего контента */}
        <NotificationsContainer />
      </Box>
    </BrowserRouter>
  );
}

export default App;
