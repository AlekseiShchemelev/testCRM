// src/components/ConfirmDeleteDialog.tsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box
} from '@mui/material';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteDialog({ open, onClose, onConfirm }: ConfirmDeleteDialogProps) {
  const [inputValue, setInputValue] = useState('');

  const isConfirmed = inputValue.trim() === 'УДАЛИТЬ';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>⚠️ Подтверждение удаления</DialogTitle>
      <DialogContent>
        <Typography color="error" gutterBottom>
          Это действие удалит ВСЕ данные: клиентов, историю и фото. Отменить нельзя!
        </Typography>
        <Typography gutterBottom>
          Чтобы подтвердить, введите слово ниже:
        </Typography>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="УДАЛИТЬ"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            error={inputValue !== '' && !isConfirmed}
            helperText={inputValue !== '' && !isConfirmed ? 'Введите точное слово: УДАЛИТЬ' : ''}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={!isConfirmed}
        >
          Удалить всё
        </Button>
      </DialogActions>
    </Dialog>
  );
}