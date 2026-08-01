'use client';

export default function ChatWidget() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <a
        href="https://line.me/ti/p/@tourthailand"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-600 text-white w-12 h-12 rounded flex items-center justify-center font-thai text-xs hover:bg-green-700 transition-colors duration-150"
        aria-label="LINE Official Account"
      >
        LINE
      </a>
      <a
        href="https://m.me/tourthailand"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 text-white w-12 h-12 rounded flex items-center justify-center font-thai text-xs hover:bg-blue-700 transition-colors duration-150"
        aria-label="Facebook Messenger"
      >
        MSG
      </a>
    </div>
  );
}
