import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import {
  Code as CodeIcon,
  Storage as DatabaseIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as ProcessingIcon,
} from '@mui/icons-material';

import { Diagram, CodeGenerationJob } from '../../types';
import { codeGenerationAPI } from '../../services/api';
import SpringBootGenerationForm from './SpringBootGenerationForm';
import DatabaseScriptGenerationForm from './DatabaseScriptGenerationForm';
import CodeGenerationHistory from './CodeGenerationHistory';

interface CodeGenerationPanelProps {
  diagram: Diagram;
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`codegen-tabpanel-${index}`}
      aria-labelledby={`codegen-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CodeGenerationPanel: React.FC<CodeGenerationPanelProps> = ({
  diagram,
  open,
  onClose
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [recentJobs, setRecentJobs] = useState<CodeGenerationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingSpringBoot, setGeneratingSpringBoot] = useState(false);
  const [generatingDatabase, setGeneratingDatabase] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchRecentJobs = async () => {
    try {
      setLoading(true);
      const response = await codeGenerationAPI.getGenerationJobs(1);
      // Filter jobs for current diagram
      const diagramJobs = (response.results || []).filter(
        job => job.diagram === diagram.id
      ).slice(0, 5); // Show only 5 most recent jobs
      setRecentJobs(diagramJobs);
    } catch (err: any) {
      console.error('Error fetching generation jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRecentJobs();
    }
  }, [open, diagram.id]);

  const handleSpringBootGeneration = async (config: any) => {
    try {
      setGeneratingSpringBoot(true);
      setError(null);

      const result = await codeGenerationAPI.generateSpringBoot({
        diagram_id: diagram.id,
        template_type: 'spring_boot',
        language: 'java',
        ...config
      });

      // Refresh jobs list
      await fetchRecentJobs();

      // Show success message
      setError(null);
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Error generating Spring Boot project');
      throw err;
    } finally {
      setGeneratingSpringBoot(false);
    }
  };

  const handleDatabaseScriptGeneration = async (config: any) => {
    try {
      setGeneratingDatabase(true);
      setError(null);

      const result = await codeGenerationAPI.generateDatabaseScripts({
        diagram_id: diagram.id,
        ...config
      });

      // Refresh jobs list
      await fetchRecentJobs();

      // Show success message
      setError(null);
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Error generating database scripts');
      throw err;
    } finally {
      setGeneratingDatabase(false);
    }
  };

  const handleDownloadJob = async (job: CodeGenerationJob) => {
    try {
      const blob = await codeGenerationAPI.downloadGeneratedFiles(job.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${job.diagram_name || 'generated'}-${job.template_name}.zip`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err: any) {
      setError(err.message || 'Error downloading files');
    }
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <ProcessingIcon color="primary" />;
      default:
        return <ProcessingIcon color="disabled" />;
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'primary';
      default:
        return 'default';
    }
  };

  // Check if diagram is suitable for code generation
  const isDatabaseDiagram = diagram.diagram_type === 'database' || diagram.diagram_type === 'class';
  
  if (!isDatabaseDiagram) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Code Generation</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Code generation is only available for Database and Class diagrams.
            Current diagram type: {diagram.diagram_type}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CodeIcon />
          Code Generation - {diagram.name}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="code generation tabs">
            <Tab 
              label="Spring Boot" 
              icon={<CodeIcon />} 
              iconPosition="start"
              id="codegen-tab-0"
              aria-controls="codegen-tabpanel-0"
            />
            <Tab 
              label="Database Scripts" 
              icon={<DatabaseIcon />} 
              iconPosition="start"
              id="codegen-tab-1"
              aria-controls="codegen-tabpanel-1"
            />
            <Tab 
              label="Recent Jobs" 
              icon={<HistoryIcon />} 
              iconPosition="start"
              id="codegen-tab-2"
              aria-controls="codegen-tabpanel-2"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <SpringBootGenerationForm
            diagram={diagram}
            onGenerate={handleSpringBootGeneration}
            loading={generatingSpringBoot}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <DatabaseScriptGenerationForm
            diagram={diagram}
            onGenerate={handleDatabaseScriptGeneration}
            loading={generatingDatabase}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Recent Generation Jobs
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : recentJobs.length === 0 ? (
              <Alert severity="info">
                No code generation jobs found for this diagram.
              </Alert>
            ) : (
              <List>
                {recentJobs.map((job, index) => (
                  <React.Fragment key={job.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getJobStatusIcon(job.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {job.template_name}
                            </Typography>
                            <Chip
                              label={job.status}
                              color={getJobStatusColor(job.status) as any}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Created: {new Date(job.created_at).toLocaleString()}
                            </Typography>
                            {job.output_size && (
                              <Typography variant="body2" color="text.secondary">
                                Size: {Math.round(job.output_size / 1024)} KB
                              </Typography>
                            )}
                            {job.error_message && (
                              <Typography variant="body2" color="error">
                                Error: {job.error_message}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        {job.status === 'completed' && (
                          <IconButton 
                            edge="end" 
                            onClick={() => handleDownloadJob(job)}
                            title="Download files"
                          >
                            <DownloadIcon />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < recentJobs.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}

            <Box mt={2}>
              <Button
                variant="outlined"
                onClick={fetchRecentJobs}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <HistoryIcon />}
              >
                Refresh Jobs
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CodeGenerationPanel;
