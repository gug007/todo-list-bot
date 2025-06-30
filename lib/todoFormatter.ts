// Todo symbols
export const TODO_SYMBOLS = {
  PENDING: '☐',
  COMPLETED: '✓',
  CANCELLED: '✗'
} as const;

// Format text to ensure each line starts with a todo symbol
export function formatTodoText(text: string): string {
  const lines = text.split('\n');
  return lines.map(line => {
    const trimmedLine = line.trim();
    
    // If line is empty, return empty
    if (!trimmedLine) return '';
    
    // Check if line already starts with a todo symbol
    const startsWithSymbol = Object.values(TODO_SYMBOLS).some(symbol => 
      trimmedLine.startsWith(symbol + ' ') || trimmedLine === symbol
    );
    
    if (startsWithSymbol) {
      return line;
    } else {
      // Add default pending symbol
      const leadingSpaces = line.match(/^\s*/)?.[0] || '';
      return leadingSpaces + TODO_SYMBOLS.PENDING + ' ' + trimmedLine;
    }
  }).join('\n');
}

// Toggle todo state for a line
export function toggleTodoState(line: string): string {
  const trimmedLine = line.trim();
  const leadingSpaces = line.match(/^\s*/)?.[0] || '';
  
  if (trimmedLine.startsWith(TODO_SYMBOLS.PENDING + ' ')) {
    return leadingSpaces + trimmedLine.replace(TODO_SYMBOLS.PENDING + ' ', TODO_SYMBOLS.COMPLETED + ' ');
  } else if (trimmedLine.startsWith(TODO_SYMBOLS.COMPLETED + ' ')) {
    return leadingSpaces + trimmedLine.replace(TODO_SYMBOLS.COMPLETED + ' ', TODO_SYMBOLS.CANCELLED + ' ');
  } else if (trimmedLine.startsWith(TODO_SYMBOLS.CANCELLED + ' ')) {
    return leadingSpaces + trimmedLine.replace(TODO_SYMBOLS.CANCELLED + ' ', TODO_SYMBOLS.PENDING + ' ');
  } else if (trimmedLine === TODO_SYMBOLS.PENDING) {
    return leadingSpaces + TODO_SYMBOLS.COMPLETED;
  } else if (trimmedLine === TODO_SYMBOLS.COMPLETED) {
    return leadingSpaces + TODO_SYMBOLS.CANCELLED;
  } else if (trimmedLine === TODO_SYMBOLS.CANCELLED) {
    return leadingSpaces + TODO_SYMBOLS.PENDING;
  }
  
  return line;
} 