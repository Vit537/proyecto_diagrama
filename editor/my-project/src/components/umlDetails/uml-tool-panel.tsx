import React, { useState } from 'react';
import { 
  MousePointer, 
  Square, 
  ArrowRight, 
  Triangle, 
  Diamond,
  Hexagon,
  Network,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RelationType } from '@/types/uml';
import type { Diagram } from '@/types';

interface UMLToolPanelProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  onAddClass: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  diagram?: Diagram | null;
}

const tools = [
  {
    id: 'class',
    name: 'Class',
    icon: Square,
    description: 'Add UML Class'
  }
];

const relationships: Array<{
  id: RelationType;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  style: string;
}> = [
  {
    id: 'association',
    name: 'Association',
    icon: ArrowRight,
    description: 'Simple association between classes',
    style: 'stroke-gray-600'
  },
  {
    id: 'many-to-many',
    name: 'Many to Many',
    icon: Network,
    description: 'Many-to-many relationship with intermediate table',
    style: 'stroke-purple-600'
  },
  {
    id: 'inheritance',
    name: 'Inheritance',
    icon: Triangle,
    description: 'Inheritance relationship (extends)',
    style: 'stroke-blue-600'
    // style: '!bg-slate-100'
    
  },
  {
    id: 'composition',
    name: 'Composition',
    icon: Diamond,
    description: 'Strong ownership relationship',
    style: 'stroke-black'
  },
  {
    id: 'aggregation',
    name: 'Aggregation',
    icon: Hexagon,
    description: 'Weak ownership relationship',
    style: 'stroke-red-600'
    // style: 'stroke-green-600'
  }
];

export const UMLToolPanel: React.FC<UMLToolPanelProps> = ({
  selectedTool,
  onToolSelect,
  onAddClass,
  isCollapsed = false,
  onToggleCollapse
}) => {
  if (isCollapsed) {
    return (
      <div className="w-12 bg-white dark:bg-gray-300 border-r border-gray-200 dark:border-gray-700 p-2 flex flex-col items-center">
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="sm"
          className="mb-4 !bg-slate-100 !text-slate-700 !border-slate-300 hover:!bg-slate-200 hover:!border-slate-400"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "ghost"}
                size="sm"
                className="w-full p-2 !bg-slate-100 !text-slate-700 !border-slate-300 hover:!bg-slate-200 hover:!border-slate-400"
                onClick={() => {
                  onToolSelect(tool.id);
                  if (tool.id === 'class') {
                    onAddClass();
                  }
                }}
                title={tool.name}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-blue-50/50 border-r border-blue-200/70 p-4 flex flex-col h-full">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-900">Panel de Herramientas</h2>
        <Button
          onClick={onToggleCollapse}
          variant="ghost"
          size="sm"
          className=" justify-start !bg-slate-100 !text-slate-700 !border-slate-300 hover:!bg-slate-200 hover:!border-slate-400"
        >
          <ChevronLeft className="h-4 w-4 " />
        </Button>
      </div>

      {/* Welcome Message */}
      <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-600 mb-2">
          ¡Bienvenido al Editor UML!
        </h4>
        <p className="text-xs text-blue-600 dark:text-blue-500 mb-2">
          Para empezar a trabajar con tu diagrama:
        </p>
        <ol className="text-xs text-blue-600 dark:text-blue-500 space-y-1">
          <li>1. Crea clases usando el botón "Class"</li>
          <li>2. Haz clic en las clases para editarlas</li>
          <li>3. Usa las relaciones para conectar clases</li>
          <li>4. Guarda tu trabajo frecuentemente</li>
        </ol>
      </div>
      
      {/* Basic Tools */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-blue-700 mb-3">Herramientas</h3>
        <div className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "ghost"}
                className="w-full justify-start !bg-slate-100 !text-slate-700 !border-slate-300 hover:!bg-slate-200 hover:!border-slate-400"
                onClick={() => {
                  onToolSelect(tool.id);
                  if (tool.id === 'class') {
                    onAddClass();
                  }
                }}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tool.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Relationships */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-blue-700 mb-3">Relationships</h3>
        <div className="space-y-2">
          {relationships.map((relationship) => {
            const Icon = relationship.icon;
            return (
              <Button
                key={relationship.id}
                variant={selectedTool === relationship.id ? "default" : "ghost"}
                className="w-full justify-start !bg-slate-100 !text-slate-700 !border-slate-300 hover:!bg-slate-200 hover:!border-slate-400"
                // className="w-full justify-start"
                onClick={() => onToolSelect(relationship.id)}
              >
                <Icon className={`h-4 w-4 mr-2 ${relationship.style}`} />
                {relationship.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-auto">
        <h3 className="text-sm font-medium text-blue-700 mb-3">Legend</h3>
        <div className="space-y-2 text-xs text-blue-600">
          <div className="flex items-center">
            <ArrowRight className="h-3 w-3 mr-2 stroke-gray-600" />
            <span>Asociación</span>
          </div>
          <div className="flex items-center">
            <Network className="h-3 w-3 mr-2 stroke-purple-600" />
            <span>Muchos a Muchos</span>
          </div>
          <div className="flex items-center">
            <Triangle className="h-3 w-3 mr-2 stroke-blue-600" />
            <span>Herencia</span>
          </div>
          <div className="flex items-center">
            <Diamond className="h-3 w-3 mr-2 stroke-black" />
            <span>Composición</span>
          </div>
          <div className="flex items-center">
            <Hexagon className="h-3 w-3 mr-2 stroke-green-600" />
            <span>Agregación</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-500">
        <p className="font-medium mb-1">Como usar:</p>
        <ul className="space-y-1">
          <li>• Selecciona una herramienta y haz clic en el lienzo</li>
          <li>• Haz clic en la clase para editar propiedades</li>
          <li>• Arrastra desde los controladores para crear relaciones</li>
        </ul>
      </div>
    </div>
  );
};