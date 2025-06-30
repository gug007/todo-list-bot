import { useState } from "react";
import { toggleTodoState, TODO_SYMBOLS } from "../../lib/todoFormatter";

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
}

export default function DragCheckEditor({ text, setText, setHasUserChanges }: DragCheckEditorProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItemId) return;
    
    const items = parseTodoItems(text);
    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetItemId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newItems = [...items];
    const [draggedTodo] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedTodo);
    
    const newText = todoItemsToText(newItems);
    setText(newText);
    setHasUserChanges(true);
    setDraggedItem(null);
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
          {todoItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={`flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-move hover:shadow-sm transition-shadow ${
                draggedItem === item.id ? "opacity-50" : ""
              }`}
              style={{ marginLeft: item.indentation.length * 16 }}
            >
              <button
                onClick={() => handleToggleTodo(item.id)}
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
              <div className="flex-shrink-0 text-gray-400">
                ⋮⋮
              </div>
            </div>
          ))}
          
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