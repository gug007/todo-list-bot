'use client';

import { useState } from 'react';

interface SetupResult {
  step: string;
  success: boolean;
  data?: Record<string, unknown> | unknown[] | string | number | boolean | null;
  error?: string;
}

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SetupResult[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [error, setError] = useState('');

  const runSetup = async () => {
    setIsLoading(true);
    setError('');
    setResults([]);
    
    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults(data.results || []);
        setWebhookUrl(data.webhook_url || '');
        setNextSteps(data.next_steps || []);
      } else {
        setError(data.error || 'Setup failed');
        setResults(data.results || []);
      }
    } catch (err) {
      setError(`Network error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/setup');
      const data = await response.json();
      console.log('Status:', data);
    } catch (err) {
      console.error('Status check failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 Telegram Bot Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Configure your Telegram bot for inline mode support
          </p>

          {/* Prerequisites */}
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📋 Prerequisites
            </h2>
            <ol className="list-decimal list-inside text-blue-800 dark:text-blue-200 space-y-1">
              <li>Create a bot with @BotFather and get the token</li>
              <li>Add <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">TELEGRAM_BOT_TOKEN</code> to Vercel environment variables</li>
              <li>Deploy your app to Vercel</li>
              <li>Run this setup script</li>
            </ol>
          </div>

          {/* Setup Button */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={runSetup}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Setting up...
                </>
              ) : (
                <>
                  🚀 Run Setup
                </>
              )}
            </button>
            
            <button
              onClick={checkStatus}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
            >
              🔍 Check Status
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <h3 className="text-red-900 dark:text-red-100 font-semibold mb-1">❌ Error</h3>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                📊 Setup Results
              </h3>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
                        : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {result.success ? '✅' : '❌'}
                      </span>
                      <span className={`font-medium ${
                        result.success 
                          ? 'text-green-900 dark:text-green-100' 
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {result.step}
                      </span>
                    </div>
                    {result.error && (
                      <p className="text-red-800 dark:text-red-200 text-sm ml-7">
                        {result.error}
                      </p>
                    )}
                    {result.data && (
                      <details className="ml-7">
                        <summary className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                          Show details
                        </summary>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Webhook URL */}
          {webhookUrl && (
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
              <h3 className="text-green-900 dark:text-green-100 font-semibold mb-1">
                🔗 Webhook URL
              </h3>
              <code className="text-green-800 dark:text-green-200 text-sm break-all">
                {webhookUrl}
              </code>
            </div>
          )}

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <h3 className="text-yellow-900 dark:text-yellow-100 font-semibold mb-2">
                📱 Next Steps
              </h3>
              <ol className="list-decimal list-inside text-yellow-800 dark:text-yellow-200 space-y-1">
                {nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Testing */}
          <div className="bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h3 className="text-purple-900 dark:text-purple-100 font-semibold mb-2">
              🧪 Testing Your Bot
            </h3>
            <div className="text-purple-800 dark:text-purple-200 space-y-2">
              <p><strong>Inline Mode:</strong> Type <code>@yourbotname test</code> in any chat</p>
              <p><strong>Direct Mode:</strong> Send <code>/start</code> to your bot directly</p>
              <p><strong>Logs:</strong> Check Vercel function logs for debugging</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 