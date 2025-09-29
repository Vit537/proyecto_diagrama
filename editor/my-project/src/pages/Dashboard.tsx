import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Paper,
 
} from '@mui/material';
import {
  Add,
  FolderOpen,
  People,
  AccountTree,
  TrendingUp,
  Schedule,
  Star,
  MoreVert,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// import { api } from '../services/api';
import { type Project } from '../types';
import MainLayout from '../components/Layout/MainLayout';
// ...existing code...
import Grid from '@mui/material/Grid';
// ...existing code...

interface DashboardStats {
  total_projects: number;
  total_diagrams: number;
  total_collaborations: number;
  recent_activity_count: number;
}

interface RecentActivity {
  id: string;
  type: 'project_created' | 'diagram_updated' | 'collaboration_invited';
  title: string;
  subtitle: string;
  timestamp: string;
  project?: Project;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
 const { user } = useAuth();
//  const { user, token } = useAuth();  revisar

  // console.log('Auth token:', token);
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_projects: 0,
    total_diagrams: 0,
    total_collaborations: 0,
    recent_activity_count: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // useEffect(() => {
  //   fetchDashboardData();
  // }, [token]);

  // const fetchDashboardData = async () => {
  //   setLoading(true);
  //   try {
  //     // Fetch dashboard stats
  //     const statsResponse = await api.get('/projects/stats/', {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     setStats(statsResponse.data);

  //     // Fetch recent projects
  //     const projectsResponse = await api.get('/projects/?ordering=-updated_at&limit=5', {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     setRecentProjects(projectsResponse.data.results || []);

  //     // Mock recent activity (in real app would come from API)
  //     setRecentActivity([
  //       {
  //         id: '1',
  //         type: 'project_created',
  //         title: 'Nuevo proyecto creado',
  //         subtitle: 'Sistema de Gestión de Usuarios',
  //         timestamp: '2025-01-09T12:00:00Z',
  //       },
  //       {
  //         id: '2',
  //         type: 'diagram_updated',
  //         title: 'Diagrama actualizado',
  //         subtitle: 'Diagrama de clases - API REST',
  //         timestamp: '2025-01-09T10:30:00Z',
  //       },
  //       {
  //         id: '3',
  //         type: 'collaboration_invited',
  //         title: 'Nuevo colaborador',
  //         subtitle: 'Juan Pérez se unió al proyecto',
  //         timestamp: '2025-01-09T09:15:00Z',
  //       },
  //     ]);
  //   } catch (error) {
  //     console.error('Error fetching dashboard data:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleCreateProject = () => {
  //   navigate('/projects/new');
  // };

  // const handleViewAllProjects = () => {
  //   navigate('/projects');
  // };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)}h`;
    return `hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return <FolderOpen />;
      case 'diagram_updated':
        return <AccountTree />;
      case 'collaboration_invited':
        return <People />;
      default:
        return <Schedule />;
    }
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
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {/* ¡Bienvenido, {user?.first_name || 'Usuario'}! 👋 */}
            ¡Bienvenido!  👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Aquí tienes un resumen de tus proyectos y actividad reciente.
          </Typography>
        </Box>

        {/* Stats Cards */}
        {/* <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <FolderOpen />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" component="div">
                      {stats.total_projects}
                    </Typography>
                    <Typography color="text.secondary">
                      Proyectos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <AccountTree />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" component="div">
                      {stats.total_diagrams}
                    </Typography>
                    <Typography color="text.secondary">
                      Diagramas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" component="div">
                      {stats.total_collaborations}
                    </Typography>
                    <Typography color="text.secondary">
                      Colaboraciones
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" component="div">
                      {stats.recent_activity_count}
                    </Typography>
                    <Typography color="text.secondary">
                      Actividades
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid> */}

        {/* Recent Projects and Activity */}
        {/* <Grid container spacing={3}> */}
          {/* Recent Projects */}
          {/* <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Proyectos Recientes
                </Typography>
                <Box> */}
                  {/* <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateProject}
                    sx={{ mr: 1 }}
                  >
                    Nuevo Proyecto
                  </Button>
                  <Button onClick={handleViewAllProjects}>
                    Ver Todos
                  </Button> */}
                {/* </Box>
              </Box>

              {recentProjects.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 4,
                    color: 'text.secondary',
                  }}
                >
                  <FolderOpen sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No tienes proyectos aún
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Crea tu primer proyecto para empezar a diseñar diagramas UML
                  </Typography> */}
                  {/* <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateProject}
                  >
                    Crear Primer Proyecto
                  </Button> */}
                {/* </Box>
              ) : (
                <List>
                  {recentProjects.map((project, index) => (
                    <React.Fragment key={project.id}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      > */}
                        {/* <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <FolderOpen />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                                {project.name}
                              </Typography>
                              {project.is_favorite && (
                                <Star sx={{ color: 'warning.main', fontSize: 16 }} />
                              )}
                            </Box>
                          } */}
                          {/* secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {project.description || 'Sin descripción'}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                <Chip
                                  label={`${project.diagrams_count} diagrama${project.diagrams_count !== 1 ? 's' : ''}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                                <Chip
                                  label={`${project.collaborators_count} colaborador${project.collaborators_count !== 1 ? 'es' : ''}`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                                  {formatTimeAgo(project.updated_at)}
                                </Typography>
                              </Box>
                            </Box> */}
                          {/* }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end">
                            <MoreVert />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < recentProjects.length - 1 && <Box sx={{ height: 8 }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper> */}
          {/* </Grid> */}

          {/* Recent Activity */}
          {/* <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actividad Reciente
              </Typography>
              
              {recentActivity.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 4,
                    color: 'text.secondary',
                  }}
                >
                  <Schedule sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body2">
                    No hay actividad reciente
                  </Typography>
                </Box>
              ) : ( */}
                {/* // <List sx={{ py: 0 }}>
                //   {recentActivity.map((activity, index) => ( */}
                {/* //     <React.Fragment key={activity.id}>
                //       <ListItem sx={{ px: 0 }}>
                //         <ListItemAvatar>
                //           <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.600', width: 32, height: 32 }}>
                //             {getActivityIcon(activity.type)}
                //           </Avatar>
                //         </ListItemAvatar>
                //         <ListItemText */}
                {/* //           primary={ 
                //             <Typography variant="body2" sx={{ fontWeight: 600 }}>
                //               {activity.title}
                //             </Typography>
                //           }
                //           secondary={
                //             <Box>
                //               <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                //                 {activity.subtitle}
                //               </Typography>
                //               <Typography variant="caption" color="text.disabled">
                //                 {formatTimeAgo(activity.timestamp)}
                              {/* </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentActivity.length - 1 && <Box sx={{ height: 4 }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid> */}
      </Box>
    </MainLayout>
  );
};

export default Dashboard;
