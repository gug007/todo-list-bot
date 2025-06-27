"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");

  return (
    <div className="fixed inset-0 w-full h-full">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-full p-4 resize-none border-none outline-none text-lg font-mono bg-white dark:bg-gray-900 text-black dark:text-white"
        placeholder="Start typing..."
        autoFocus
      />
    </div>
  );
}
