import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UMLClassData, UMLAttribute, UMLMethod } from '@/types/uml';

interface UMLClassEditorProps {
  isOpen: boolean;
  onClose: () => void;
  classData: UMLClassData;
  onSave: (data: UMLClassData) => void;
}

const visibilityOptions = [
  { value: 'public', label: 'Public (+)' },
  { value: 'private', label: 'Private (-)' },
  { value: 'protected', label: 'Protected (#)' },
  { value: 'package', label: 'Package (~)' },
];

const commonTypes = [
  'String', 'int', 'double', 'boolean', 'void', 'Object', 'List', 'Array', 'Date', 'Long', 'Float'
];

export const UMLClassEditor: React.FC<UMLClassEditorProps> = ({
  isOpen,
  onClose,
  classData,
  onSave,
}) => {
  const [editingData, setEditingData] = useState<UMLClassData>(classData);

  useEffect(() => {
    setEditingData(classData);
  }, [classData]);

  const handleAddAttribute = () => {
    const newAttribute: UMLAttribute = {
      name: 'newAttribute',
      type: 'String',
      visibility: 'private',
    };
    setEditingData(prev => ({
      ...prev,
      attributes: [...prev.attributes, newAttribute],
    }));
  };

  const handleRemoveAttribute = (index: number) => {
    setEditingData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateAttribute = (index: number, field: keyof UMLAttribute, value: string) => {
    setEditingData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      ),
    }));
  };

  const handleAddMethod = () => {
    const newMethod: UMLMethod = {
      name: 'newMethod',
      returnType: 'void',
      parameters: [],
      visibility: 'public',
    };
    setEditingData(prev => ({
      ...prev,
      methods: [...prev.methods, newMethod],
    }));
  };

  const handleRemoveMethod = (index: number) => {
    setEditingData(prev => ({
      ...prev,
      methods: prev.methods.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateMethod = (index: number, field: keyof UMLMethod, value: any) => {
    setEditingData(prev => ({
      ...prev,
      methods: prev.methods.map((method, i) =>
        i === index ? { ...method, [field]: value } : method
      ),
    }));
  };

  const handleAddParameter = (methodIndex: number) => {
    const newParameter = { name: 'param', type: 'String' };
    setEditingData(prev => ({
      ...prev,
      methods: prev.methods.map((method, i) =>
        i === methodIndex
          ? { ...method, parameters: [...method.parameters, newParameter] }
          : method
      ),
    }));
  };

  const handleRemoveParameter = (methodIndex: number, paramIndex: number) => {
    setEditingData(prev => ({
      ...prev,
      methods: prev.methods.map((method, i) =>
        i === methodIndex
          ? { ...method, parameters: method.parameters.filter((_, pi) => pi !== paramIndex) }
          : method
      ),
    }));
  };

  const handleUpdateParameter = (methodIndex: number, paramIndex: number, field: 'name' | 'type', value: string) => {
    setEditingData(prev => ({
      ...prev,
      methods: prev.methods.map((method, i) =>
        i === methodIndex
          ? {
              ...method,
              parameters: method.parameters.map((param, pi) =>
                pi === paramIndex ? { ...param, [field]: value } : param
              ),
            }
          : method
      ),
    }));
  };

  const handleSave = () => {
    onSave(editingData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit UML Class</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Class Name</label>
            <Input
              value={editingData.className}
              onChange={(e) => setEditingData(prev => ({ ...prev, className: e.target.value }))}
              placeholder="Enter class name"
            />
          </div>

          {/* Attributes Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Attributes</h3>
              <Button onClick={handleAddAttribute} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Attribute
              </Button>
            </div>
            
            <div className="space-y-3">
              {editingData.attributes.map((attr, index) => (
                <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                  <Select
                    value={attr.visibility}
                    onValueChange={(value) => handleUpdateAttribute(index, 'visibility', value as any)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {visibilityOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={attr.name}
                    onChange={(e) => handleUpdateAttribute(index, 'name', e.target.value)}
                    placeholder="Attribute name"
                    className="flex-1"
                  />
                  
                  <Select
                    value={attr.type}
                    onValueChange={(value) => handleUpdateAttribute(index, 'type', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {commonTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={() => handleRemoveAttribute(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Methods Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Methods</h3>
              <Button onClick={handleAddMethod} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Method
              </Button>
            </div>
            
            <div className="space-y-4">
              {editingData.methods.map((method, methodIndex) => (
                <div key={methodIndex} className="p-4 border rounded-lg space-y-3">
                  <div className="flex gap-2 items-center">
                    <Select
                      value={method.visibility}
                      onValueChange={(value) => handleUpdateMethod(methodIndex, 'visibility', value as any)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {visibilityOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      value={method.name}
                      onChange={(e) => handleUpdateMethod(methodIndex, 'name', e.target.value)}
                      placeholder="Method name"
                      className="flex-1"
                    />
                    
                    <Select
                      value={method.returnType}
                      onValueChange={(value) => handleUpdateMethod(methodIndex, 'returnType', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {commonTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      onClick={() => handleRemoveMethod(methodIndex)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Parameters */}
                  <div className="ml-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Parameters</label>
                      <Button
                        onClick={() => handleAddParameter(methodIndex)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Parameter
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {method.parameters.map((param, paramIndex) => (
                        <div key={paramIndex} className="flex gap-2 items-center">
                          <Input
                            value={param.name}
                            onChange={(e) => handleUpdateParameter(methodIndex, paramIndex, 'name', e.target.value)}
                            placeholder="Parameter name"
                            className="flex-1"
                          />
                          <Select
                            value={param.type}
                            onValueChange={(value) => handleUpdateParameter(methodIndex, paramIndex, 'type', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {commonTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => handleRemoveParameter(methodIndex, paramIndex)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};