import React, { useState } from 'react';
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
import type { Multiplicity, UMLEdgeData } from '@/types/uml';

interface MultiplicityEditorProps {
  isOpen: boolean;
  onClose: () => void;
  edgeData: UMLEdgeData;
  onSave: (data: UMLEdgeData) => void;
}

const multiplicityOptions: { value: Multiplicity; label: string }[] = [
  { value: '1', label: '1 (exactly one)' },
  { value: '*', label: '* (zero or more)' },
  { value: '0..1', label: '0..1 (zero or one)' },
  { value: '1..*', label: '1..* (one or more)' },
  { value: '0..*', label: '0..* (zero or more)' },
  { value: 'custom', label: 'Custom' },
];

export const MultiplicityEditor: React.FC<MultiplicityEditorProps> = ({
  isOpen,
  onClose,
  edgeData,
  onSave,
}) => {
  const [editingData, setEditingData] = useState<UMLEdgeData>(edgeData);
  const [customSourceMultiplicity, setCustomSourceMultiplicity] = useState('');
  const [customTargetMultiplicity, setCustomTargetMultiplicity] = useState('');

  const handleSave = () => {
    const finalData = { ...editingData };
    
    // Handle custom multiplicities
    if (editingData.sourceMultiplicity === 'custom') {
      finalData.sourceMultiplicity = customSourceMultiplicity as Multiplicity;
    }
    if (editingData.targetMultiplicity === 'custom') {
      finalData.targetMultiplicity = customTargetMultiplicity as Multiplicity;
    }
    
    onSave(finalData);
    onClose();
  };

  const isAssociation = edgeData.relationType === 'association' || (edgeData as any).relationship === 'association';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Relationship</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Relationship Label */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Relationship Label (optional)
            </label>
            <Input
              value={editingData.label || ''}
              onChange={(e) => setEditingData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Enter relationship label"
            />
          </div>

          {/* Multiplicities - only for association */}
          {isAssociation && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Source Multiplicity
                </label>
                <Select
                  value={editingData.sourceMultiplicity || '1'}
                  onValueChange={(value) => setEditingData(prev => ({ 
                    ...prev, 
                    sourceMultiplicity: value as Multiplicity 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {multiplicityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {editingData.sourceMultiplicity === 'custom' && (
                  <Input
                    className="mt-2"
                    value={customSourceMultiplicity}
                    onChange={(e) => setCustomSourceMultiplicity(e.target.value)}
                    placeholder="Enter custom multiplicity (e.g., 2..5)"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Target Multiplicity
                </label>
                <Select
                  value={editingData.targetMultiplicity || '1'}
                  onValueChange={(value) => setEditingData(prev => ({ 
                    ...prev, 
                    targetMultiplicity: value as Multiplicity 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {multiplicityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {editingData.targetMultiplicity === 'custom' && (
                  <Input
                    className="mt-2"
                    value={customTargetMultiplicity}
                    onChange={(e) => setCustomTargetMultiplicity(e.target.value)}
                    placeholder="Enter custom multiplicity (e.g., 2..5)"
                  />
                )}
              </div>
            </>
          )}

          {/* Info for non-association relationships */}
          {!isAssociation && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p>
                Multiplicity is only configurable for Association relationships. 
                {(edgeData.relationType === 'inheritance' || (edgeData as any).relationship === 'inheritance') && ' Inheritance represents an "is-a" relationship.'}
                {(edgeData.relationType === 'composition' || (edgeData as any).relationship === 'composition') && ' Composition represents a strong "part-of" relationship.'}
                {(edgeData.relationType === 'aggregation' || (edgeData as any).relationship === 'aggregation') && ' Aggregation represents a weak "part-of" relationship.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};