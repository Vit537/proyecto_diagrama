import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Share,
  MoreVert,
  AccountTree,
  FilterList,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { type Diagram } from '../types';
import MainLayout from '../components/Layout/MainLayout';
import { diagramsAPI } from '../services/api';
import DiagramCreateDialog from '../components/Diagrams/DiagramCreateDialog';
import DiagramEditDialog from '../components/Diagrams/DiagramEditDialog';
import DiagramDeleteDialog from '../components/Diagrams/DiagramDeleteDialog';

const ProjectDiagrams: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [filteredDiagrams, setFilteredDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);
  
  // Menu state
  const [diagramMenuAnchor, setDiagramMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (projectId) fetchDiagrams();
  }, [projectId]);

  useEffect(() => {
    filterDiagrams();
  }, [diagrams, searchTerm]);

  const fetchDiagrams = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const allDiagrams = await diagramsAPI.list();
      // Filtrar diagramas por el projectId actual
      const filtered = (allDiagrams.results || allDiagrams).filter((d: any) => d.project === projectId);
      setDiagrams(filtered);
    } catch (error) {
      console.error('Error fetching diagrams:', error);
      setDiagrams([]);
      toast.error('Error al cargar los diagramas');
    } finally {
      setLoading(false);
    }
  };

  const filterDiagrams = () => {
    let filtered = [...diagrams];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(diagram =>
        diagram.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (diagram.description && diagram.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredDiagrams(filtered);
  };

  const handleDiagramCreated = (newDiagram: Diagram) => {
    setDiagrams(prev => [newDiagram, ...prev]);
    toast.success('Diagrama creado correctamente');
  };

  const handleDiagramUpdated = (updatedDiagram: Diagram) => {
    setDiagrams(prev => prev.map(d => 
      d.id === updatedDiagram.id ? updatedDiagram : d
    ));
    toast.success('Diagrama actualizado correctamente');
  };

  const handleDeleteDiagram = async (diagramId: string) => {
    try {
      await diagramsAPI.delete(diagramId);
      setDiagrams(prev => prev.filter(d => d.id !== diagramId));
      toast.success('Diagrama eliminado correctamente');
    } catch (error) {
      console.error('Error deleting diagram:', error);
      toast.error('Error al eliminar el diagrama');
    }
  };

  const handleDiagramMenuOpen = (event: React.MouseEvent<HTMLElement>, diagram: Diagram) => {
    event.stopPropagation();
    setSelectedDiagram(diagram);
    setDiagramMenuAnchor(event.currentTarget);
  };

  const handleDiagramMenuClose = () => {
    setDiagramMenuAnchor(null);
    setSelectedDiagram(null);
  };

  const handleEditDiagram = () => {
    setEditDialogOpen(true);
    handleDiagramMenuClose();
  };

  const handleShareDiagram = () => {
    if (selectedDiagram) {
      // Implementar lógica de compartir
      toast.info('Funcionalidad de compartir en desarrollo');
    }
    handleDiagramMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleDiagramMenuClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDiagramTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'class': 'Clases',
      'sequence': 'Secuencia',
      'usecase': 'Casos de Uso',
      'activity': 'Actividades'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 400,
          }}
        >
          <CircularProgress size={48} />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Diagramas del Proyecto
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona los diagramas UML de tu proyecto
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar diagramas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 300 }}
          />
        </Box>

        {/* Diagrams Grid */}
        {filteredDiagrams.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <AccountTree sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm ? 'No se encontraron diagramas' : 'No tienes diagramas aún'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', maxWidth: 400 }}>
              {searchTerm 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea tu primer diagrama UML para empezar a diseñar'
              }
            </Typography>
            {!searchTerm && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                size="large"
              >
                Crear Primer Diagrama
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredDiagrams.map((diagram) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={diagram.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/editor/${diagram.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    {/* Header with title and menu */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', mr: 2, mt: 0.5 }}>
                        <AccountTree />
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {diagram.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '2.5em',
                          }}
                        >
                          {diagram.description || 'Sin descripción'}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDiagramMenuOpen(e, diagram)}
                        sx={{ p: 0.5 }}
                      >
                        <MoreVert sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>

                    {/* Diagram Type */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={getDiagramTypeLabel(diagram.diagram_type)}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Box>

                    {/* Footer info */}
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="caption" color="text.disabled">
                        Actualizado el {formatDate(diagram.updated_at)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="crear diagrama"
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <Add />
        </Fab>

        {/* Diagram Menu */}
        <Menu
          anchorEl={diagramMenuAnchor}
          open={Boolean(diagramMenuAnchor)}
          onClose={handleDiagramMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleEditDiagram}>
            <Edit sx={{ mr: 2 }} />
            Editar
          </MenuItem>
          <MenuItem onClick={handleShareDiagram}>
            <Share sx={{ mr: 2 }} />
            Compartir
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 2 }} />
            Eliminar
          </MenuItem>
        </Menu>

        {/* Dialogs */}
        {projectId && (
          <>
            <DiagramCreateDialog
              open={createDialogOpen}
              onClose={() => setCreateDialogOpen(false)}
              projectId={projectId}
              onDiagramCreated={handleDiagramCreated}
            />

            <DiagramEditDialog
              open={editDialogOpen}
              onClose={() => setEditDialogOpen(false)}
              diagram={selectedDiagram}
              onDiagramUpdated={handleDiagramUpdated}
            />

            <DiagramDeleteDialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
              diagram={selectedDiagram}
              onConfirm={handleDeleteDiagram}
            />
          </>
        )}
      </Box>
    </MainLayout>
  );
};

export default ProjectDiagrams;
