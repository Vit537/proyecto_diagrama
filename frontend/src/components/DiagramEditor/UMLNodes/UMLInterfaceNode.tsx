import React from 'react';
import UMLClassNode from './UMLClassNode';
import { DiagramElement } from '../../../types';

const UMLInterfaceNode: React.FC<any> = (props) => {
  // Interface nodes are essentially class nodes with interface styling
  return (
    <UMLClassNode
      {...props}
      isAbstract={false} // Interfaces have their own special styling
    />
  );
};

export default UMLInterfaceNode;
