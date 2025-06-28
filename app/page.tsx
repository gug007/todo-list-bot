'use client';

import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        sendData: (data: string) => void;
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
        close: () => void;
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        initData: string;
        initDataUnsafe: {
          user?: {
            first_name?: string;
            last_name?: string;
            username?: string;
            id?: number;
          };
          chat?: object;
          auth_date?: number;
          query_id?: string;
        };
        version: string;
        platform: string;
        colorScheme: string;
        themeParams: object;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        expand: () => void;
      };
    };
  }
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState('');
  const [isInlineMode, setIsInlineMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Parse URL parameters on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const editMode = urlParams.get('edit') === 'true';
      const content = urlParams.get('content');
      const userIdParam = urlParams.get('userId');
      
      console.log('URL parsing:', { editMode, content, userId: userIdParam, url: window.location.search });
      
      if (editMode && content) {
        console.log('Setting edit mode with content:', decodeURIComponent(content));
        setIsEditMode(true);
        setOriginalContent(decodeURIComponent(content));
        setMessage(decodeURIComponent(content));
      }
      
      if (userIdParam) {
        setUserId(userIdParam);
        console.log('Found userId in URL:', userIdParam);
      }
    }
  }, []);

  const sendMessage = useCallback(async () => {
    console.log('sendMessage called', { message: message.trim(), isEditMode, isInlineMode });
    
    if (message.trim()) {
      try {
        if (isEditMode) {
          console.log('Edit mode: attempting multiple update methods');
          
          // Method 1: Try the standard Telegram WebApp sendData if available
          if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            console.log('Method 1: Sending data via Telegram WebApp');
            tg.sendData(message.trim());
          }
          
          // Method 2: Try direct API call as fallback
          try {
            console.log('Method 2: Sending direct API call');
                         const response = await fetch('/api/update-todo', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
               },
               body: JSON.stringify({
                 content: message.trim(),
                 originalContent: originalContent,
                 userId: userId,
                 initData: window.Telegram?.WebApp?.initData || '',
               }),
             });
            
            const result = await response.json();
            console.log('Direct API response:', result);
            
            if (result.success) {
              // Success feedback
              setError('✅ Todo updated successfully!');
              setTimeout(() => setError(''), 2000);
            }
          } catch (apiError) {
            console.error('Direct API call failed:', apiError);
          }
          
          // Close the mini app after sending
          setTimeout(() => {
            console.log('Closing mini app');
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.close();
            }
          }, 500);
          
        } else if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          
          if (isInlineMode) {
            console.log('Inline mode: switching query');
            // For inline mode, use switchInlineQuery
            tg.switchInlineQuery(message.trim(), ['users', 'groups', 'channels']);
          } else {
            console.log('Regular mode: sending data');
            // For regular mini apps, use sendData
            tg.sendData(message.trim());
          }
          
          setMessage(''); // Clear message after sending
        }
        
      } catch (err) {
        console.error('Error in sendMessage:', err);
        setError(`Failed to send: ${err}`);
      }
    } else {
      console.log('sendMessage: conditions not met', { 
        hasMessage: !!message.trim(), 
        hasTelegram: !!window.Telegram?.WebApp 
      });
    }
  }, [message, isInlineMode, isEditMode, originalContent, userId]);

  useEffect(() => {
    let mounted = true;
    
    const initTelegram = () => {
      try {
        if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
          return;
        }
        
        const tg = window.Telegram.WebApp;
        
        // Call ready() immediately
        tg.ready();
        
        // Expand the app
        try {
          tg.expand();
        } catch {
          // Ignore if not available
        }
        
        if (!mounted) return;
        
        // Check mode
        const hasQueryId = !!tg.initDataUnsafe?.query_id;
        setIsInlineMode(hasQueryId);
        setIsReady(true);
        
        // Basic setup, main button will be configured in separate effect
        // Just mark as ready here
        
      } catch (err) {
        if (mounted) {
          setError(`Initialization error: ${err}`);
        }
      }
    };

    // Multiple initialization attempts
    if (typeof window !== 'undefined') {
      // Immediate attempt
      initTelegram();
      
      // Fallback attempts
      const timers = [50, 100, 200, 500].map(delay => 
        setTimeout(initTelegram, delay)
      );
      
      return () => {
        mounted = false;
        timers.forEach(clearTimeout);
      };
    }

    return () => {
      mounted = false;
    };
  }, [sendMessage]); // Simplified dependencies since main button setup moved

  // Setup and update main button when ready and modes are detected
  useEffect(() => {
    console.log('Main button effect:', { isReady, isEditMode, messageLength: message.length, originalContent });
    
    if (isReady && window.Telegram?.WebApp?.MainButton) {
      const tg = window.Telegram.WebApp;
      const mainButton = tg.MainButton;
      
      // Determine mode and set button text
      const hasQueryId = !!tg.initDataUnsafe?.query_id;
      const currentIsInlineMode = hasQueryId && !isEditMode; // Don't treat edit mode as inline mode
      
      const buttonText = isEditMode 
        ? '💾 Update Todo' 
        : currentIsInlineMode 
          ? '🔄 Share in Chat' 
          : '📤 Send Message';
      
      console.log('Setting main button:', { buttonText, isEditMode, currentIsInlineMode });
      
      mainButton.text = buttonText;
      
      // Remove previous click handlers
      try {
        mainButton.offClick(sendMessage);
      } catch {
        // Ignore if not available
      }
      
      // Add new click handler
      mainButton.onClick(sendMessage);
      console.log('Main button click handler attached');
      
      // Show/hide based on conditions
      const shouldShow = message.trim() && (!isEditMode || message !== originalContent);
      console.log('Main button visibility:', { shouldShow, hasMessage: !!message.trim(), isEditMode, messageChanged: message !== originalContent });
      
      if (shouldShow) {
        mainButton.show();
      } else {
        mainButton.hide();
      }
    }
  }, [message, isReady, isEditMode, originalContent, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      sendMessage();
    }
  };

  return (
    <div className="w-screen h-screen p-4 bg-white dark:bg-gray-900">
      <div className="h-full flex flex-col gap-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
            {isEditMode 
              ? '✏️ Edit Todo' 
              : isInlineMode 
                ? '✍️ Create & Share Todo' 
                : '📝 Todo Editor'
            }
          </h1>
          
          {isEditMode && isReady && (
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              Edit your todo item
            </p>
          )}
          
          {isInlineMode && isReady && !isEditMode && (
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              Create your todo item and share it in the chat
            </p>
          )}
          
          {!isReady && (
            <p className="text-orange-500 text-sm">⏳ Loading...</p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">❌ {error}</p>
          </div>
        )}
        
        {/* Main editing area */}
        <div className="flex-1 flex flex-col gap-3">
          <textarea
            className="flex-1 w-full resize-none border-2 border-gray-300 dark:border-gray-600 rounded-xl outline-none p-4 text-lg bg-white dark:bg-gray-800 text-black dark:text-white focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            placeholder={
              isEditMode
                ? "✏️ Edit your todo item..."
                : isInlineMode 
                  ? "✍️ What todo would you like to create and share?" 
                  : "✍️ Enter your todo item..."
            }
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyPress}
            autoFocus
            style={{ minHeight: '200px' }}
          />
          
          {/* Character count and send button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {message.length} characters
              {isEditMode && (
                <div className="text-xs mt-1">
                  {message === originalContent 
                    ? "📝 No changes made" 
                    : "✏️ Modified"
                  }
                </div>
              )}
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!message.trim() || !isReady || (isEditMode && message === originalContent)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-600 transition-colors text-lg"
            >
              {isEditMode 
                ? '💾 Update Todo' 
                : isInlineMode 
                  ? '🔄 Share' 
                  : '📤 Send'
              }
            </button>
          </div>
        </div>
        
        {/* Tips */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
          {isReady ? (
            <p>💡 Press Cmd/Ctrl + Enter to send quickly</p>
          ) : (
            <p>🔄 Connecting to Telegram...</p>
          )}
        </div>
      </div>
    </div>
  );
}
