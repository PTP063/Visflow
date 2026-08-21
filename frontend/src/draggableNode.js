// draggableNode.js

export const DraggableNode = ({ type, label, icon, category, accent }) => {
  const onDragStart = (event, nodeType) => {
    const appData = { nodeType };
    event.target.style.cursor = 'grabbing';
    event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="draggable-node"
      style={{ '--node-accent': accent || '#6366f1' }}
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={(event) => (event.target.style.cursor = 'grab')}
      draggable
      title={`Drag to add ${label} node`}
    >
      <div className="draggable-node-icon-wrap" style={{ background: `${accent || '#6366f1'}20` }}>
        <span className="draggable-node-icon">{icon}</span>
      </div>
      <div className="draggable-node-info">
        <span className="draggable-node-label">{label}</span>
        {category && <span className="draggable-node-category">{category}</span>}
      </div>
    </div>
  );
};

