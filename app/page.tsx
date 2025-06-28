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
          start_param?: string;
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

  // Function to get pre-filled text from URL params or Telegram Web App data
  const getPrefilledText = useCallback(() => {
    try {
      // First, try to get text from URL parameters
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const textParam = urlParams.get('text');
        if (textParam) {
          return decodeURIComponent(textParam);
        }
      }

      // Second, try to get text from Telegram Web App start parameter
      if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
        return decodeURIComponent(window.Telegram.WebApp.initDataUnsafe.start_param);
      }

      // Third, check if there's any message context in the init data
      const initData = window.Telegram?.WebApp?.initData;
      if (initData) {
        // Parse the init data to see if there's any message context
        try {
          const params = new URLSearchParams(initData);
          const startParam = params.get('start_param');
          if (startParam) {
            return decodeURIComponent(startParam);
          }
        } catch {
          // Ignore parsing errors
        }
      }

      return '';
    } catch {
      return '';
    }
  }, []);

  const sendMessage = useCallback(() => {
    if (message.trim() && window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp;
        
        if (isInlineMode) {
          // For inline mode, use switchInlineQuery
          tg.switchInlineQuery(message.trim(), ['users', 'groups', 'channels']);
        } else {
          // For regular mini apps, use sendData
          tg.sendData(message.trim());
        }
        
        setMessage(''); // Clear message after sending
      } catch (err) {
        setError(`Failed to send: ${err}`);
      }
    }
  }, [message, isInlineMode]);

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
        
        // Get pre-filled text and set it if available
        const prefilledText = getPrefilledText();
        if (prefilledText && mounted) {
          setMessage(prefilledText);
        }
        
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
        
        // Setup main button
        const mainButton = tg.MainButton;
        mainButton.text = hasQueryId ? 'Share in Chat' : 'Send Message';
        
        try {
          mainButton.offClick(sendMessage);
        } catch {
          // Ignore if not available
        }
        
        mainButton.onClick(sendMessage);
        
        // Show main button if there's pre-filled text or current message
        if (prefilledText || message.trim()) {
          mainButton.show();
        } else {
          mainButton.hide();
        }
        
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
  }, [message, sendMessage, getPrefilledText]);

  // Update main button visibility when message changes
  useEffect(() => {
    if (isReady && window.Telegram?.WebApp?.MainButton) {
      const mainButton = window.Telegram.WebApp.MainButton;
      if (message.trim()) {
        mainButton.show();
      } else {
        mainButton.hide();
      }
    }
  }, [message, isReady]);

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
            {isInlineMode ? '✍️ Create & Share Todo' : '📝 Todo Editor'}
          </h1>
          
          {isInlineMode && isReady && (
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              Create your todo item and share it in the chat
            </p>
          )}
          
          {message && isReady && (
            <p className="text-green-600 dark:text-green-400 text-sm">
              ✅ Message content loaded from Telegram
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
              message ? 
                "✍️ Edit your todo item..." :
                isInlineMode 
                  ? "✍️ What todo would you like to create and share?" 
                  : "✍️ Enter your todo item...\n\n💡 Tip: Send a message to the bot first to pre-fill this field!"
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
            </div>
            
            <button
              onClick={sendMessage}
              disabled={!message.trim() || !isReady}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-600 transition-colors text-lg"
            >
              {isInlineMode ? '🔄 Share' : '📤 Send'}
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
