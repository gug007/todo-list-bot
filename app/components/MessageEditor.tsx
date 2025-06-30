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
      {/* Minimal header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        {/* Simple tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("text")}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === "text"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setActiveTab("drag")}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === "drag"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Drag
          </button>
        </div>

        {/* Minimal save area */}
        <div className="flex items-center gap-3">
          {isUpdating && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          <button
            onClick={onSubmit}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
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
