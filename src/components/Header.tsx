// src/components/Header.tsx - Шапка приложения с навигацией
/**
 * Этот компонент демонстрирует множество современных подходов к React разработке:
 *
 * Архитектурные особенности:
 * - Presentational компонент (только UI, без бизнес-логики)
 * - Conditional rendering для разных размеров экрана
 * - Material UI для консистентного дизайна
 * - React Router для навигации
 * - Responsive дизайн с useMediaQuery
 * - Предзагрузка компонентов для оптимизации
 *
 * Ключевые концепции:
 * - Адаптивная навигация (desktop vs mobile)
 * - Hover эффекты и микроанимации
 * - Активные состояния для текущей страницы
 * - Accessibility (правильные ARIA атрибуты)
 * - Performance оптимизация через preload
 */

// React Router для навигации между страницами
import { Link, useLocation } from "react-router-dom";
// Material UI компоненты для создания современного интерфейса
import {
  Box, // Универсальный контейнер с поддержкой sx
  Typography, // Типографика с автоматическими отступами
  Button, // Кнопки с встроенными состояниями
  useMediaQuery, // Хук для определения размера экрана
  useTheme, // Хук для доступа к теме Material UI
} from "@mui/material";

// Material UI Icons для навигации и UI элементов
import {
  CalendarMonth as CalendarMonthIcon, // Иконка календаря
  Person as PersonIcon, // Иконка профиля
  Menu as MenuIcon, // Иконка меню (не используется)
  Home as HomeIcon, // Иконка дома (главная)
} from "@mui/icons-material";

// React хуки для управления состоянием
import { useState } from "react";

// Пользовательский хук для предзагрузки компонентов
import { usePreloadComponents } from "../hooks/usePreloadComponents";

/**
 * Главный компонент Header
 *
 * Функции:
 * - Отображение логотипа и названия приложения
 * - Навигационное меню (адаптивное)
 * - Определение активной страницы
 * - Предзагрузка компонентов для оптимизации
 */
export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { preloadOnHover } = usePreloadComponents();

  const isActivePage = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Конфигурация навигационных элементов
  // На мобильных скрываем "Клиенты" так как это главная страница
  const navigationItems = [
    {
      path: "/clients",
      label: "Клиенты",
      icon: <HomeIcon fontSize="small" />,
      show: !isMobile, // Показываем только на десктопе
    },
    {
      path: "/calendar",
      label: "Календарь",
      icon: <CalendarMonthIcon fontSize="small" />,
      show: true, // Показываем всегда
    },
    {
      path: "/profile",
      label: "Профиль",
      icon: <PersonIcon fontSize="small" />,
      show: true, // Показываем всегда
    },
  ];

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        justifyContent: "space-between", // Лого слева, меню справа
        alignItems: "center",
        // Адаптивные отступы: xs(мобильные)=1, sm(планшеты)=1.5, md(десктоп)=2
        p: { xs: 1, sm: 1.5, md: 2 },
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        backdropFilter: "blur(8px)", // Размытие фона для glassmorphism эффекта
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 6, sm: 8 }, // Адаптивный зазор между лого и текстом
          textDecoration: "none", // Убираем подчеркивание ссылки
          minWidth: 0, // Важно для правильного сжатия текста
        }}
      >
        <Box
          sx={{
            width: { xs: 28, sm: 32 }, // Адаптивная ширина
            height: { xs: 28, sm: 32 }, // Адаптивная высота
            borderRadius: { xs: "6px", sm: "8px" }, // Закругление углов
            backgroundColor: "primary.main", // Основной цвет темы
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: { xs: "12px", sm: "14px" }, // Адаптивный размер шрифта
            flexShrink: 0, // Не сжимается при переполнении
            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)", // Тень
            transition: "transform 0.2s ease-in-out", // Плавный переход
            "&:hover": {
              transform: "scale(1.05)", // Увеличение при наведении
            },
          }}
        >
          R
        </Box>
        <Typography
          variant={isMobile ? "body1" : "h6"} // Адаптивный размер шрифта
          fontWeight="bold"
          color="text.primary"
          sx={{
            fontSize: { xs: "1rem", sm: "1.25rem" },
            whiteSpace: "nowrap", // Не переносить текст
            overflow: "hidden", // Скрыть переполнение
            textOverflow: "ellipsis", // Показать многоточие
            maxWidth: { xs: "120px", sm: "none" }, // Ограничение ширины
          }}
        >
          RealtorCRM
        </Typography>
      </Link>
      <Box
        sx={{
          display: { xs: "none", sm: "flex" }, // Скрыто на мобильных
          gap: { sm: 1, md: 1.5 }, // Адаптивные зазоры
          alignItems: "center",
        }}
      >
        {navigationItems
          .filter((item) => item.show)
          .map((item) => (
            <Button
              key={item.path} // Ключ для React (уникальный идентификатор)
              component={Link} // Используем Link вместо обычной кнопки
              to={item.path} // URL для навигации
              variant={isActivePage(item.path) ? "contained" : "outlined"}
              size={isMobile ? "small" : "medium"} // Адаптивный размер кнопки
              sx={{
                // Базовые стили кнопки: minWidth: "auto" - занимает только необходимое место
                minWidth: "auto",
                px: { sm: 1.5, md: 2 }, // Горизонтальные отступы
                borderRadius: "12px", // Закругленные углы
                py: { sm: 0.75, md: 1 }, // Вертикальные отступы

                // Активные/неактивные состояния: цвета и стили меняются в зависимости от активности страницы
                backgroundColor: isActivePage(item.path)
                  ? "primary.main" // Активная: основной цвет темы
                  : "transparent", // Неактивная: прозрачная

                color: isActivePage(item.path)
                  ? "primary.contrastText" // Активная: белый текст
                  : "text.primary", // Неактивная: основной цвет текста

                borderColor: isActivePage(item.path)
                  ? "primary.main" // Активная: граница основного цвета
                  : "divider", // Неактивная: цвет разделителя

                fontWeight: isActivePage(item.path) ? 600 : 400, // Жирность шрифта
                textTransform: "none", // Не преобразовывать в uppercase

                // Hover эффекты: анимации и изменения стилей при наведении
                "&:hover": {
                  backgroundColor: isActivePage(item.path)
                    ? "primary.dark" // Активная при hover: темнее
                    : "action.hover", // Неактивная при hover: цвет hover из темы

                  borderColor: isActivePage(item.path)
                    ? "primary.dark" // Граница темнее при hover
                    : "primary.main", // Граница основного цвета

                  transform: "translateY(-1px)", // Легкий подъем кнопки
                  boxShadow: isActivePage(item.path)
                    ? "0 4px 12px rgba(25, 118, 210, 0.4)" // Активная: тень темы
                    : "0 2px 8px rgba(0, 0, 0, 0.1)", // Неактивная: серая тень
                },

                transition: "all 0.2s ease-in-out", // Плавные переходы
              }}
              startIcon={item.icon} // Иконка слева от текста
              onMouseEnter={preloadOnHover(
                () =>
                  import(
                    `../pages/${
                      item.path === "/"
                        ? "ClientsPage"
                        : item.path.slice(1).charAt(0).toUpperCase() +
                          item.path.slice(2)
                    }Page.tsx`
                  ),
                `${item.path}Page`
              )}
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", md: "inline" } }} // Адаптивность
              >
                {item.label}
              </Box>
            </Button>
          ))}
      </Box>
      {isMobile && (
        <Box sx={{ display: "flex", gap: 1 }}>
          {navigationItems
            .filter((item) => item.show && item.path !== "/clients")
            .map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                variant={isActivePage(item.path) ? "contained" : "outlined"}
                size="small" // Меньший размер для мобильных
                sx={{
                  minWidth: "auto",
                  px: 1.5, // Фиксированные отступы (не адаптивные)
                  borderRadius: "12px",
                  minHeight: 40, // Минимальная высота для touch-friendly интерфейса

                  // Стили активных/неактивных состояний: та же логика что и в десктопной версии
                  backgroundColor: isActivePage(item.path)
                    ? "primary.main"
                    : "transparent",

                  color: isActivePage(item.path)
                    ? "primary.contrastText"
                    : "text.primary",

                  borderColor: isActivePage(item.path)
                    ? "primary.main"
                    : "divider",

                  // Упрощенные hover эффекты: без transform для избежания конфликтов с touch событиями
                  "&:hover": {
                    backgroundColor: isActivePage(item.path)
                      ? "primary.dark"
                      : "action.hover",

                    borderColor: isActivePage(item.path)
                      ? "primary.dark"
                      : "primary.main",
                  },
                }}
                onMouseEnter={preloadOnHover(
                  () =>
                    import(
                      `../pages/${
                        item.path === "/calendar"
                          ? "CalendarPage"
                          : "ProfilePage"
                      }.tsx`
                    ),
                  `${item.path}Page`
                )}
              >
                {item.icon}
              </Button>
            ))}
        </Box>
      )}
      {isMobile && (
        <Box
          sx={{
            position: "absolute", // Относительно ближайшего позиционированного родителя
            bottom: 0, // В самом низу Header
            left: 0, // На всю ширину
            right: 0, // На всю ширину
            height: 2, // Тонкая полоска
            backgroundColor: "primary.main", // Основной цвет темы
            borderRadius: "1px 1px 0 0", // Закругленные верхние углы
          }}
        />
      )}
    </Box>
  );
}
