import { useState, useEffect } from "react";
import {
  formatTodoText,
  toggleTodoState,
  TODO_SYMBOLS,
} from "../../lib/todoFormatter";

interface MessageEditorProps {
  text: string;
  setText: (text: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export default function MessageEditor({
  text,
  setText,
  onSubmit,
  disabled,
}: MessageEditorProps) {
  const [localText, setLocalText] = useState(() => formatTodoText(text));
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState(false);

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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const formattedText = formatTodoText(newText);
    setLocalText(formattedText);
    setHasUserChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    // Handle Enter key to add new todo item
    if (e.key === "Enter") {
      e.preventDefault();
      const cursorPosition = textarea.selectionStart;
      const beforeCursor = localText.substring(0, cursorPosition);
      const afterCursor = localText.substring(cursorPosition);

      const newText =
        beforeCursor + "\n" + TODO_SYMBOLS.PENDING + " " + afterCursor;
      setLocalText(newText);
      setHasUserChanges(true);

      // Set cursor position after the new todo symbol
      setTimeout(() => {
        const newCursorPosition = cursorPosition + 3; // '\n' + symbol + ' '
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }

    // Handle Ctrl/Cmd + D to toggle todo state of current line
    if ((e.ctrlKey || e.metaKey) && e.key === "d") {
      e.preventDefault();
      const cursorPosition = textarea.selectionStart;
      const lines = localText.split("\n");
      let currentLineIndex = 0;
      let charCount = 0;

      // Find which line the cursor is on
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= cursorPosition) {
          currentLineIndex = i;
          break;
        }
        charCount += lines[i].length + 1; // +1 for newline character
      }

      // Toggle the current line
      const toggledLine = toggleTodoState(lines[currentLineIndex]);
      const newLines = [...lines];
      newLines[currentLineIndex] = toggledLine;

      setLocalText(newLines.join("\n"));
      setHasUserChanges(true);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Status bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-white border-b">
        <h1 className="text-lg font-medium text-gray-800">Edit Todo List</h1>
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

      {/* Full screen textarea */}
      <textarea
        className="flex-1 p-4 text-base resize-none focus:outline-none font-mono"
        value={localText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder="Start typing your todo items..."
      />
    </div>
  );
}
