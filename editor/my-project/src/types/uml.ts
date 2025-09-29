export type UMLAttribute = {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected' | 'package';
};

export type UMLMethod = {
  name: string;
  returnType: string;
  parameters: { name: string; type: string }[];
  visibility: 'public' | 'private' | 'protected' | 'package';
};

export type UMLClassData = {
  className: string;
  attributes: UMLAttribute[];
  methods: UMLMethod[];
};

export type RelationType = 'association' | 'inheritance' | 'composition' | 'aggregation' | 'many-to-many';

export type Multiplicity = '1' | '*' | '0..1' | '1..*' | '0..*' | 'custom';

export type UMLEdgeData = {
  relationType: RelationType;
  sourceMultiplicity?: Multiplicity;
  targetMultiplicity?: Multiplicity;
  label?: string;
};