import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Toolbar,
  Button,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
  debounce,
} from "@mui/material";
import {
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  FitScreen,
  GridOn,
  Share,
  GetApp,
  Settings,
  PlayArrow,
  Stop,
  People,
  Code,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import MainLayout from "../components/Layout/MainLayout";
import UMLCanvas from "../components/DiagramEditor/UMLCanvas";
import UMLToolbar from "../components/DiagramEditor/UMLToolbar";
import PropertiesPanel from "../components/DiagramEditor/PropertiesPanel";
import CollaboratorsPanel from "../components/DiagramEditor/CollaboratorsPanel";
import ConnectionStatus from "../components/DiagramEditor/ConnectionStatus";
import { useAuth } from "../contexts/AuthContext";
import api, { diagramElementsAPI } from "../services/api";
import { Diagram, DiagramElement } from "../types";
import { useCollaboration } from "../hooks/useCollaboration";
import CodeGenerationPanel from "../components/CodeGeneration/CodeGenerationPanel";
import { isConstructorDeclaration } from "typescript";

interface DiagramEditorProps {}

const DiagramEditor: React.FC<DiagramEditorProps> = () => {
  const { diagramId } = useParams<{ diagramId: string }>();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();

  // Diagram state
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<DiagramElement | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // UI state
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Tools state
  const [activeTool, setActiveTool] = useState<string>("select");
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [collaboratorsPanelOpen, setCollaboratorsPanelOpen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  // History state
  const [history, setHistory] = useState<DiagramElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Save dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [diagramName, setDiagramName] = useState("");

  // Code Generation Panel
  const [codeGenerationPanelOpen, setCodeGenerationPanelOpen] = useState(false);

  // Estado para mostrar/ocultar el panel de herramientas (toolbar)
  const [toolbarOpen, setToolbarOpen] = useState(true);

  useEffect(() => {
    // Only redirect if auth is not loading and user is not authenticated
    if (!authLoading && !user) {
      navigate('/login'); // Redirect to login if not authenticated
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchDiagramAndElements = async () => {
      if (!diagramId) return;
      setLoading(true);
      try {
        // Obtener datos del diagrama
        const response = await api.get(`/diagrams/${diagramId}/`);
        console.log('Diagrama response:', response.data);
        setDiagram(response.data);
        setDiagramName(response.data.name);
        // Obtener elementos del diagrama (artefactos)
        const elementsRes = await api.get(`/diagram-elements/?diagram=${diagramId}`);
        console.log('Elementos response:', elementsRes.data);
        const backendElements = elementsRes.data.results || elementsRes.data || [];
        
        // Mapear los elementos del backend al formato que espera el frontend
        const mappedElements = backendElements.map((el: any) => ({
          id: el.id,
          type: el.element_type === 'class' ? 'class' : el.element_type,
          name: el.name,
          position: { x: el.position_x || 0, y: el.position_y || 0 },
          size: { width: el.width || 200, height: el.height || 150 },
          data: {
            attributes: el.properties?.attributes || [],
            methods: el.properties?.methods || [],
            isAbstract: el.properties?.isAbstract || false,
            isInterface: el.properties?.isInterface || false,
            ...el.properties
          },
          style: {
            fill: el.color || '#FFFFFF',
            stroke: '#333333',
            strokeWidth: 2,
            fontSize: 14,
            fontFamily: 'Arial'
          }
        }));
        
        console.log('Mapped elements for frontend:', mappedElements);
        setElements(mappedElements);
      } catch (error) {
        toast.error('Error al cargar el diagrama');
        setDiagram(null);
        setElements([]);
      } finally {
        setLoading(false);
      }
    };
    if (diagramId) fetchDiagramAndElements();
  }, [diagramId]);

// Reemplazar las funciones handleElementsChange y handleElementUpdate en DiagramEditor.tsx

// Handle element updates: enfocado en movimiento
const handleElementsChange = useCallback((newElements: DiagramElement[]) => {
  // Verificar cambios de posición específicamente
  const positionChanges = newElements.filter((newEl) => {
    const oldEl = elements.find(el => el.id === newEl.id);
    if (!oldEl) return true; // Elemento nuevo
    
    const posChanged = Math.abs((newEl.position?.x || 0) - (oldEl.position?.x || 0)) > 0.1 ||
                      Math.abs((newEl.position?.y || 0) - (oldEl.position?.y || 0)) > 0.1;
    
    if (posChanged) {
      console.log('🚀 Elemento movido:', newEl.name, 
        'de', oldEl.position, 'a', newEl.position);
    }
    
    return posChanged;
  });

  if (positionChanges.length === 0 && newElements.length === elements.length) {
    return; // No hay cambios de posición
  }

  // Actualizar elementos
  setElements(newElements);
  setHasUnsavedChanges(true);
  
  console.log('📝 Hay cambios sin guardar. Total elementos:', newElements.length);
}, [elements]);

 // Handle element selection optimizado
const handleElementSelect = useCallback((element: DiagramElement | null) => {
  console.log('🎯 Seleccionando elemento:', element ? element.name : 'ninguno');
  
  // Solo actualizar si realmente cambia la selección
  if (selectedElement?.id !== element?.id) {
    setSelectedElement(element);
    
    // Marcar que hay cambios sin guardar cuando se selecciona
    if (element) {
      console.log('📍 Elemento seleccionado:', element.name, 'en posición:', element.position);
    }
  }
}, [selectedElement]);

  // Función para guardar manualmente
  const handleSave = async () => {
    if (!diagramId || !elements.length) {
      toast.error('No hay elementos para guardar');
      return;
    }

    console.log('🔥 Guardando elementos manualmente:', elements);
    
    try {
      // Guardar cada elemento actualizado
      await Promise.all(
        elements.map(async (el) => {
          console.log('Guardando elemento:', el.name, 'posición:', el.position);
          
          try {
            // Actualizar elemento existente
            await api.put(`/diagram-elements/${el.id}/`, {
              name: el.name,
              element_type: el.type || 'class',
              position_x: el.position?.x ?? 0,
              position_y: el.position?.y ?? 0,
              width: el.size?.width ?? 200,
              height: el.size?.height ?? 150,
              color: el.style?.fill || '#FFFFFF',
              visibility: 'public',
              stereotype: el.data?.stereotype || '',
              documentation: el.data?.documentation || '',
              properties: el.data || {},
              diagram: diagramId,
            });
            console.log('✅ Elemento guardado:', el.name);
          } catch (error) {
            console.error('❌ Error guardando elemento:', el.name, error);
            throw error;
          }
        })
      );
      
      toast.success('¡Cambios guardados correctamente!');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar los cambios');
    }
  };

// Debounced save para evitar guardados excesivos
const debouncedSave = useCallback(
  debounce(async (elementsToSave: DiagramElement[]) => {
    if (!elementsToSave.length) return;
    
    try {
      await Promise.all(
        elementsToSave.map(async (el) => {
          try {
            // Verificar si el elemento existe
            const response = await api.get(`/diagram-elements/${el.id}/`);
            if (response.data) {
              // Actualizar elemento existente
              await api.put(`/diagram-elements/${el.id}/`, {
                name: el.name,
                element_type: el.type || 'class',
                position_x: el.position?.x ?? 0,
                position_y: el.position?.y ?? 0,
                width: el.size?.width ?? 200,
                height: el.size?.height ?? 150,
                color: el.style?.backgroundColor || '#FFFFFF',
                visibility: 'public',
                stereotype: el.data?.stereotype || '',
                documentation: el.data?.documentation || '',
                properties: el.data || {},
                diagram: diagramId,
              });
            }
          } catch (error) {
            const err = error as any;
            if (err.response?.status === 404) {
              // Crear nuevo elemento
              await diagramElementsAPI.create({
                name: el.name,
                element_type: el.type || 'class',
                diagram: diagramId,
                position_x: el.position?.x ?? 0,
                position_y: el.position?.y ?? 0,
                width: el.size?.width ?? 200,
                height: el.size?.height ?? 150,
                color: el.style?.backgroundColor || '#FFFFFF',
                visibility: 'public',
                stereotype: el.data?.stereotype || '',
                documentation: el.data?.documentation || '',
                properties: el.data || {}
              });
            } else {
              throw error;
            }
          }
        })
      );
      toast.success('Cambios guardados correctamente');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar los cambios');
    }
  }, 1000), // Debounce de 1 segundo
  [diagramId]
);

// Auto-save desactivado - solo guardar manualmente
// useEffect(() => {
//   if (hasUnsavedChanges && elements.length > 0) {
//     debouncedSave(elements);
//   }
// }, [elements, hasUnsavedChanges, debouncedSave]);

// Función debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setElements(history[historyIndex - 1]);
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setElements(history[historyIndex + 1]);
      setHasUnsavedChanges(true);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
  };

  const handleFitToScreen = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Toggle buttons for tools and properties
  const toggleToolbar = () => setShowToolbar((prev) => !prev);
  const togglePropertiesPanel = () => setPropertiesPanelOpen((prev) => !prev);

  // Botón flotante para abrir el panel de herramientas
  // const FloatingToolbarButton = () =>
  //   !toolbarOpen ? (
  //     <Box
  //       sx={{
  //         position: 'fixed',
  //         top: 120,
  //         left: 16,
  //         zIndex: 1300,
  //       }}
  //     >
  //       <IconButton
  //         color="primary"
  //         onClick={() => setToolbarOpen(true)}
  //         sx={{
  //           backgroundColor: 'background.paper',
  //           boxShadow: 2,
  //           '&:hover': { backgroundColor: 'primary.light' },
  //         }}
  //       >
  //         <ChevronRight />
  //       </IconButton>
  //     </Box>
  //   ) : null;

  if (authLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <Typography>Verificando autenticación...</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <Typography>Cargando diagrama...</Typography>
      </Box>
    );
  }

  return (
    <MainLayout>
      <Box display="flex" flexDirection="column" height="100%">
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            {diagram?.name || 'Editor de Diagrama'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => debouncedSave(elements)}
            disabled={!hasUnsavedChanges}
            sx={{ ml: 2 }}
          >
            {hasUnsavedChanges ? 'Guardar cambios' : 'Guardado'}
          </Button>
        </Box>
        <Box display="flex" height="100%">
          {/* Toolbar Toggle */}
          {toolbarOpen && (
            <UMLToolbar
              activeTool={activeTool}
              onToolChange={setActiveTool}
            />
          )}
          
          
          {/* Canvas */}
          <Box flex={1} position="relative">
            <UMLCanvas
              elements={elements}
              onElementsChange={handleElementsChange}
              onElementSelect={handleElementSelect}
              selectedElement={selectedElement}
              zoom={zoom}
              panPosition={panPosition}
              showGrid={showGrid}
              activeTool={activeTool}
              onZoomChange={setZoom}
              onPanChange={setPanPosition}
            />
          </Box>

          {/* Properties Panel */}
          <PropertiesPanel
            onElementUpdate={(updatedElement) => {
              const updatedElements = elements.map((el) => 
                el.id === updatedElement.id ? updatedElement : el
              );
              handleElementsChange(updatedElements);
            }}
            selectedElement={selectedElement}
            onClose={() => {}}
          />
        </Box>

        {/* Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
          >
            Propiedades
          </MenuItem>
          <MenuItem
            onClick={() => setCollaboratorsPanelOpen(!collaboratorsPanelOpen)}
          >
            Colaboradores
          </MenuItem>
          <Divider />
          <MenuItem>
            <Share sx={{ mr: 1 }} />
            Compartir
          </MenuItem>
          <MenuItem>
            <GetApp sx={{ mr: 1 }} />
            Exportar
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCodeGenerationPanelOpen(true);
              handleMenuClose();
            }}
          >
            <Code sx={{ mr: 1 }} />
            Generar Código
          </MenuItem>
        </Menu>

        {/* Save Dialog */}
        <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
          <DialogTitle>Guardar Diagrama</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nombre del diagrama"
              fullWidth
              value={diagramName}
              onChange={(e) => setDiagramName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Code Generation Panel */}
        {/* <CodeGenerationPanel
          open={codeGenerationPanelOpen}
          onClose={() => setCodeGenerationPanelOpen(false)}
          diagram={diagram}
          elements={elements}
        /> */}
      </Box>
    </MainLayout>
  );
};

export default DiagramEditor;
