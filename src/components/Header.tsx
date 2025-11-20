// src/components/Header.tsx
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  CalendarMonth as CalendarMonthIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { usePreloadComponents } from "../hooks/usePreloadComponents";

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Предзагрузка компонентов при наведении
  const { preloadOnHover } = usePreloadComponents();

  // Функция для определения активной страницы
  const isActivePage = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Навигационные элементы
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
      show: true,
    },
    {
      path: "/profile",
      label: "Профиль",
      icon: <PersonIcon fontSize="small" />,
      show: true,
    },
  ];

  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: { xs: 1, sm: 1.5, md: 2 },
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 6, sm: 8 },
          textDecoration: "none",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            borderRadius: { xs: "6px", sm: "8px" },
            backgroundColor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: { xs: "12px", sm: "14px" },
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
            transition: "transform 0.2s ease-in-out",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
        >
          R
        </Box>
        <Typography
          variant={isMobile ? "body1" : "h6"}
          fontWeight="bold"
          color="text.primary"
          sx={{
            fontSize: { xs: "1rem", sm: "1.25rem" },
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: { xs: "120px", sm: "none" },
          }}
        >
          RealtorCRM
        </Typography>
      </Link>

      {/* Навигация для десктопа и планшетов */}
      <Box
        sx={{
          display: { xs: "none", sm: "flex" },
          gap: { sm: 1, md: 1.5 },
          alignItems: "center",
        }}
      >
        {navigationItems
          .filter((item) => item.show)
          .map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              variant={isActivePage(item.path) ? "contained" : "outlined"}
              size={isMobile ? "small" : "medium"}
              sx={{
                minWidth: "auto",
                px: { sm: 1.5, md: 2 },
                borderRadius: "12px",
                py: { sm: 0.75, md: 1 },
                backgroundColor: isActivePage(item.path)
                  ? "primary.main"
                  : "transparent",
                color: isActivePage(item.path)
                  ? "primary.contrastText"
                  : "text.primary",
                borderColor: isActivePage(item.path)
                  ? "primary.main"
                  : "divider",
                fontWeight: isActivePage(item.path) ? 600 : 400,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: isActivePage(item.path)
                    ? "primary.dark"
                    : "action.hover",
                  borderColor: isActivePage(item.path)
                    ? "primary.dark"
                    : "primary.main",
                  transform: "translateY(-1px)",
                  boxShadow: isActivePage(item.path)
                    ? "0 4px 12px rgba(25, 118, 210, 0.4)"
                    : "0 2px 8px rgba(0, 0, 0, 0.1)",
                },
                transition: "all 0.2s ease-in-out",
              }}
              startIcon={item.icon}
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
                sx={{ display: { xs: "none", md: "inline" } }}
              >
                {item.label}
              </Box>
            </Button>
          ))}
      </Box>

      {/* Мобильное меню */}
      {isMobile && (
        <Box sx={{ display: "flex", gap: 1 }}>
          {navigationItems
            .filter((item) => item.show && item.path !== "/clients") // Исключаем клиентов из мобильного меню
            .map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                variant={isActivePage(item.path) ? "contained" : "outlined"}
                size="small"
                sx={{
                  minWidth: "auto",
                  px: 1.5,
                  borderRadius: "12px",
                  minHeight: 40,
                  backgroundColor: isActivePage(item.path)
                    ? "primary.main"
                    : "transparent",
                  color: isActivePage(item.path)
                    ? "primary.contrastText"
                    : "text.primary",
                  borderColor: isActivePage(item.path)
                    ? "primary.main"
                    : "divider",
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

      {/* Индикатор активной страницы для мобильных */}
      {isMobile && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: "primary.main",
            borderRadius: "1px 1px 0 0",
          }}
        />
      )}
    </Box>
  );
}
