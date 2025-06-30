import { toggleTodoState, TODO_SYMBOLS } from "../../lib/todoFormatter";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TodoItem {
  id: string;
  symbol: string;
  content: string;
  indentation: string;
}

interface DragCheckEditorProps {
  text: string;
  setText: (text: string) => void;
  setHasUserChanges: (hasChanges: boolean) => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

interface SortableTodoItemProps {
  item: TodoItem;
  onToggle: (itemId: string) => void;
}

function SortableTodoItem({ item, onToggle }: SortableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: item.indentation.length * 16,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => onToggle(item.id)}
        className="flex-shrink-0 text-lg hover:scale-110 transition-transform"
      >
        {item.symbol}
      </button>
      <span
        className={`flex-1 ${
          item.symbol === TODO_SYMBOLS.COMPLETED
            ? "line-through text-gray-500"
            : item.symbol === TODO_SYMBOLS.CANCELLED
            ? "line-through text-red-500"
            : "text-gray-800"
        }`}
      >
        {item.content || "Empty task"}
      </span>
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing px-2 py-1 rounded hover:bg-gray-100"
      >
        ⋮⋮
      </div>
    </div>
  );
}

export default function DragCheckEditor({ text, setText, setHasUserChanges, onDragStateChange }: DragCheckEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Parse text into todo items
  const parseTodoItems = (text: string): TodoItem[] => {
    const lines = text.split("\n");
    return lines
      .map((line, index) => {
        if (!line.trim()) return null;
        
        const indentation = line.match(/^\s*/)?.[0] || "";
        const trimmedLine = line.trim();
        
        // Find symbol and content
        const symbolMatch = Object.values(TODO_SYMBOLS).find(symbol => 
          trimmedLine.startsWith(symbol + " ") || trimmedLine === symbol
        );
        
        if (symbolMatch) {
          const content = trimmedLine.startsWith(symbolMatch + " ") 
            ? trimmedLine.substring(symbolMatch.length + 1)
            : "";
          
          return {
            id: `todo-${index}`,
            symbol: symbolMatch,
            content,
            indentation
          };
        }
        
        return {
          id: `todo-${index}`,
          symbol: TODO_SYMBOLS.PENDING,
          content: trimmedLine,
          indentation
        };
      })
      .filter(Boolean) as TodoItem[];
  };

  // Convert todo items back to text
  const todoItemsToText = (items: TodoItem[]): string => {
    return items
      .map(item => `${item.indentation}${item.symbol}${item.content ? " " + item.content : ""}`)
      .join("\n");
  };

  const handleToggleTodo = (itemId: string) => {
    const items = parseTodoItems(text);
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const currentLine = `${item.indentation}${item.symbol}${item.content ? " " + item.content : ""}`;
        const toggledLine = toggleTodoState(currentLine);
        const newIndentation = toggledLine.match(/^\s*/)?.[0] || "";
        const newTrimmed = toggledLine.trim();
        const newSymbol = Object.values(TODO_SYMBOLS).find(symbol => 
          newTrimmed.startsWith(symbol + " ") || newTrimmed === symbol
        ) || TODO_SYMBOLS.PENDING;
        const newContent = newTrimmed.startsWith(newSymbol + " ") 
          ? newTrimmed.substring(newSymbol.length + 1)
          : "";
        
        return {
          ...item,
          symbol: newSymbol,
          content: newContent,
          indentation: newIndentation
        };
      }
      return item;
    });
    
    const newText = todoItemsToText(updatedItems);
    setText(newText);
    setHasUserChanges(true);
  };

  const handleDragStart = () => {
    // Notify parent that dragging has started
    onDragStateChange?.(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Notify parent that dragging has ended
    onDragStateChange?.(false);

    if (active.id !== over?.id) {
      const items = parseTodoItems(text);
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over?.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      const newText = todoItemsToText(newItems);
      setText(newText);
      setHasUserChanges(true);
    }
  };

  const addNewTodo = () => {
    const newText = text + (text ? "\n" : "") + TODO_SYMBOLS.PENDING + " ";
    setText(newText);
    setHasUserChanges(true);
  };

  const todoItems = parseTodoItems(text);

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 max-w-2xl mx-auto">
        <div className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={todoItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
              {todoItems.map((item) => (
                <SortableTodoItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggleTodo}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          {todoItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No todo items yet. Click &quot;Add Todo&quot; to get started.
            </div>
          )}
          
          <button
            onClick={addNewTodo}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            + Add Todo
          </button>
        </div>
      </div>
    </div>
  );
} 