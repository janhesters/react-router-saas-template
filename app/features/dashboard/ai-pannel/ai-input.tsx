export default function AIInput() {
  return (
    <div className="flex gap-2">
      <input
        className="flex-1 rounded border px-3 py-2 text-sm"
        placeholder="Ask me anything..."
        type="text"
      />
      <button
        className="rounded bg-muted px-4 text-sm font-medium"
        type="submit"
      >
        Send
      </button>
    </div>
  );
}
