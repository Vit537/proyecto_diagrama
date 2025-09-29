import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert,
  TextField,
  CircularProgress,
} from "@mui/material";
import { Warning, Delete } from "@mui/icons-material";
import { type Diagram } from "../../types";

interface DiagramDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  diagram: Diagram | null;
  onConfirm: (diagramId: string) => Promise<void>;
}

const DiagramDeleteDialog: React.FC<DiagramDeleteDialogProps> = ({
  open,
  onClose,
  diagram,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleClose = () => {
    if (!loading) {
      setConfirmText("");
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!diagram || loading) return;

    setLoading(true);
    try {
      await onConfirm(diagram.id);
      handleClose();
    } catch (error) {
      console.error("Error in delete confirmation:", error);
    } finally {
      setLoading(false);
    }
  };

  const isConfirmDisabled = confirmText !== diagram?.name || loading;

  if (!diagram) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Warning sx={{ color: "error.main", fontSize: 28 }} />
          <Typography variant="h6" component="div">
            Eliminar Diagrama
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>¡Atención!</strong> Esta acción no se puede deshacer.
            </Typography>
          </Alert>

          <Typography variant="body1">
            Estás a punto de eliminar el diagrama:
          </Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: "grey.100",
              border: 1,
              borderColor: "grey.300",
            }}
          >
            <Typography variant="h6" gutterBottom>
              {diagram.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {diagram.description || "Sin descripción"}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
              Tipo: {diagram.diagram_type} • Creado: {new Date(diagram.created_at).toLocaleDateString()}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Se eliminarán permanentemente:
          </Typography>

          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Todos los elementos del diagrama (clases, relaciones, etc.)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Todo el historial de cambios
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Los datos de colaboración asociados
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Para confirmar, escribe <strong>{diagram.name}</strong> en el campo de abajo:
            </Typography>
            <TextField
              fullWidth
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Escribe "${diagram.name}" para confirmar`}
              disabled={loading}
              error={confirmText !== "" && confirmText !== diagram.name}
              helperText={
                confirmText !== "" && confirmText !== diagram.name
                  ? "El nombre no coincide"
                  : ""
              }
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          color="inherit"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
          color="error"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
        >
          {loading ? "Eliminando..." : "Eliminar Diagrama"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiagramDeleteDialog;