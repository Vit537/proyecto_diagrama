import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
// import api from '../../services/projectsAPI';
import {projectsAPI} from '../../services/api';
// import api from '../../services/api';
import { Project, ProjectCreate } from '../../types';
import { toast } from 'react-toastify';

interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
}

const ProjectCreateDialog: React.FC<ProjectCreateDialogProps> = ({
  open,
  onClose,
  onProjectCreated,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState<ProjectCreate>({
  // const [formData, setFormData] = useState<ProjectCreate & { is_favorite: boolean }>({
    name: '',
    description: '',
    visibility: 'public',
    // is_favorite: false,
    
  });

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        visibility: 'public',
      });
      setErrors({});
      onClose();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es requerido';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'El nombre no puede tener más de 100 caracteres';
    }

    if (formData.description.length > 500) {
      newErrors.description = 'La descripción no puede tener más de 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload: ProjectCreate = {
      // const payload: ProjectCreate & { is_favorite?: boolean } = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
      };
    
      // if (formData.is_favorite) {
      //   payload.is_favorite = true;
      // }

      // const response = await api.post('/projects/', payload, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      // const response = await api.post('/projects/', payload, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });

      const response = await projectsAPI.createProject(payload);
      onProjectCreated(response);
      handleClose();
    } catch (error: any) {
      console.error('Error creating project:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Error al crear el proyecto. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
          Crear Nuevo Proyecto
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Crea un proyecto para organizar tus diagramas UML y colaborar con otros
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Project Name */}
          <TextField
            label="Nombre del proyecto"
            placeholder="Ej: Sistema de Gestión de Usuarios"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={Boolean(errors.name)}
            helperText={errors.name || 'Nombre descriptivo para tu proyecto'}
            fullWidth
            required
            autoFocus
            disabled={loading}
            inputProps={{ maxLength: 100 }}
          />

          {/* Project Description */}
          <TextField
            label="Descripción"
            placeholder="Describe el propósito y alcance de tu proyecto..."
            value={formData.description}
            onChange={handleInputChange('description')}
            error={Boolean(errors.description)}
            helperText={
              errors.description || 
              `${formData.description.length}/500 caracteres`
            }
            multiline
            rows={3}
            fullWidth
            disabled={loading}
            inputProps={{ maxLength: 500 }}
          />

          {/* Favorite Option */}
          {/* <FormControlLabel
            control={
              <Switch
                checked={formData.is_favorite}
                onChange={handleInputChange('is_favorite')}
                disabled={loading}
                color="warning"
              />
            }
            label={
              <Box>
                <Typography variant="body2">
                  Marcar como favorito
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Los proyectos favoritos aparecen al principio de tu lista
                </Typography>
              </Box>
            }
          /> */}

          {/* Info Alert */}
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              💡 <strong>Consejo:</strong> Puedes agregar colaboradores y crear diagramas después de crear el proyecto.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
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
          disabled={loading || !formData.name.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Creando...' : 'Crear Proyecto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectCreateDialog;
