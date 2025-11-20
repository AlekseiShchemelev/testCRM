// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import React from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  if (!isAuthChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Сохраняем URL, на который пользователь пытался попасть
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}