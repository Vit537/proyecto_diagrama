import React from 'react';
import { Save, Download, FileImage, FileText, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface UMLToolbarProps {
  onSave: () => void;
  onLoad: () => void;
  onSaveToDatabase?: () => void;
  onLoadFromDatabase?: () => void;
  diagramName?: string;
  diagramId?: string;
}

export const UMLToolbar: React.FC<UMLToolbarProps> = ({ onSave, onLoad, onSaveToDatabase, onLoadFromDatabase, diagramName }) => {
  
  const handleExportImage = async () => {
    try {
      console.log('Starting PNG export...');
      
      // Wait to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try different approaches to find the ReactFlow content
      let targetElement: HTMLElement | null = null;
      
      // First try: Find the viewport that contains the nodes
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (viewport && viewport.children.length > 0) {
        targetElement = viewport.parentElement as HTMLElement;
        console.log('Using viewport parent:', targetElement);
      }
      
      // Second try: Find the main container
      if (!targetElement) {
        targetElement = document.querySelector('.react-flow') as HTMLElement;
        console.log('Using main container:', targetElement);
      }
      
      // Third try: Find any element with react-flow class
      if (!targetElement) {
        targetElement = document.querySelector('[class*="react-flow"]') as HTMLElement;
        console.log('Using class selector:', targetElement);
      }
      
      if (!targetElement) {
        throw new Error('No se encontró el contenedor del diagrama');
      }

      // Log element info for debugging
      console.log('Target element:', {
        className: targetElement.className,
        offsetWidth: targetElement.offsetWidth,
        offsetHeight: targetElement.offsetHeight,
        scrollWidth: targetElement.scrollWidth,
        scrollHeight: targetElement.scrollHeight,
        childElementCount: targetElement.childElementCount
      });

      // Make sure element is visible and has content
      if (targetElement.offsetWidth === 0 || targetElement.offsetHeight === 0) {
        throw new Error('El elemento del diagrama no tiene dimensiones válidas');
      }

      const options = {
        backgroundColor: '#f8fafc',
        width: Math.max(targetElement.offsetWidth, 800),
        height: Math.max(targetElement.offsetHeight, 600),
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
        ignoreElements: (element: Element) => {
          // Ignore controls and panels that might interfere
          return element.classList.contains('react-flow__controls') ||
                 element.classList.contains('react-flow__panel') ||
                 element.classList.contains('react-flow__minimap');
        }
      };

      console.log('Starting html2canvas with options:', options);
      const canvas = await html2canvas(targetElement, options);

      console.log('Canvas result:', {
        width: canvas.width,
        height: canvas.height,
        hasContent: canvas.width > 0 && canvas.height > 0
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('La captura resultó en un canvas vacío');
      }

      // Create and trigger download
      const dataURL = canvas.toDataURL('image/png', 1.0);
      
      // Check if dataURL has actual content (not just empty canvas)
      if (dataURL === 'data:,') {
        throw new Error('La imagen capturada está vacía');
      }

      const link = document.createElement('a');
      link.download = `uml-diagram-${diagramName || 'diagram'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('PNG export completed successfully');
      alert('Imagen exportada exitosamente!');
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Error al exportar imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleExportPDF = async () => {
    try {
      console.log('Starting PDF export...');
      
      // Wait to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use the same element selection logic as PNG export
      let targetElement: HTMLElement | null = null;
      
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (viewport && viewport.children.length > 0) {
        targetElement = viewport.parentElement as HTMLElement;
      }
      
      if (!targetElement) {
        targetElement = document.querySelector('.react-flow') as HTMLElement;
      }
      
      if (!targetElement) {
        targetElement = document.querySelector('[class*="react-flow"]') as HTMLElement;
      }
      
      if (!targetElement) {
        throw new Error('No se encontró el contenedor del diagrama');
      }

      if (targetElement.offsetWidth === 0 || targetElement.offsetHeight === 0) {
        throw new Error('El elemento del diagrama no tiene dimensiones válidas');
      }

      const canvas = await html2canvas(targetElement, {
        backgroundColor: '#f8fafc',
        width: Math.max(targetElement.offsetWidth, 800),
        height: Math.max(targetElement.offsetHeight, 600),
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
        ignoreElements: (element: Element) => {
          return element.classList.contains('react-flow__controls') ||
                 element.classList.contains('react-flow__panel') ||
                 element.classList.contains('react-flow__minimap');
        }
      });

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('La captura resultó en un canvas vacío');
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (imgData === 'data:,') {
        throw new Error('La imagen capturada está vacía');
      }
      
      // Calculate PDF dimensions - use A4 size with proper scaling
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      // A4 dimensions in mm
      const a4Width = 210;
      const a4Height = 297;
      
      let pdfWidth, pdfHeight;
      
      if (ratio > a4Width / a4Height) {
        // Image is wider, fit to width
        pdfWidth = a4Width - 20; // 10mm margin on each side
        pdfHeight = pdfWidth / ratio;
      } else {
        // Image is taller, fit to height  
        pdfHeight = a4Height - 20; // 10mm margin on top/bottom
        pdfWidth = pdfHeight * ratio;
      }

      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Center the image on the page
      const xOffset = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
      const yOffset = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, pdfWidth, pdfHeight);
      pdf.save(`uml-diagram-${diagramName || 'diagram'}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('PDF export completed successfully');
      alert('PDF exportado exitosamente!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  return (
    <div className="bg-white border-b border-blue-200/70 px-4 py-2 flex items-center gap-2 z-10 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-4xl font-semibold text-blue-900">
          Editor de UML
        </h2>
        {diagramName && (
          <span className="text-sm text-blue-600">
            - {diagramName}
          </span>
        )}
      </div>
      
      <div className="flex-1" />
      
      <div className="flex flex-col gap-2">
        {/* Primera fila - 3 botones */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onSave}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 !bg-sky-100 !text-sky-700 !border-sky-300 hover:!bg-sky-200 hover:!border-sky-400" 
          >
            <Save className="h-4 w-4" />
            Guardar Diagrama
          </Button>
          
          <Button
            onClick={onLoad}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 !bg-slate-100 !text-slate-700 !border-slate-300 hover:!bg-slate-200 hover:!border-slate-400"
          >
            <FileText className="h-4 w-4" />
            Recuperar Diagrama
          </Button>
          
          <Button
            onClick={onSaveToDatabase}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 !bg-purple-100 !text-purple-700 !border-purple-300 hover:!bg-purple-200 hover:!border-purple-400"
          >
            <Database className="h-4 w-4" />
            Guardar en BD
          </Button>
        </div>

        {/* Segunda fila - 3 botones */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onLoadFromDatabase}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 !bg-indigo-100 !text-indigo-700 !border-indigo-300 hover:!bg-indigo-200 hover:!border-indigo-400"
          >
            <RefreshCw className="h-4 w-4" />
            Cargar desde BD
          </Button>
          
          <Button
            onClick={handleExportImage}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 !bg-blue-100 !text-blue-700 !border-blue-300 hover:!bg-blue-200 hover:!border-blue-400"
          >
            <FileImage className="h-4 w-4" />
            Export PNG
          </Button>
          
          <Button
            onClick={handleExportPDF}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 !bg-green-100 !text-green-700 !border-green-300 hover:!bg-green-200 hover:!border-green-400"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
    </div>
  );
};