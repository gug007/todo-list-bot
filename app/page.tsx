'use client';

import { useEffect, useState, useCallback } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        sendData: (data: string) => void;
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
        };
      };
    };
  }
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [error, setError] = useState('');

  const sendMessage = useCallback(() => {
    if (message.trim() && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.sendData(message.trim());
        setMessage(''); // Clear message after sending
      } catch (err) {
        setError(`Failed to send: ${err}`);
      }
    }
  }, [message]);

  useEffect(() => {
    let mounted = true;
    
    const initTelegram = () => {
      try {
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          
          // Initialize Telegram Web App
          tg.ready();
          
          if (mounted) {
            setIsReady(true);
            setDebugInfo(`Telegram Web App initialized. User: ${tg.initDataUnsafe?.user?.first_name || 'Unknown'}`);
            
            // Configure main button
            const mainButton = tg.MainButton;
            mainButton.text = 'Send Message';
            
            // Remove any existing click handlers
            mainButton.offClick(sendMessage);
            mainButton.onClick(sendMessage);
            
            // Show/hide button based on message content
            if (message.trim()) {
              mainButton.show();
            } else {
              mainButton.hide();
            }
          }
        } else {
          if (mounted) {
            setDebugInfo('Telegram Web App not available. Are you running this in Telegram?');
            setError('This app must be opened through a Telegram bot');
          }
        }
      } catch (err) {
        if (mounted) {
          setError(`Initialization error: ${err}`);
        }
      }
    };

    // Try immediate initialization
    if (typeof window !== 'undefined') {
      if (window.Telegram?.WebApp) {
        initTelegram();
      } else {
        // Wait a bit for the script to load
        const timer = setTimeout(() => {
          initTelegram();
        }, 100);
        
        return () => {
          clearTimeout(timer);
          mounted = false;
        };
      }
    }

    return () => {
      mounted = false;
    };
  }, [message, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      sendMessage();
    }
  };

  const testSend = () => {
    if (!isReady) {
      setError('Telegram not ready yet');
      return;
    }
    sendMessage();
  };

  return (
    <div className="w-screen h-screen p-4 bg-white dark:bg-gray-900">
      <div className="h-full flex flex-col gap-4">
        <h1 className="text-xl font-bold text-black dark:text-white">
          Todo List Bot
        </h1>
        
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        <textarea
          className="flex-1 w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg outline-none p-4 text-base font-mono bg-white dark:bg-gray-800 text-black dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
          placeholder="Type your todo item or message here... (Ctrl/Cmd + Enter to send)"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setError(''); // Clear error when typing
          }}
          onKeyDown={handleKeyPress}
          autoFocus
        />
        
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isReady ? '✓ Telegram Ready' : '⏳ Loading...'}
            </span>
            {debugInfo && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {debugInfo}
              </span>
            )}
          </div>
          
          <button
            onClick={testSend}
            disabled={!message.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 disabled:text-gray-500 hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
        
        {!isReady && (
          <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p><strong>Troubleshooting:</strong></p>
                         <ul className="list-disc list-inside mt-1 space-y-1">
               <li>Make sure you&apos;re opening this through a Telegram bot</li>
               <li>Try refreshing the mini app</li>
               <li>Check if your bot is properly configured</li>
             </ul>
          </div>
        )}
      </div>
    </div>
  );
}
