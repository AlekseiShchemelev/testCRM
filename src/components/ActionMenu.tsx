// src/components/ActionMenu.tsx
import { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  MoreVert,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  LocationOn,
  Directions,
} from "@mui/icons-material";

interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onMarkCompleted: () => void;
  onMarkCancelled: () => void;
  onShowOnMap: () => void;
  onShowRoute: () => void;
  compact?: boolean;
}

export default function ActionMenu({
  onEdit,
  onDelete,
  onMarkCompleted,
  onMarkCancelled,
  onShowOnMap,
  onShowRoute,
  compact = true,
}: ActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size={compact ? "small" : "medium"}
        sx={{
          color: "text.secondary",
          "&:hover": {
            color: "primary.main",
            backgroundColor: "action.hover",
          },
        }}
      >
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            minWidth: 180,
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onEdit();
            handleClose();
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Изменить данные</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onShowOnMap();
            handleClose();
          }}
        >
          <ListItemIcon>
            <LocationOn fontSize="small" />
          </ListItemIcon>
          <ListItemText>Показать на карте</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onShowRoute();
            handleClose();
          }}
        >
          <ListItemIcon>
            <Directions fontSize="small" />
          </ListItemIcon>
          <ListItemText>Проложить маршрут</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onMarkCompleted();
            handleClose();
          }}
          sx={{ color: "success.main" }}
        >
          <ListItemIcon>
            <CheckCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Встреча состоялась</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onMarkCancelled();
            handleClose();
          }}
          sx={{ color: "warning.main" }}
        >
          <ListItemIcon>
            <Cancel fontSize="small" />
          </ListItemIcon>
          <ListItemText>Встреча отменена</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete();
            handleClose();
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Удалить</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
