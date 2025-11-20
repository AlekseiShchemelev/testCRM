import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'warning' | 'error' | 'info';
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  severity = 'warning',
  loading = false,
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <WarningIcon color="error" sx={{ fontSize: 40 }} />;
      case 'info':
        return <WarningIcon color="info" sx={{ fontSize: 40 }} />;
      default:
        return <WarningIcon color="warning" sx={{ fontSize: 40 }} />;
    }
  };

  const getConfirmButtonVariant = () => {
    return severity === 'error' ? 'contained' : 'contained';
  };

  const getConfirmButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'info':
        return 'primary';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {getIcon()}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{
            fontSize: '1rem',
            lineHeight: 1.5,
            color: 'text.primary',
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant={getConfirmButtonVariant()}
          color={getConfirmButtonColor()}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Обработка...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}