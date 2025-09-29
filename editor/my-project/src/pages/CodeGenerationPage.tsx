import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import CodeGenerationPanel from '../components/CodeGeneration/CodeGenerationPanel';
import { type Diagram } from '../types';
import { diagramsAPI } from '../services/api';

const CodeGenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { diagramId } = useParams<{ diagramId: string }>();
  
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Se espera que la ruta que navega aquí pase el diagrama por location.state.diagram
  const diagramFromState = (location.state as any)?.diagram as Diagram | undefined;

  // Efecto para cargar el diagrama si no viene del state pero tenemos diagramId
  useEffect(() => {
    const loadDiagram = async () => {
      if (diagramFromState) {
        // Si el diagrama viene del state, usarlo directamente
        setDiagram(diagramFromState);
        return;
      }

      if (!diagramId) {
        return; // Sin diagrama del state ni diagramId, mostrar error
      }

      // Cargar diagrama usando el diagramId
      setLoading(true);
      setError(null);
      
      try {
        const loadedDiagram = await diagramsAPI.get(diagramId);
        setDiagram(loadedDiagram);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el diagrama');
      } finally {
        setLoading(false);
      }
    };

    loadDiagram();
  }, [diagramId, diagramFromState]);

  const handleGoBack = () => {
    navigate(-1); // Volver a la página anterior
  };

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Cargando diagrama...</Typography>
      </Box>
    );
  }

  // Mostrar error si hay uno
  if (error) {
    return (
      <Box sx={{ padding: 3, maxWidth: 600, margin: '0 auto', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Error al cargar el diagrama
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Alert>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
          >
            Volver
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/projects')}
          >
            Ir a Proyectos
          </Button>
        </Box>
      </Box>
    );
  }

  // Si no hay diagrama después de intentar cargar
  if (!diagram) {
    return (
      <Box sx={{ padding: 3, maxWidth: 600, margin: '0 auto', mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            No se encontró el diagrama
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Para usar la generación de código, necesitas navegar desde un proyecto 
            que contenga diagramas. El diagrama debe pasarse a través del estado de navegación.
          </Typography>
        </Alert>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
          >
            Volver
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/projects')}
          >
            Ir a Proyectos
          </Button>
        </Box>
      </Box>
    );
  }

  // Si tenemos un diagrama, mostramos el panel de generación de código
  // Lo abrimos inmediatamente como página completa
  return (
    <CodeGenerationPanel
      diagram={diagram}
      open={true}
      onClose={handleGoBack}
    />
  );
};

export default CodeGenerationPage;