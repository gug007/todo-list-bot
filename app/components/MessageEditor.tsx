import { useState, useEffect } from "react";
import { formatTodoText } from "../../lib/todoFormatter";
import TextEditor from "./TextEditor";
import DragCheckEditor from "./DragCheckEditor";

interface MessageEditorProps {
  text: string;
  setText: (text: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  onDragStateChange?: (isDragging: boolean) => void;
}

export default function MessageEditor({
  text,
  setText,
  onSubmit,
  disabled,
  onDragStateChange,
}: MessageEditorProps) {
  const [localText, setLocalText] = useState(() => formatTodoText(text));
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "drag">("text");

  // Debounce effect
  useEffect(() => {
    console.log(localText, text);
    if (localText !== text && hasUserChanges) {
      setIsUpdating(true);
      const timeoutId = setTimeout(() => {
        setText(localText);
        setIsUpdating(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [localText, setText, text, hasUserChanges]);

  // Update local text when prop changes
  useEffect(() => {
    setLocalText(formatTodoText(text));
  }, [text]);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Status bar with tabs */}
      <div className="h-12 flex items-center justify-between px-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <div className="flex border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setActiveTab("text")}
              className={`px-3 py-1 text-sm font-medium ${
                activeTab === "text"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Text Editor
            </button>
            <button
              onClick={() => setActiveTab("drag")}
              className={`px-3 py-1 text-sm font-medium ${
                activeTab === "drag"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Drag &amp; Check
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isUpdating && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          )}
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            disabled={disabled}
          >
            Save
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "text" ? (
        <TextEditor 
          text={localText}
          setText={setLocalText}
          setHasUserChanges={setHasUserChanges}
        />
      ) : (
        <DragCheckEditor 
          text={localText}
          setText={setLocalText}
          setHasUserChanges={setHasUserChanges}
          onDragStateChange={onDragStateChange}
        />
      )}
    </div>
  );
}
