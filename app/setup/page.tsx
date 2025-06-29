"use client";

import { useEffect, useState } from "react";

interface WebhookInfo {
  url?: string;
  has_custom_certificate?: boolean;
  pending_update_count?: number;
  ip_address?: string;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

export default function SetupPage() {
  const [info, setInfo] = useState<WebhookInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/webhook-info");
        const data = await res.json();
        setInfo(data);
      } catch {
        setError("Failed to load webhook info");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-black">Loading webhook info...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-semibold mb-4 text-black">Telegram Webhook Status</h1>
        {info ? (
          <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm text-black">
            {JSON.stringify(info, null, 2)}
          </pre>
        ) : (
          <p className="text-black">No webhook information available.</p>
        )}
        <a
          href="/api/bot"
          className="inline-block mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Set / Refresh Webhook
        </a>
      </div>
    </main>
  );
}