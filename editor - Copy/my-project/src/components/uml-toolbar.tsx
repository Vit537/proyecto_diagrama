import React from 'react';
import { Save, Download, FileImage, FileText, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface UMLToolbarProps {
  onSave: () => void;
  onLoad: () => void;
}

export const UMLToolbar: React.FC<UMLToolbarProps> = ({ onSave, onLoad }) => {
  const { theme, toggleTheme } = useTheme();
  const handleExportImage = async () => {
    try {
      const flowElement = document.querySelector('.react-flow') as HTMLElement;
      if (!flowElement) {
        alert('Canvas not found');
        return;
      }

      const canvas = await html2canvas(flowElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `uml-diagram-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Error exporting image. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const flowElement = document.querySelector('.react-flow') as HTMLElement;
      if (!flowElement) {
        alert('Canvas not found');
        return;
      }

      const canvas = await html2canvas(flowElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`uml-diagram-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2 z-10">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">UML Class Diagram Editor</h1>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === 'light' ? 'Dark' : 'Light'}
        </Button>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
        
        <Button
          onClick={onSave}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        
        <Button
          onClick={onLoad}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Load
        </Button>
        
        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
        
        <Button
          onClick={handleExportImage}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileImage className="h-4 w-4" />
          Export PNG
        </Button>
        
        <Button
          onClick={handleExportPDF}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>
    </div>
  );
};