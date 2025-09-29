import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  Chip,
  Avatar,
  Fab,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Share,
  Star,
  StarBorder,
  FolderOpen,
  People,
  AccountTree,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
// import {api} from '../services/api';
import { type Project } from '../types';
import MainLayout from '../components/Layout/MainLayout';
import ProjectCreateDialog from '../components/Projects/ProjectCreateDialog';
import ProjectDeleteDialog from '../components/Projects/ProjectDeleteDialog';

type SortOption = 'name' | 'updated_at' | 'created_at' | 'diagrams_count';
type FilterOption = 'all' | 'favorites' | 'owned' | 'collaborated';

const   Projects: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchProjects();
  }, [token]);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchTerm, sortBy, filterBy]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log('Fetching projects with token:', token);
      const response = await api.get('/projects/');
      console.log('Projects response structure:', response.data);
      
      // Manejar diferentes estructuras de respuesta
      let projectsData = [];
      if (Array.isArray(response.data)) {
        // Si es un array directo
        projectsData = response.data;
      } else if (response.data.results) {
        // Si tiene estructura paginada
        projectsData = response.data.results;
      } else if (response.data.data) {
        // Si tiene estructura con 'data'
        projectsData = response.data.data;
      }
      
      console.log('Projects fetched:', projectsData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProjects = () => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterBy) {
      // case 'favorites':
      //   filtered = filtered.filter(project => project.is_favorite);
      //   break;
      case 'owned':
        // Assuming we have current user info to compare
        filtered = filtered.filter(project => project.owner.id === currentUser.id);
        break;
      case 'collaborated':
        // filtered = filtered.filter(project => project.owner.id !== currentUser.id);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'diagrams_count':
          return b.diagrams_count - a.diagrams_count;
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    setFilteredProjects(filtered);
  };

  const handleToggleFavorite = async (project: Project) => {
    try {
      const response = await api.patch(`/projects/${project.id}/`, 
        { is_favorite: !project.is_favorite },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProjects(prev => prev.map(p => 
        p.id === project.id ? { ...p, is_favorite: response.data.is_favorite } : p
      ));
      
      toast.success(response.data.is_favorite ? 'Agregado a favoritos' : 'Removido de favoritos');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Error al actualizar favorito');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.delete(`/projects/${projectId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Proyecto eliminado correctamente');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    toast.success('Proyecto creado correctamente');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleProjectMenuOpen = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    event.stopPropagation();
    setSelectedProject(project);
    setProjectMenuAnchor(event.currentTarget);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchor(null);
    setSelectedProject(null);
  };

  const handleEditProject = () => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}/edit`);
    }
    handleProjectMenuClose();
  };

  const handleShareProject = () => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}/share`);
    }
    handleProjectMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleProjectMenuClose();
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
            Mis Proyectos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona tus proyectos UML y colaboraciones
          </Typography>
        </Box>

        {/* Search and Filter Bar */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar proyectos..."
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
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          >
            Filtrar
          </Button>
          
          {/* aqui se abre el menu de filtros  */}
          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={() => setFilterMenuAnchor(null)}
          >
            <MenuItem 
              selected={filterBy === 'all'} 
              onClick={() => { setFilterBy('all'); setFilterMenuAnchor(null); }}
            >
              Todos los proyectos
            </MenuItem>
            <MenuItem 
              selected={filterBy === 'favorites'} 
              onClick={() => { setFilterBy('favorites'); setFilterMenuAnchor(null); }}
            >
              Favoritos
            </MenuItem>
            <MenuItem 
              selected={filterBy === 'owned'} 
              onClick={() => { setFilterBy('owned'); setFilterMenuAnchor(null); }}
            >
              Mis proyectos
            </MenuItem>
            <MenuItem 
              selected={filterBy === 'collaborated'} 
              onClick={() => { setFilterBy('collaborated'); setFilterMenuAnchor(null); }}
            >
              Colaboraciones
            </MenuItem>
          </Menu>

          <TextField
            select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            label="Ordenar por"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="updated_at">Última actualización</MenuItem>
            <MenuItem value="name">Nombre</MenuItem>
            <MenuItem value="created_at">Fecha de creación</MenuItem>
            <MenuItem value="diagrams_count">Número de diagramas</MenuItem>
          </TextField>
        </Box>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <FolderOpen sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm || filterBy !== 'all' ? 'No se encontraron proyectos' : 'No tienes proyectos aún'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', maxWidth: 400 }}>
              {searchTerm || filterBy !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Crea tu primer proyecto para empezar a diseñar diagramas UML colaborativos'
              }
            </Typography>
            {(!searchTerm && filterBy === 'all') && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                size="large"
              >
                Crear Primer Proyecto
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredProjects.map((project) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
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
                  onClick={() => navigate(`/projects/${project.id}/diagrams`)}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    {/* Header with title and favorite */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', mr: 2, mt: 0.5 }}>
                        <FolderOpen />
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
                          {project.name}
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
                          {project.description || 'Sin descripción'}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(project);
                          }}
                          sx={{ p: 0.5 }}
                        >
                          {project.is_favorite ? (
                            <Star sx={{ color: 'warning.main', fontSize: 20 }} />
                          ) : (
                            <StarBorder sx={{ fontSize: 20 }} />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleProjectMenuOpen(e, project)}
                          sx={{ p: 0.5, ml: 0.5 }}
                        >
                          <MoreVert sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Stats */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        icon={<AccountTree />}
                        label={`${project.diagrams_count} diagrama${project.diagrams_count !== 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<People />}
                        label={`${project.collaborators_count} colaborador${project.collaborators_count !== 1 ? 'es' : ''}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Footer info */}
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="caption" color="text.disabled">
                        Actualizado el {formatDate(project.updated_at)}
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
          aria-label="crear proyecto"
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <Add />
        </Fab>

        {/* Project Menu */}
        <Menu
          anchorEl={projectMenuAnchor}
          open={Boolean(projectMenuAnchor)}
          onClose={handleProjectMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={handleEditProject}>
            <Edit sx={{ mr: 2 }} />
            Editar
          </MenuItem>
          <MenuItem onClick={handleShareProject}>
            <Share sx={{ mr: 2 }} />
            Compartir
          </MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            <Delete sx={{ mr: 2 }} />
            Eliminar
          </MenuItem>
        </Menu>

        {/* Dialogs */}
        <ProjectCreateDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onProjectCreated={handleProjectCreated}
        />

        <ProjectDeleteDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          project={selectedProject}
          onConfirm={handleDeleteProject}
        />
      </Box>
    </MainLayout>
  );
};

export default Projects;
