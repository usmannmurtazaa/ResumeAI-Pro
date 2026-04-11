import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { FiMove } from 'react-icons/fi';

const ItemTypes = {
  SECTION: 'section',
};

export const DraggableSection = ({ id, index, moveSection, children }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SECTION,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.SECTION,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveSection(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative cursor-move"
    >
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 text-gray-400">
        <FiMove className="w-4 h-4" />
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
};

export const DragDropContainer = ({ children, onReorder }) => {
  const moveSection = (fromIndex, toIndex) => {
    const updatedChildren = [...children];
    const [movedItem] = updatedChildren.splice(fromIndex, 1);
    updatedChildren.splice(toIndex, 0, movedItem);
    onReorder?.(updatedChildren);
  };

  return (
    <div className="space-y-4">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return (
            <DraggableSection
              key={child.key || index}
              id={index}
              index={index}
              moveSection={moveSection}
            >
              {child}
            </DraggableSection>
          );
        }
        return child;
      })}
    </div>
  );
};