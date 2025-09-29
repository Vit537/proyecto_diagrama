import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  FolderOpen,
  AccountTree,
  People,
  Settings,
  Code,
  PictureAsPdf,
  Analytics,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

interface SidebarProps {
  onItemClick?: () => void;
  open?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: string;
  disabled?: boolean;
}

const DRAWER_WIDTH = 250; // Define your drawer width here

const Sidebar: React.FC<SidebarProps> = ({ onItemClick, open = true, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const mainNavItems: NavItem[] = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
    },
    {
      text: 'Mis Proyectos',
      icon: <FolderOpen />,
      path: '/projects',
    },
    {
      text: 'Editor de Diagramas',
      icon: <AccountTree />,
      path: '/editor',
    },
    {
      text: 'Colaboradores',
      icon: <People />,
      path: '/collaborators',
    },
  ];

  const toolsNavItems: NavItem[] = [
    {
      text: 'Generación de Código',
      icon: <Code />,
      path: '/code-generation',
    },
    {
      text: 'Exportar PDF',
      icon: <PictureAsPdf />,
      path: '/export-pdf',
    },
    {
      text: 'Analíticas',
      icon: <Analytics />,
      path: '/analytics',
      badge: 'Próximamente',
      disabled: true,
    },
  ];

  const settingsNavItems: NavItem[] = [
    {
      text: 'Configuración',
      icon: <Settings />,
      path: '/settings',
    },
  ];

  // Detect if we are in a project diagrams route
  const isProjectDiagrams = /^\/projects\/[^/]+\/diagrams/.test(location.pathname);

  const projectNavItems: NavItem[] = isProjectDiagrams
    ? [
        {
          text: 'Mis Diagramas',
          icon: <AccountTree />,
          path: location.pathname, // stay on current diagrams page
        },
      ]
    : [];

  const handleNavigation = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const isActive = (path: string) => location.pathname === path;

  const renderNavItems = (items: NavItem[]) => (
    <List>
      {items.map((item) => (
        <ListItem key={item.path} disablePadding>
          <ListItemButton
            onClick={() => !item.disabled && handleNavigation(item.path)}
            disabled={item.disabled}
            sx={{
              borderRadius: 2,
              mx: 1,
              mb: 0.5,
              backgroundColor: isActive(item.path) ? 'primary.main' : 'transparent',
              color: isActive(item.path) ? 'white' : 'text.primary',
              '&:hover': {
                backgroundColor: isActive(item.path) 
                  ? 'primary.dark' 
                  : 'action.hover',
              },
              '&.Mui-disabled': {
                opacity: 0.5,
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive(item.path) ? 'white' : 'text.secondary',
                minWidth: 40,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive(item.path) ? 600 : 400,
              }}
            />
            {item.badge && (
              <Chip
                label={item.badge}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6875rem',
                  backgroundColor: 'warning.light',
                  color: 'warning.contrastText',
                }}
              />
            )}
          </ListItemButton>
        </ListItem>
      ))}

      
    </List>
  );

  if (!open) {
    // Collapsed sidebar with open button
    return (
      <Box
        sx={{
          height: '100%',
          width: 60,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          boxShadow: 3,
          position: 'relative',
        }}
      >
        <Toolbar sx={{ px: 1, justifyContent: 'center' }}>
          <IconButton
            onClick={onToggle}
            sx={{
              color: 'primary.main',
              '&:hover': { backgroundColor: 'primary.light', color: 'white' },
            }}
            size="small"
            aria-label="Abrir sidebar"
          >
            <ChevronRight />
          </IconButton>
        </Toolbar>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: open ? DRAWER_WIDTH : 60, // Match Drawer dimensions
        minWidth: open ? 60 : 0,
        maxWidth: open ? DRAWER_WIDTH : 60, // Match Drawer dimensions
        transition: 'width 0.3s',
        boxShadow: 3,
        position: 'relative',
        backgroundColor: 'background.paper',
        zIndex: 1200,
        overflowY: 'auto',
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onToggle}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1400,
        }}
        size="small"
        aria-label="Cerrar sidebar"
      >
        <ChevronLeft />
      </IconButton>

      {/* Logo/Brand */}
      <Toolbar sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <AccountTree sx={{ mr: 1, color: 'primary.main' }} />
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontSize: '1.1rem',
            }}
          >
            UML Designer
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      {/* Main Navigation */}
      <Box sx={{ px: 1, py: 2 }}>
        <Typography
          variant="overline"
          sx={{
            px: 2,
            pb: 1,
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        >
          Principal
        </Typography>
        {renderNavItems(mainNavItems)}
        {projectNavItems.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            {renderNavItems(projectNavItems)}
          </>
        )}
      </Box>

      <Divider />

      {/* Tools Navigation */}
      <Box sx={{ px: 1, py: 2 }}>
        <Typography
          variant="overline"
          sx={{
            px: 2,
            pb: 1,
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        >
          Herramientas
        </Typography>
        {renderNavItems(toolsNavItems)}
      </Box>

      {/* Settings Navigation - Push to bottom */}
      <Box sx={{ mt: 'auto', px: 1, pb: 2 }}>
        <Divider sx={{ mb: 2 }} />
        {renderNavItems(settingsNavItems)}
      </Box>
    </Box>
  );
};

export default Sidebar;
