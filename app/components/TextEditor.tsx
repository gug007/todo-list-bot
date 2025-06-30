import { formatTodoText, toggleTodoState, TODO_SYMBOLS } from "../../lib/todoFormatter";

interface TextEditorProps {
  text: string;
  setText: (text: string) => void;
  setHasUserChanges: (hasChanges: boolean) => void;
}

export default function TextEditor({ text, setText, setHasUserChanges }: TextEditorProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const formattedText = formatTodoText(newText);
    setText(formattedText);
    setHasUserChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    // Handle Enter key to add new todo item
    if (e.key === "Enter") {
      e.preventDefault();
      const cursorPosition = textarea.selectionStart;
      const beforeCursor = text.substring(0, cursorPosition);
      const afterCursor = text.substring(cursorPosition);

      const newText =
        beforeCursor + "\n" + TODO_SYMBOLS.PENDING + " " + afterCursor;
      setText(newText);
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
      const lines = text.split("\n");
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

      setText(newLines.join("\n"));
      setHasUserChanges(true);
    }
  };

  return (
    <textarea
      className="flex-1 p-4 text-base resize-none focus:outline-none font-mono"
      value={text}
      onChange={handleTextChange}
      onKeyDown={handleKeyDown}
      placeholder="Start typing your todo items..."
    />
  );
} 