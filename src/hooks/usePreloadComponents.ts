import { useCallback, useRef } from 'react';

// Предзагрузка компонентов для улучшения производительности
export const usePreloadComponents = () => {
  const preloadedModules = useRef<Set<string>>(new Set());

  const preloadComponent = useCallback((importFunc: () => Promise<any>, moduleName: string) => {
    if (!preloadedModules.current.has(moduleName)) {
      preloadedModules.current.add(moduleName);
      importFunc().catch(() => {
        // Ошибки предзагрузки не критичны, просто удаляем из кэша
        preloadedModules.current.delete(moduleName);
      });
    }
  }, []);

  const preloadOnHover = useCallback((importFunc: () => Promise<any>, moduleName: string) => {
    return () => preloadComponent(importFunc, moduleName);
  }, [preloadComponent]);

  return {
    preloadComponent,
    preloadOnHover,
    preloadedModules: preloadedModules.current
  };
};

// Предзагрузка основных страниц
export const preloadMainPages = (preloadComponent: (importFunc: () => Promise<any>, name: string) => void) => {
  // Предзагружаем все основные страницы после загрузки приложения
  setTimeout(() => {
    preloadComponent(() => import("../pages/ClientsPage"), "ClientsPage");
    preloadComponent(() => import("../pages/HistoryPage"), "HistoryPage");
    preloadComponent(() => import("../pages/CalendarPage"), "CalendarPage");
    preloadComponent(() => import("../pages/ProfilePage"), "ProfilePage");
  }, 2000); // Предзагружаем через 2 секунды после загрузки
};