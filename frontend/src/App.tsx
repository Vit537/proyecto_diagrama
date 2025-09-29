import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SuccessPage from "./pages/success_page";

// Context Providers
import { AuthProvider } from "./contexts/AuthContext";
// import { NotificationProvider } from "./contexts/NotificationContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import DiagramEditor from "./pages/DiagramEditor";
import ProjectDiagrams from "./pages/ProjectDiagrams";

// Create Material-UI theme
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        {/* <NotificationProvider> */}
          <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/success" element={<SuccessPage />} />
                {/* Ruta del editor de diagramas (temporalmente sin protección) */}
                <Route path="/editor" element={<DiagramEditor />} />
                <Route path="/editor/:diagramId" element={<DiagramEditor />} />


                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <Projects />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor/:diagramId"
                  element={
                    <ProtectedRoute>
                      <DiagramEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/editor"
                  element={
                    <ProtectedRoute>
                      <DiagramEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:projectId/diagrams"
                  element={
                    <ProtectedRoute>
                      <ProjectDiagrams />
                    </ProtectedRoute>
                  }
                />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/projects" replace />} />
                {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
                

                {/* <Route
                  path="/"
                  element={<Navigate to="/login" replace />}
                /> */}

                {/* Catch all route */}
                <Route
                  path="*"
                  element={<Navigate to="/projects" replace />}
                  // element={<Navigate to="/dashboard" replace />}
                />
              </Routes>

              {/* Toast notifications */}
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </Router>
        {/* </NotificationProvider> */}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

