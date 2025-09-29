import React from 'react';
import { 
  MousePointer, 
  Square, 
  ArrowRight, 
  Triangle, 
  Diamond,
  Hexagon,
  Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RelationType } from '@/types/uml';

interface UMLToolPanelProps {
  selectedTool: string;
  onToolSelect: (tool: string) => void;
  onAddClass: () => void;
}

const tools = [
  {
    id: 'select',
    name: 'Select',
    icon: MousePointer,
    description: 'Select and move elements'
  },
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
}) => {
  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">UML Tools</h2>
      
      {/* Basic Tools */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Basic Tools</h3>
        <div className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "ghost"}
                className="w-full justify-start"
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
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Relationships</h3>
        <div className="space-y-2">
          {relationships.map((relationship) => {
            const Icon = relationship.icon;
            return (
              <Button
                key={relationship.id}
                variant={selectedTool === relationship.id ? "default" : "ghost"}
                className="w-full justify-start"
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
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Legend</h3>
        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <ArrowRight className="h-3 w-3 mr-2 stroke-gray-600" />
            <span>Association</span>
          </div>
          <div className="flex items-center">
            <Network className="h-3 w-3 mr-2 stroke-purple-600" />
            <span>Many to Many</span>
          </div>
          <div className="flex items-center">
            <Triangle className="h-3 w-3 mr-2 stroke-blue-600" />
            <span>Inheritance</span>
          </div>
          <div className="flex items-center">
            <Diamond className="h-3 w-3 mr-2 stroke-black" />
            <span>Composition</span>
          </div>
          <div className="flex items-center">
            <Hexagon className="h-3 w-3 mr-2 stroke-green-600" />
            <span>Aggregation</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
        <p className="font-medium mb-1">How to use:</p>
        <ul className="space-y-1">
          <li>• Select a tool and click on canvas</li>
          <li>• Click on class to edit properties</li>
          <li>• Drag from handles to create relationships</li>
        </ul>
      </div>
    </div>
  );
};