import React from 'react';
import { Box, Typography } from '@mui/material';

interface CodeGenerationHistoryProps {
  diagramId: string;
}

const CodeGenerationHistory: React.FC<CodeGenerationHistoryProps> = ({ diagramId }) => {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        History component - implementation in progress
      </Typography>
    </Box>
  );
};

export default CodeGenerationHistory;
