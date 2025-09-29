import React from 'react';
import {
  Box,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  NearMe,
  CropDin,
  AccountBox,
  Schema,
  List,
  Code,
  TrendingFlat,
  CallSplit,
  SubdirectoryArrowRight,
  CompareArrows,
  Timeline,
} from '@mui/icons-material';

interface UMLToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onToggleToolbar?: () => void;
  onToggleProperties?: () => void;
}

interface ToolSection {
  title: string;
  tools: ToolDefinition[];
}

interface ToolDefinition {
  id: string;
  name: string;
  icon: React.ReactElement;
  description: string;
  category: 'select' | 'class' | 'relationship' | 'other';
}

const UMLToolbar: React.FC<UMLToolbarProps> = ({ activeTool, onToolChange, onToggleToolbar, onToggleProperties }) => {
  
  const toolSections: ToolSection[] = [
    {
      title: 'Selección',
      tools: [
        {
          id: 'select',
          name: 'Seleccionar',
          icon: <NearMe />,
          description: 'Seleccionar y mover elementos',
          category: 'select',
        },
      ],
    },
    {
      title: 'Elementos UML',
      tools: [
        {
          id: 'class',
          name: 'Clase',
          icon: <CropDin />,
          description: 'Crear clase UML',
          category: 'class',
        },
        {
          id: 'interface',
          name: 'Interfaz',
          icon: <AccountBox />,
          description: 'Crear interfaz UML',
          category: 'class',
        },
        {
          id: 'abstract_class',
          name: 'Clase Abstracta',
          icon: <Schema />,
          description: 'Crear clase abstracta',
          category: 'class',
        },
        {
          id: 'enum',
          name: 'Enumeración',
          icon: <List />,
          description: 'Crear enumeración',
          category: 'class',
        },
        {
          id: 'package',
          name: 'Paquete',
          icon: <Code />,
          description: 'Crear paquete',
          category: 'other',
        },
      ],
    },
    {
      title: 'Relaciones',
      tools: [
        {
          id: 'association',
          name: 'Asociación',
          icon: <TrendingFlat />,
          description: 'Crear asociación entre clases',
          category: 'relationship',
        },
        {
          id: 'inheritance',
          name: 'Herencia',
          icon: <CallSplit />,
          description: 'Crear relación de herencia',
          category: 'relationship',
        },
        {
          id: 'realization',
          name: 'Realización',
          icon: <SubdirectoryArrowRight />,
          description: 'Crear realización de interfaz',
          category: 'relationship',
        },
        {
          id: 'aggregation',
          name: 'Agregación',
          icon: <CompareArrows />,
          description: 'Crear agregación',
          category: 'relationship',
        },
        {
          id: 'composition',
          name: 'Composición',
          icon: <Timeline />,
          description: 'Crear composición',
          category: 'relationship',
        },
      ],
    },
  ];

  const handleToolChange = (event: React.MouseEvent<HTMLElement>, newTool: string | null) => {
    if (newTool !== null) {
      onToolChange(newTool);
    }
  };

  const getToolColor = (tool: ToolDefinition): "standard" | "primary" | "secondary" => {
    if (activeTool === tool.id) return 'primary';
    
    switch (tool.category) {
      case 'class':
        return 'secondary';
      case 'relationship':
        return 'standard';
      default:
        return 'standard';
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        width: 280,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        borderRadius: 0,
        borderRight: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">Herramientas UML</Typography>
          {/* <Box>
            <Tooltip title="Ocultar barra">
              <ToggleButton value="hide-toolbar" onClick={() => onToggleToolbar && onToggleToolbar()} sx={{ mr: 1 }}>
                •
              </ToggleButton>
            </Tooltip>
            <Tooltip title="Ocultar propiedades">
              <ToggleButton value="hide-props" onClick={() => onToggleProperties && onToggleProperties()}>
                ▸
              </ToggleButton>
            </Tooltip>
          </Box> */}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Selecciona una herramienta para agregar elementos al diagrama
        </Typography>

        {toolSections.map((section, sectionIndex) => (
          <Box key={section.title} sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                mb: 1,
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            >
              {section.title}
            </Typography>

            <ToggleButtonGroup
              orientation="vertical"
              value={activeTool}
              exclusive
              onChange={handleToolChange}
              sx={{
                width: '100%',
                '& .MuiToggleButton-root': {
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  mb: 0.5,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  px: 2,
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                },
              }}
            >
              {section.tools.map((tool) => (
                <Tooltip
                  key={tool.id}
                  title={tool.description}
                  placement="right"
                  arrow
                >
                  <ToggleButton
                    value={tool.id}
                    color={getToolColor(tool)}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: activeTool === tool.id ? 'inherit' : 'text.secondary',
                      }}
                    >
                      {tool.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: activeTool === tool.id ? 600 : 400,
                        fontSize: '0.875rem',
                      }}
                    >
                      {tool.name}
                    </Typography>
                  </ToggleButton>
                </Tooltip>
              ))}
            </ToggleButtonGroup>

            {sectionIndex < toolSections.length - 1 && (
              <Divider sx={{ mt: 2, mb: 2 }} />
            )}
          </Box>
        ))}

        {/* Tool Instructions */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            backgroundColor: 'info.light',
            borderRadius: 2,
            border: 1,
            borderColor: 'info.main',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            💡 Instrucciones:
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            • <strong>Seleccionar:</strong> Clic para seleccionar elementos
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            • <strong>Elementos:</strong> Clic en el canvas para crear
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            • <strong>Relaciones:</strong> Arrastra desde un elemento a otro
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            • <strong>Mover:</strong> Arrastra elementos seleccionados
          </Typography>
        </Box>

        {/* Active Tool Info */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: 'grey.50',
            borderRadius: 2,
            border: 1,
            borderColor: 'grey.300',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Herramienta Activa:
          </Typography>
          {(() => {
            const currentTool = toolSections
              .flatMap(section => section.tools)
              .find(tool => tool.id === activeTool);
            
            return currentTool ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {currentTool.icon}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {currentTool.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentTool.description}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Ninguna herramienta seleccionada
              </Typography>
            );
          })()}
        </Box>
      </Box>
    </Paper>
  );
};

export default UMLToolbar;
