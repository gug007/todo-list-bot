import { useState, useEffect } from "react";

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
  const [localText, setLocalText] = useState(text);
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
    setLocalText(text);
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
    setHasUserChanges(true);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Status bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-white border-b">
        <h1 className="text-lg font-medium text-gray-800">Edit Message</h1>
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
        className="flex-1 p-4 text-base resize-none focus:outline-none"
        value={localText}
        onChange={handleTextChange}
        placeholder="Start typing your message..."
      />
    </div>
  );
}
