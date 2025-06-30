"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [queryId, setQueryId] = useState<string | null>(null);
  const [inlineMessageId, setInlineMessageId] = useState<string | null>(null);
  console.log('inlineMessageId', inlineMessageId)

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram) {
      const tg = window.Telegram.WebApp;
      tg.ready();

      const params = new URLSearchParams(window.location.search);

      console.log("search", window.location.search);
      const initialText = params.get("text");
      const qidParam = params.get("qid");
      const idParam = params.get("tgWebAppStartParam");
      if (initialText) setText(initialText);
      if (qidParam) setQueryId(qidParam);
      if (idParam) setInlineMessageId(idParam);

      const initStr = tg.initData || "";
      if (initStr) {
        const initSearch = new URLSearchParams(initStr);
        const qid = initSearch.get("query_id");
        if (qid) setQueryId(qid);
        const imid = initSearch.get("inline_message_id");
        if (imid) setInlineMessageId(imid);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!queryId && !inlineMessageId) {
      alert("No identifiers to update message");
      return;
    }

    const endpoint = queryId ? "/api/answer-webapp" : "/api/edit-message";
    const payload = queryId
      ? { query_id: queryId, text }
      : { inline_message_id: inlineMessageId, text };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        window.Telegram.WebApp.close();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-semibold text-center text-gray-800 mb-4">
          Edit Message
        </h1>
        <textarea
          className="w-full h-40 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your message..."
        />
        <button
          onClick={handleSubmit}
          className="w-full mt-4 px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          disabled={!text || !inlineMessageId}
        >
          Update Message
        </button>
      </div>
    </main>
  );
}
