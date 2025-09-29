import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Diagram } from '../types';
import MainLayout from '../components/Layout/MainLayout';
import { diagramsAPI } from '../services/api';

const ProjectDiagrams: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiagrams = async () => {
      setLoading(true);
      try {
        const allDiagrams = await diagramsAPI.list();
        // Filtrar diagramas por el projectId actual
        const filtered = (allDiagrams.results || allDiagrams).filter((d: any) => d.project === projectId);
        setDiagrams(filtered);
      } catch (error) {
        setDiagrams([]);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchDiagrams();
  }, [projectId]);

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" gutterBottom>Mis Diagramas</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress />
          </Box>
        ) : diagrams.length === 0 ? (
          <Typography color="text.secondary">No hay diagramas en este proyecto.</Typography>
        ) : (
          <Grid container spacing={3}>
            {diagrams.map((diagram) => (
              <Grid item xs={12} sm={6} md={4} key={diagram.id}>
                <Card
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/editor/${diagram.id}`)}
                >
                  <CardContent>
                    <Typography variant="h6">{diagram.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {diagram.description || 'Sin descripción'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </MainLayout>
  );
};

export default ProjectDiagrams;
