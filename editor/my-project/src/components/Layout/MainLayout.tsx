import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  AccountCircle,
  Logout,
  Settings,
  Person,
  Notifications,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
// import NotificationCenter from "../Notifications/NotificationCenter";

const DRAWER_WIDTH = 250;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleNotificationToggle = () => {
    // setNotificationOpen(!notificationOpen);
    // revisar
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Calcular ancho dinámicamente basado en el estado del sidebar
  const getAppBarWidth = () => {
    return sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : "calc(100% - 60px)";
  };

  const getAppBarMargin = () => {
    return sidebarOpen ? `${DRAWER_WIDTH}px` : "60px";
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: getAppBarWidth(),
          ml: getAppBarMargin(),
          backgroundColor: "background.paper",
          color: "text.primary",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          transition: "width 0.3s, margin 0.3s",
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            UML Collaborative Designer
          </Typography>

          {/* Notification Button */}
          <IconButton
            size="large"
            aria-label="show notifications"
            color="inherit"
            onClick={handleNotificationToggle}
            sx={{ mr: 1 }}
          >
            <Notifications />
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            {user?.avatar ? (
              <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
            ) : (
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                {user?.first_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </Avatar>
            )}
          </IconButton>

          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                mt: 1.5,
                "& .MuiAvatar-root": {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                "&:before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem>
              <Person fontSize="small" sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem>
              <Settings fontSize="small" sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: sidebarOpen ? DRAWER_WIDTH : 60, flexShrink: 0 }}
        aria-label="navigation"
      >
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: sidebarOpen ? DRAWER_WIDTH : 60,
              transition: "width 0.3s",
              overflow: "hidden",
              borderRadius: sidebarOpen ? "8px" : "4px", // Add subtle rounded corners
            },
          }}
          open
        >
          <Sidebar
            open={sidebarOpen}
            onToggle={handleSidebarToggle}
          />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: sidebarOpen
            ? `calc(100% - ${DRAWER_WIDTH}px)`
            : "calc(100% - 60px)",
          minHeight: "100vh",
          backgroundColor: "grey.50",
          transition: "width 0.3s",
        }}
      >
        <Toolbar />
        {children}

        {/* revisar cuando ya termine con el login */}
      </Box>

      {/* Notification Center */}
      {/* <NotificationCenter
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      /> */}
    </Box>
  );
};

export default MainLayout;
