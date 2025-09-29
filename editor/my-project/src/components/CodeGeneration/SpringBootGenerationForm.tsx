import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

import { type Diagram } from '../../types';
import { codeGenerationAPI } from '../../services/api';

interface SpringBootGenerationFormProps {
  diagram: Diagram;
  onGenerate: (config: any) => Promise<any>;
  loading: boolean;
}

const SpringBootGenerationForm: React.FC<SpringBootGenerationFormProps> = ({
  diagram,
  onGenerate,
  loading
}) => {
  const [config, setConfig] = useState({
    package_name: 'com.example.app',
    project_name: 'generated-app',
    spring_boot_version: '3.2.0',
    java_version: '17',
    include_tests: true,
    include_swagger: true,
    include_security: false,
    output_format: 'zip' as 'zip' | 'tar' | 'folder',
  });

  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedJobId, setGeneratedJobId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      setGeneratedJobId(null);

      const result = await onGenerate(config);

      // Almacenar el job ID para poder descargar después
      if (result.job && result.job.id) {
        setGeneratedJobId(result.job.id);
      }

      setSuccess(
        `Spring Boot project generated successfully! 
        ${result.files_count} files created (${Math.round(result.total_size / 1024)} KB)`
      );

    } catch (err: any) {
      setError(err.message || 'Failed to generate Spring Boot project');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedJobId) return;

    try {
      setDownloading(true);
      setError(null);

      const blob = await codeGenerationAPI.downloadGeneratedFiles(generatedJobId);
      
      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.project_name}-spring-boot.zip`;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
    } catch (err: any) {
      setError(err.message || 'Error downloading Spring Boot project');
    } finally {
      setDownloading(false);
    }
  };

  const validateConfig = () => {
    const packageNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)*$/;
    const projectNameRegex = /^[a-zA-Z][a-zA-Z0-9-_]*$/;

    if (!packageNameRegex.test(config.package_name)) {
      return 'Invalid package name format';
    }

    if (!projectNameRegex.test(config.project_name)) {
      return 'Invalid project name format';
    }

    return null;
  };

  const validationError = validateConfig();

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <BuildIcon />
        Spring Boot Project Configuration
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Generate a complete Spring Boot project from your database diagram. This will create
        JPA entities, repositories, services, REST controllers, and all necessary configuration files.
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {validationError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Basic Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Package Name"
                    value={config.package_name}
                    onChange={(e) => handleConfigChange('package_name', e.target.value)}
                    placeholder="com.example.app"
                    helperText="Java package name (e.g., com.company.project)"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={config.project_name}
                    onChange={(e) => handleConfigChange('project_name', e.target.value)}
                    placeholder="my-spring-app"
                    helperText="Maven artifact name"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Spring Boot Version</InputLabel>
                    <Select
                      value={config.spring_boot_version}
                      onChange={(e) => handleConfigChange('spring_boot_version', e.target.value)}
                      label="Spring Boot Version"
                    >
                      <MenuItem value="3.2.0">3.2.0 (Latest)</MenuItem>
                      <MenuItem value="3.1.5">3.1.5</MenuItem>
                      <MenuItem value="3.0.12">3.0.12</MenuItem>
                      <MenuItem value="2.7.18">2.7.18 (LTS)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Java Version</InputLabel>
                    <Select
                      value={config.java_version}
                      onChange={(e) => handleConfigChange('java_version', e.target.value)}
                      label="Java Version"
                    >
                      <MenuItem value="21">Java 21</MenuItem>
                      <MenuItem value="17">Java 17 (LTS)</MenuItem>
                      <MenuItem value="11">Java 11 (LTS)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Output Format</InputLabel>
                    <Select
                      value={config.output_format}
                      onChange={(e) => handleConfigChange('output_format', e.target.value)}
                      label="Output Format"
                    >
                      <MenuItem value="zip">ZIP Archive</MenuItem>
                      <MenuItem value="tar">TAR Archive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Features */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="additional-features-content"
              id="additional-features-header"
            >
              <Typography variant="subtitle1">Additional Features</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.include_tests}
                        onChange={(e) => handleConfigChange('include_tests', e.target.checked)}
                      />
                    }
                    label="Include Unit Tests"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Generate JUnit test classes for services
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.include_swagger}
                        onChange={(e) => handleConfigChange('include_swagger', e.target.checked)}
                      />
                    }
                    label="Include Swagger/OpenAPI"
                  />
                  <Typography variant="body2" color="text.secondary">
                    API documentation with Swagger UI
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.include_security}
                        onChange={(e) => handleConfigChange('include_security', e.target.checked)}
                      />
                    }
                    label="Include Spring Security"
                  />
                  <Typography variant="body2" color="text.secondary">
                    JWT-based authentication and authorization
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Generated Components Preview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                What will be generated:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">JPA Entities</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">JPA Repositories</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">Service Classes</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">REST Controllers</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">DTO Classes</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">Configuration</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">Maven pom.xml</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">Documentation</Typography>
                  </Box>
                </Grid>

                {config.include_tests && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                      <Typography variant="body2">Unit Tests</Typography>
                    </Box>
                  </Grid>
                )}

                {config.include_swagger && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                      <Typography variant="body2">Swagger Config</Typography>
                    </Box>
                  </Grid>
                )}

                {config.include_security && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                      <Typography variant="body2">Security Config</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Generate Button */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGenerate}
              disabled={loading || generating || !!validationError}
              startIcon={
                loading || generating ? 
                <CircularProgress size={20} /> : 
                <BuildIcon />
              }
            >
              {loading || generating ? 'Generating...' : 'Generate Spring Boot Project'}
            </Button>

            {/* Download Button - solo aparece después de generar exitosamente */}
            {generatedJobId && (
              <Button
                variant="outlined"
                size="large"
                onClick={handleDownload}
                disabled={downloading}
                startIcon={
                  downloading ? 
                  <CircularProgress size={20} /> : 
                  <DownloadIcon />
                }
                color="success"
              >
                {downloading ? 'Downloading...' : 'Download Project'}
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SpringBootGenerationForm;
