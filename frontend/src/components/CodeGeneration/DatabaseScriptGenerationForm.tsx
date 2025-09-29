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
  FormControl,
  FormLabel,
  FormGroup,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Storage as DatabaseIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

import { Diagram } from '../../types';

interface DatabaseScriptGenerationFormProps {
  diagram: Diagram;
  onGenerate: (config: any) => Promise<any>;
  loading: boolean;
}

interface DatabaseEngine {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const DATABASE_ENGINES: DatabaseEngine[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    icon: '🐘'
  },
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'Popular open-source relational database',
    icon: '🐬'
  },
  {
    id: 'sqlserver',
    name: 'SQL Server',
    description: 'Microsoft SQL Server database',
    icon: '🟦'
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Lightweight file-based database',
    icon: '🪶'
  }
];

const DatabaseScriptGenerationForm: React.FC<DatabaseScriptGenerationFormProps> = ({
  diagram,
  onGenerate,
  loading
}) => {
  const [config, setConfig] = useState({
    database_types: ['postgresql'] as string[],
    include_constraints: true,
    include_indexes: true,
    include_sample_data: false,
    schema_name: '',
  });

  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedScripts, setGeneratedScripts] = useState<Record<string, string> | null>(null);
  const [scriptViewDialog, setScriptViewDialog] = useState<{ open: boolean; dbType: string; script: string }>({
    open: false,
    dbType: '',
    script: ''
  });

  const handleConfigChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDatabaseTypeChange = (dbType: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      database_types: checked
        ? [...prev.database_types, dbType]
        : prev.database_types.filter(type => type !== dbType)
    }));
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);

      const result = await onGenerate(config);

      setGeneratedScripts(result.scripts);
      setSuccess(
        `Database scripts generated successfully for ${result.database_types.join(', ')}! 
        Total size: ${Math.round(result.total_size / 1024)} KB`
      );

    } catch (err: any) {
      setError(err.message || 'Failed to generate database scripts');
    } finally {
      setGenerating(false);
    }
  };

  const handleViewScript = (dbType: string, script: string) => {
    setScriptViewDialog({
      open: true,
      dbType,
      script
    });
  };

  const handleCopyScript = async (script: string) => {
    try {
      await navigator.clipboard.writeText(script);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy script:', err);
    }
  };

  const handleDownloadScript = (dbType: string, script: string) => {
    const blob = new Blob([script], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.name}_${dbType}.sql`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const validateConfig = () => {
    if (config.database_types.length === 0) {
      return 'Please select at least one database type';
    }

    if (config.schema_name && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(config.schema_name)) {
      return 'Invalid schema name format';
    }

    return null;
  };

  const validationError = validateConfig();

  return (
    <Box>
      <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
        <DatabaseIcon />
        Database Script Generation
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Generate SQL scripts for creating database tables, constraints, and indexes from your diagram.
        Scripts will be optimized for each selected database engine.
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
        {/* Database Engine Selection */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Database Engines
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select one or more database engines to generate SQL scripts for:
              </Typography>
              
              <FormControl component="fieldset" fullWidth>
                <FormGroup>
                  <Grid container spacing={2}>
                    {DATABASE_ENGINES.map((engine) => (
                      <Grid item xs={12} sm={6} md={3} key={engine.id}>
                        <Card 
                          variant={config.database_types.includes(engine.id) ? "outlined" : "elevation"}
                          sx={{
                            border: config.database_types.includes(engine.id) ? 2 : 1,
                            borderColor: config.database_types.includes(engine.id) ? 'primary.main' : 'divider',
                            cursor: 'pointer',
                            '&:hover': {
                              boxShadow: 2
                            }
                          }}
                          onClick={() => handleDatabaseTypeChange(engine.id, !config.database_types.includes(engine.id))}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h4" sx={{ mb: 1 }}>
                              {engine.icon}
                            </Typography>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={config.database_types.includes(engine.id)}
                                  onChange={(e) => handleDatabaseTypeChange(engine.id, e.target.checked)}
                                />
                              }
                              label={engine.name}
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                              {engine.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Generation Options */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Generation Options
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Schema Name (Optional)"
                    value={config.schema_name}
                    onChange={(e) => handleConfigChange('schema_name', e.target.value)}
                    placeholder="my_schema"
                    helperText="Leave empty to use default schema"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Additional Features</FormLabel>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.include_constraints}
                            onChange={(e) => handleConfigChange('include_constraints', e.target.checked)}
                          />
                        }
                        label="Include Constraints"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.include_indexes}
                            onChange={(e) => handleConfigChange('include_indexes', e.target.checked)}
                          />
                        }
                        label="Include Indexes"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.include_sample_data}
                            onChange={(e) => handleConfigChange('include_sample_data', e.target.checked)}
                          />
                        }
                        label="Include Sample Data"
                      />
                    </FormGroup>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Generated Scripts */}
        {generatedScripts && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Generated Scripts
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.entries(generatedScripts).map(([dbType, script]) => {
                    const engine = DATABASE_ENGINES.find(e => e.id === dbType);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={dbType}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <Typography variant="h6">
                                {engine?.icon}
                              </Typography>
                              <Typography variant="subtitle2">
                                {engine?.name || dbType}
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {Math.round(script.length / 1024)} KB
                            </Typography>
                            
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Button
                                size="small"
                                startIcon={<ViewIcon />}
                                onClick={() => handleViewScript(dbType, script)}
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                startIcon={<CopyIcon />}
                                onClick={() => handleCopyScript(script)}
                              >
                                Copy
                              </Button>
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                onClick={() => handleDownloadScript(dbType, script)}
                              >
                                Download
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

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
                <DatabaseIcon />
              }
            >
              {loading || generating ? 'Generating...' : 'Generate Database Scripts'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Script View Dialog */}
      <Dialog
        open={scriptViewDialog.open}
        onClose={() => setScriptViewDialog({ open: false, dbType: '', script: '' })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {DATABASE_ENGINES.find(e => e.id === scriptViewDialog.dbType)?.name} Script
            </Typography>
            <IconButton
              onClick={() => setScriptViewDialog({ open: false, dbType: '', script: '' })}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box
            component="pre"
            sx={{
              backgroundColor: 'grey.100',
              padding: 2,
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: '60vh',
              fontSize: '0.875rem',
              fontFamily: 'monospace'
            }}
          >
            {scriptViewDialog.script}
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={() => handleCopyScript(scriptViewDialog.script)}
            startIcon={<CopyIcon />}
          >
            Copy to Clipboard
          </Button>
          <Button
            onClick={() => handleDownloadScript(scriptViewDialog.dbType, scriptViewDialog.script)}
            startIcon={<DownloadIcon />}
          >
            Download
          </Button>
          <Button onClick={() => setScriptViewDialog({ open: false, dbType: '', script: '' })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatabaseScriptGenerationForm;
