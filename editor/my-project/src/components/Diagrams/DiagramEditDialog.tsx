import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { diagramsAPI } from "../../services/api";
import { type Diagram } from "../../types";
import { toast } from "react-toastify";

interface DiagramEditDialogProps {
  open: boolean;
  onClose: () => void;
  diagram: Diagram | null;
  onDiagramUpdated: (diagram: Diagram) => void;
}

interface DiagramUpdateData {
  name: string;
  description: string;
  diagram_type: 'class' | 'sequence' | 'usecase' | 'activity';
}

const DiagramEditDialog: React.FC<DiagramEditDialogProps> = ({
  open,
  onClose,
  diagram,
  onDiagramUpdated,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<DiagramUpdateData>({
    name: "",
    description: "",
    diagram_type: "class",
  });

  useEffect(() => {
    if (diagram && open) {
      setFormData({
        name: diagram.name,
        description: diagram.description || "",
        diagram_type: diagram.diagram_type,
      });
      setErrors({});
    }
  }, [diagram, open]);

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    } else if (formData.name.length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    } else if (formData.name.length > 100) {
      newErrors.name = "El nombre no puede exceder los 100 caracteres";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "La descripción no puede exceder los 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!diagram || !validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("Updating diagram with data:", formData);
      const response = await diagramsAPI.update(diagram.id, formData);
      console.log("Diagram updated:", response);

      onDiagramUpdated(response);
      handleClose();
      toast.success("Diagrama actualizado exitosamente");
    } catch (error: any) {
      console.error("Error updating diagram:", error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === "object") {
          const fieldErrors: { [key: string]: string } = {};
          Object.keys(errorData).forEach((key) => {
            if (Array.isArray(errorData[key])) {
              fieldErrors[key] = errorData[key][0];
            } else {
              fieldErrors[key] = errorData[key];
            }
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: "Error al actualizar el diagrama" });
        }
      } else {
        setErrors({ general: "Error de conexión. Inténtalo de nuevo." });
      }
      toast.error("Error al actualizar el diagrama");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof DiagramUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (!diagram) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          Editar Diagrama
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Modifica los detalles de tu diagrama UML
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.general}
            </Alert>
          )}

          <TextField
            label="Nombre del Diagrama"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            error={!!errors.name}
            helperText={errors.name || "Ingresa un nombre descriptivo para tu diagrama"}
            required
            fullWidth
            disabled={loading}
            autoFocus
          />

          <TextField
            label="Descripción"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            error={!!errors.description}
            helperText={errors.description || "Describe brevemente el propósito del diagrama (opcional)"}
            multiline
            rows={3}
            fullWidth
            disabled={loading}
          />

          <FormControl fullWidth disabled={loading}>
            <InputLabel id="diagram-type-label">Tipo de Diagrama</InputLabel>
            <Select
              labelId="diagram-type-label"
              value={formData.diagram_type}
              label="Tipo de Diagrama"
              onChange={(e) => handleInputChange("diagram_type", e.target.value)}
            >
              <MenuItem value="class">Diagrama de Clases</MenuItem>
              <MenuItem value="sequence">Diagrama de Secuencia</MenuItem>
              <MenuItem value="usecase">Diagrama de Casos de Uso</MenuItem>
              <MenuItem value="activity">Diagrama de Actividades</MenuItem>
            </Select>
          </FormControl>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: "grey.50",
              border: 1,
              borderColor: "grey.200",
            }}
          >
            <Typography variant="caption" color="text.disabled" gutterBottom>
              Información del diagrama
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Creado: {new Date(diagram.created_at).toLocaleDateString()} • 
              Modificado: {new Date(diagram.updated_at).toLocaleDateString()}
            </Typography>
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
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiagramEditDialog;