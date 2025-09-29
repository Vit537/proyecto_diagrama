import React, { useMemo, useState } from "react";

export type NodeTemplate = {
  name: string;
  schema: { title: string; type: string }[];
};

type SidebarProps = {
  nodes: any[];
  // onAddTable now receives full node data: { label, schema }
  onAddTable: (nodeData: { label: string; schema: { title: string; type: string }[] }) => void;
  onCreateRelation: (edge: any) => void;
  onUpdateNode: (id: string, data: any) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ nodes, onAddTable, onCreateRelation, onUpdateNode }) => {
  const templates: NodeTemplate[] = [
    {
      name: "Products",
      schema: [
        { title: "id", type: "uuid" },
        { title: "name", type: "varchar" },
        { title: "description", type: "varchar" },
        { title: "warehouse_id", type: "uuid" },
        { title: "supplier_id", type: "uuid" },
        { title: "price", type: "money" },
        { title: "quantity", type: "int4" },
      ],
    },
    {
      name: "Warehouses",
      schema: [
        { title: "id", type: "uuid" },
        { title: "name", type: "varchar" },
        { title: "address", type: "varchar" },
        { title: "capacity", type: "int4" },
      ],
    },
    {
      name: "Suppliers",
      schema: [
        { title: "id", type: "uuid" },
        { title: "name", type: "varchar" },
        { title: "description", type: "varchar" },
        { title: "country", type: "varchar" },
      ],
    },
  ];

  const relationshipTypes = ["one-to-many", "one-to-one", "many-to-many"];

  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0].name);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTableName, setNewTableName] = useState<string>(templates[0].name);
  const [newTableAttrs, setNewTableAttrs] = useState<string>("id:uuid\nname:varchar");

  // Relation form state
  const [sourceNode, setSourceNode] = useState<string>(nodes?.[0]?.id ?? "");
  const [targetNode, setTargetNode] = useState<string>(nodes?.[1]?.id ?? "");
  const [sourceHandle, setSourceHandle] = useState<string>("");
  const [targetHandle, setTargetHandle] = useState<string>("");
  const [relationType, setRelationType] = useState<string>(relationshipTypes[0]);

  // derive available handles for selected nodes
  const sourceHandles = useMemo(() => {
    const n = nodes.find((x: any) => x.id === sourceNode);
    return n?.data?.schema?.map((s: any) => s.title) ?? [];
  }, [nodes, sourceNode]);

  const targetHandles = useMemo(() => {
    const n = nodes.find((x: any) => x.id === targetNode);
    return n?.data?.schema?.map((s: any) => s.title) ?? [];
  }, [nodes, targetNode]);

  const handleAdd = () => {
    // open the add form
    setNewTableName(selectedTemplate);
    setNewTableAttrs(templates.find((t) => t.name === selectedTemplate)?.schema.map((s) => `${s.title}:${s.type}`).join('\n') ?? "");
    setShowAddForm(true);
  };

  const handleConfirmAdd = () => {
    const schema = newTableAttrs
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, type] = line.split(":").map((s) => s.trim());
        return { title, type: type ?? "varchar" };
      });

    onAddTable({ label: newTableName, schema });
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  const handleCreateRelation = () => {
    if (!sourceNode || !targetNode || !sourceHandle || !targetHandle) return;
    const edge = {
      id: `${sourceNode}-${targetNode}-${sourceHandle}-${targetHandle}-${Date.now()}`,
      source: sourceNode,
      target: targetNode,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      data: { relationType },
    };
    onCreateRelation(edge);
  };

  return (
    <aside className="p-4 border-r h-full" style={{ width: 300 }}>
      <h3 className="text-lg font-semibold mb-2">Table templates</h3>
      <div className="mb-4">
        <select
          className="w-full mb-2 p-2 border rounded"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          {templates.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        <button className="w-full bg-blue-500 text-white p-2 rounded" onClick={handleAdd}>
          Add table
        </button>

        {showAddForm && (
          <div className="mt-3 p-3 border rounded bg-gray-50">
            <label className="block text-sm mb-1">Table name</label>
            <input className="w-full p-2 border rounded mb-2" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} />
            <label className="block text-sm mb-1">Attributes (one per line, format: name:type)</label>
            <textarea className="w-full p-2 border rounded mb-2" rows={6} value={newTableAttrs} onChange={(e) => setNewTableAttrs(e.target.value)} />
            <div className="flex gap-2">
              <button className="flex-1 bg-green-600 text-white p-2 rounded" onClick={handleConfirmAdd}>
                Confirm add
              </button>
              <button className="flex-1 bg-gray-300 p-2 rounded" onClick={handleCancelAdd}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <hr className="my-4" />

  <h3 className="text-lg font-semibold mb-2">Create relationship</h3>
      <div className="space-y-2">
        <hr className="my-4" />
        <h4 className="text-md font-semibold">Edit existing table</h4>
        <div className="mb-2">
          <select className="w-full p-2 border rounded" onChange={(e) => {
            const id = e.target.value;
            setSourceNode(id);
            setTargetNode(id);
          }}>
            <option value="">-- select node to edit --</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>{n.data?.label ?? n.id}</option>
            ))}
          </select>
        </div>
        <div className="mb-2 border p-2 rounded bg-white">
          <label className="block text-sm">Selected node name</label>
          <input className="w-full p-2 border rounded mb-2" value={nodes.find(n => n.id === sourceNode)?.data?.label ?? ""} onChange={() => {}} disabled />
          <p className="text-xs text-gray-500">To edit a node, pick it above then use the `Edit` button to open a dedicated editor (inline simple editor available below).</p>
        </div>
        
        <details className="p-2 border rounded bg-gray-50">
          <summary className="cursor-pointer font-medium">Inline edit selected node</summary>
          <InlineNodeEditor nodes={nodes} selectedId={sourceNode} onUpdateNode={(id: string, data: any) => onUpdateNode && onUpdateNode(id, data)} />
        </details>

        <label className="block text-sm">Source node</label>
        <select className="w-full p-2 border rounded" value={sourceNode} onChange={(e) => setSourceNode(e.target.value)}>
          <option value="">-- select source --</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.data?.label ?? n.id}
            </option>
          ))}
        </select>

        <label className="block text-sm">Source field (handle)</label>
        <select className="w-full p-2 border rounded" value={sourceHandle} onChange={(e) => setSourceHandle(e.target.value)}>
          <option value="">-- select handle --</option>
          {sourceHandles.map((h: string) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <label className="block text-sm">Target node</label>
        <select className="w-full p-2 border rounded" value={targetNode} onChange={(e) => setTargetNode(e.target.value)}>
          <option value="">-- select target --</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.data?.label ?? n.id}
            </option>
          ))}
        </select>

        <label className="block text-sm">Target field (handle)</label>
        <select className="w-full p-2 border rounded" value={targetHandle} onChange={(e) => setTargetHandle(e.target.value)}>
          <option value="">-- select handle --</option>
          {targetHandles.map((h: string) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <label className="block text-sm">Relationship</label>
        <select className="w-full p-2 border rounded" value={relationType} onChange={(e) => setRelationType(e.target.value)}>
          {relationshipTypes.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button className="w-full bg-green-600 text-white p-2 rounded mt-2" onClick={handleCreateRelation}>
          Create relation
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

// Simple inline editor component (kept in same file for brevity)
function InlineNodeEditor({ nodes, selectedId, onUpdateNode }: { nodes: any[]; selectedId: string; onUpdateNode: (id: string, data: any) => void }) {
  const node = nodes.find((n) => n.id === selectedId);
  const [name, setName] = useState<string>(node?.data?.label ?? "");
  const [attrs, setAttrs] = useState<string>((node?.data?.schema ?? []).map((s: any) => `${s.title}:${s.type}`).join('\n'));

  React.useEffect(() => {
    setName(node?.data?.label ?? "");
    setAttrs((node?.data?.schema ?? []).map((s: any) => `${s.title}:${s.type}`).join('\n'));
  }, [selectedId, node]);

  const handleSave = () => {
    const schema = attrs
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, type] = line.split(":").map((s) => s.trim());
        return { title, type: type ?? "varchar" };
      });
    onUpdateNode(selectedId, { label: name, schema });
  };

  if (!selectedId) return <div className="text-sm text-gray-500">No node selected</div>;

  return (
    <div className="mt-2">
      <label className="block text-sm">Name</label>
      <input className="w-full p-2 border rounded mb-2" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="block text-sm">Attributes (name:type per line)</label>
      <textarea className="w-full p-2 border rounded mb-2" rows={5} value={attrs} onChange={(e) => setAttrs(e.target.value)} />
      <div className="flex gap-2">
        <button className="flex-1 bg-blue-600 text-white p-2 rounded" onClick={handleSave}>Save</button>
      </div>
    </div>
  );
}
