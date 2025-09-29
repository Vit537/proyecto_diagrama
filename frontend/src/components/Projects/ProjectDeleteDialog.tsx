import React, { useState } from 'react';
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
} from '@mui/material';
import { Warning, Delete } from '@mui/icons-material';
import { Project } from '../../types';

interface ProjectDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onConfirm: (projectId: string) => Promise<void>;
}

const ProjectDeleteDialog: React.FC<ProjectDeleteDialogProps> = ({
  open,
  onClose,
  project,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!project || loading) return;

    setLoading(true);
    try {
      await onConfirm(project.id);
      handleClose();
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    } finally {
      setLoading(false);
    }
  };

  const isConfirmValid = confirmText === project?.name;

  if (!project) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Warning sx={{ color: 'error.main', fontSize: 28 }} />
          <Typography variant="h6" component="div">
            Eliminar Proyecto
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              ⚠️ Esta acción no se puede deshacer
            </Typography>
            <Typography variant="body2">
              Se eliminarán permanentemente todos los diagramas, comentarios y datos del proyecto.
            </Typography>
          </Alert>

          <Typography variant="body1" gutterBottom>
            Estás a punto de eliminar el proyecto:
          </Typography>
          
          <Box
            sx={{
              p: 2,
              bgcolor: 'grey.100',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.300',
              mb: 3,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {project.name}
            </Typography>
            {project.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {project.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {project.diagrams_count} diagrama{project.diagrams_count !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {project.collaborators_count} colaborador{project.collaborators_count !== 1 ? 'es' : ''}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" gutterBottom>
            Para confirmar, escribe el nombre exacto del proyecto:
          </Typography>
          
          <TextField
            fullWidth
            placeholder={project.name}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={loading}
            error={confirmText.length > 0 && !isConfirmValid}
            helperText={
              confirmText.length > 0 && !isConfirmValid
                ? 'El nombre no coincide'
                : `Escribe "${project.name}" para confirmar`
            }
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Impact warning */}
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Impacto de la eliminación:</strong>
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Se eliminarán todos los diagramas del proyecto</li>
            <li>Se perderán todos los comentarios y anotaciones</li>
            <li>Se removerán todos los colaboradores del proyecto</li>
            <li>No se podrá recuperar ningún dato después de la eliminación</li>
          </ul>
        </Alert>
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
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={loading || !isConfirmValid}
          startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
        >
          {loading ? 'Eliminando...' : 'Eliminar Proyecto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectDeleteDialog;
