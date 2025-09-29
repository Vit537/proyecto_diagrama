import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  Tooltip,
} from '@mui/material';
import {
  Close,
  ExpandMore,
  Add,
  Delete,
  Edit,
  Palette,
} from '@mui/icons-material';
import { DiagramElement, ClassAttribute, ClassMethod, MethodParameter } from '../../types';

interface PropertiesPanelProps {
  selectedElement: DiagramElement | null;
  onElementUpdate: (updatedElement: DiagramElement) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onElementUpdate,
  onClose,
}) => {
  const [localElement, setLocalElement] = useState<DiagramElement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingType, setEditingType] = useState<'attribute' | 'method'>('attribute');

  useEffect(() => {
    setLocalElement(selectedElement ? { ...selectedElement } : null);
  }, [selectedElement]);

  const handlePropertyChange = (property: string, value: any) => {
    if (!localElement) return;
    
    const updatedElement = {
      ...localElement,
      [property]: value,
    };
    
    setLocalElement(updatedElement);
    onElementUpdate(updatedElement);
  };

  const handleDataChange = (dataProperty: string, value: any) => {
    if (!localElement) return;
    
    const updatedElement = {
      ...localElement,
      data: {
        ...localElement.data,
        [dataProperty]: value,
      },
    };
    
    setLocalElement(updatedElement);
    onElementUpdate(updatedElement);
  };

  const handleStyleChange = (styleProperty: string, value: any) => {
    if (!localElement) return;
    
    const updatedElement = {
      ...localElement,
      style: {
        ...localElement.style,
        [styleProperty]: value,
      },
    };
    
    setLocalElement(updatedElement);
    onElementUpdate(updatedElement);
  };

  const handleAddAttribute = () => {
    setEditingItem({
      id: `attr_${Date.now()}`,
      name: 'nuevoAtributo',
      type: 'String',
      visibility: 'private',
      is_static: false,
    });
    setEditingType('attribute');
    setEditDialogOpen(true);
  };

  const handleAddMethod = () => {
    setEditingItem({
      id: `method_${Date.now()}`,
      name: 'nuevoMetodo',
      returnType: 'void',
      parameters: [],
      visibility: 'public',
      is_static: false,
      is_abstract: false,
    });
    setEditingType('method');
    setEditDialogOpen(true);
  };

  const handleEditAttribute = (attr: ClassAttribute) => {
    setEditingItem({ ...attr });
    setEditingType('attribute');
    setEditDialogOpen(true);
  };

  const handleEditMethod = (method: ClassMethod) => {
    setEditingItem({ ...method });
    setEditingType('method');
    setEditDialogOpen(true);
  };

  const handleSaveItem = () => {
    if (!localElement || !editingItem) return;

    if (editingType === 'attribute') {
      const attributes = localElement.data?.attributes || [];
  const existingIndex = attributes.findIndex((attr: any) => attr.id === editingItem.id);
      
      let newAttributes;
      if (existingIndex >= 0) {
        newAttributes = [...attributes];
        newAttributes[existingIndex] = editingItem;
      } else {
        newAttributes = [...attributes, editingItem];
      }
      
      handleDataChange('attributes', newAttributes);
    } else {
      const methods = localElement.data?.methods || [];
  const existingIndex = methods.findIndex((method: any) => method.id === editingItem.id);
      
      let newMethods;
      if (existingIndex >= 0) {
        newMethods = [...methods];
        newMethods[existingIndex] = editingItem;
      } else {
        newMethods = [...methods, editingItem];
      }
      
      handleDataChange('methods', newMethods);
    }

    setEditDialogOpen(false);
    setEditingItem(null);
  };

  const handleDeleteAttribute = (attrId: string) => {
    if (!localElement) return;
  const attributes = localElement.data?.attributes?.filter((attr: any) => attr.id !== attrId) || [];
    handleDataChange('attributes', attributes);
  };

  const handleDeleteMethod = (methodId: string) => {
    if (!localElement) return;
  const methods = localElement.data?.methods?.filter((method: any) => method.id !== methodId) || [];
    handleDataChange('methods', methods);
  };

  if (!localElement) {
    return (
      <Paper
        elevation={2}
        sx={{
          width: 320,
          height: '100%',
          borderRadius: 0,
          borderLeft: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="h6" gutterBottom>
            Propiedades
          </Typography>
          <Typography variant="body2">
            Selecciona un elemento para editar sus propiedades
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        width: 320,
        height: '100%',
        borderRadius: 0,
        borderLeft: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      {/* <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">Propiedades</Typography>
        <Box>
          <Tooltip title="Ocultar propiedades">
            <ToggleButton value="hide-props" onClick={onClose} sx={{ mr: 1 }}>
              ▸
            </ToggleButton>
          </Tooltip>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </Box> */}

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Basic Properties */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">General</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Nombre"
                value={localElement.name}
                onChange={(e) => handlePropertyChange('name', e.target.value)}
                size="small"
                fullWidth
              />
              
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={localElement.type}
                  label="Tipo"
                  onChange={(e) => handlePropertyChange('type', e.target.value)}
                >
                  <MenuItem value="class">Clase</MenuItem>
                  <MenuItem value="interface">Interfaz</MenuItem>
                  <MenuItem value="abstract_class">Clase Abstracta</MenuItem>
                  <MenuItem value="enum">Enumeración</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Ancho"
                  type="number"
                  value={localElement.size.width}
                  onChange={(e) => handlePropertyChange('size', {
                    ...localElement.size,
                    width: parseInt(e.target.value),
                  })}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Alto"
                  type="number"
                  value={localElement.size.height}
                  onChange={(e) => handlePropertyChange('size', {
                    ...localElement.size,
                    height: parseInt(e.target.value),
                  })}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* X/Y position fields removed per user request; position is controlled via drag */}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Attributes (for classes and interfaces) */}
        {(localElement.type === 'class' || localElement.type === 'interface' || localElement.type === 'abstract_class') && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                Atributos ({localElement.data?.attributes?.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddAttribute}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  Agregar Atributo
                </Button>
                
                <List dense>
                  {localElement.data?.attributes?.map((attr: ClassAttribute) => (
                    <ListItem key={attr.id} divider>
                      <ListItemText
                        primary={`${attr.name}: ${attr.type}`}
                        secondary={`${attr.visibility}${attr.is_static ? ', static' : ''}`}
                        primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => handleEditAttribute(attr)} size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteAttribute(attr.id)} size="small">
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Methods (for classes and interfaces) */}
        {(localElement.type === 'class' || localElement.type === 'interface' || localElement.type === 'abstract_class') && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">
                Métodos ({localElement.data?.methods?.length || 0})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddMethod}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  Agregar Método
                </Button>
                
                <List dense>
                  {localElement.data?.methods?.map((method: ClassMethod) => (
                    <ListItem key={method.id} divider>
                      <ListItemText
                        primary={`${method.name}(): ${method.return_type}`}
                        secondary={`${method.visibility}${method.is_static ? ', static' : ''}${method.is_abstract ? ', abstract' : ''}`}
                        primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => handleEditMethod(method)} size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteMethod(method.id)} size="small">
                          <Delete fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Relationship properties */}
        {localElement.type === 'relationship' && (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Relación</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Etiqueta"
                  value={localElement.data?.label || ''}
                  onChange={(e) => handleDataChange('label', e.target.value)}
                  size="small"
                  fullWidth
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={localElement.data?.relationshipType || 'association'}
                    label="Tipo"
                    onChange={(e) => handleDataChange('relationshipType', e.target.value)}
                  >
                    <MenuItem value="association">Asociación</MenuItem>
                    <MenuItem value="inheritance">Herencia</MenuItem>
                    <MenuItem value="realization">Realización</MenuItem>
                    <MenuItem value="aggregation">Agregación</MenuItem>
                    <MenuItem value="composition">Composición</MenuItem>
                    <MenuItem value="dependency">Dependencia</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Multiplicidad (inicio)"
                    value={localElement.data?.multiplicityStart || ''}
                    onChange={(e) => handleDataChange('multiplicityStart', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Multiplicidad (fin)"
                    value={localElement.data?.multiplicityEnd || ''}
                    onChange={(e) => handleDataChange('multiplicityEnd', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Style Properties */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Estilo</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Color de fondo"
                type="color"
                value={localElement.style?.fill || '#ffffff'}
                onChange={(e) => handleStyleChange('fill', e.target.value)}
                size="small"
                fullWidth
              />
              
              <TextField
                label="Color de borde"
                type="color"
                value={localElement.style?.stroke || '#333333'}
                onChange={(e) => handleStyleChange('stroke', e.target.value)}
                size="small"
                fullWidth
              />
              
              <TextField
                label="Grosor de borde"
                type="number"
                value={localElement.style?.strokeWidth || 2}
                onChange={(e) => handleStyleChange('strokeWidth', parseInt(e.target.value))}
                size="small"
                fullWidth
              />
              
              <TextField
                label="Tamaño de fuente"
                type="number"
                value={localElement.style?.fontSize || 14}
                onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                size="small"
                fullWidth
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingType === 'attribute' ? 'Editar Atributo' : 'Editar Método'}
        </DialogTitle>
        <DialogContent>
          {editingItem && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Nombre"
                value={editingItem.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                fullWidth
              />
              
              <FormControl fullWidth>
                <InputLabel>Visibilidad</InputLabel>
                <Select
                  value={editingItem.visibility || 'public'}
                  label="Visibilidad"
                  onChange={(e) => setEditingItem({ ...editingItem, visibility: e.target.value })}
                >
                  <MenuItem value="public">Público (+)</MenuItem>
                  <MenuItem value="private">Privado (-)</MenuItem>
                  <MenuItem value="protected">Protegido (#)</MenuItem>
                  <MenuItem value="package">Paquete (~)</MenuItem>
                </Select>
              </FormControl>

              {editingType === 'attribute' ? (
                <TextField
                  label="Tipo"
                  value={editingItem.type || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                  fullWidth
                />
              ) : (
                <TextField
                  label="Tipo de retorno"
                  value={editingItem.returnType || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, returnType: e.target.value })}
                  fullWidth
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveItem} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PropertiesPanel;
