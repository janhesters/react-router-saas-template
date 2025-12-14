const actions = [
  "Schedule Interview",
  "Summarize Candidate",
  "Send To Marketplace",
  "Move to Next Stage",
];

export default function AIActions() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        Contextual Actions:
      </p>

      {actions.map((action) => (
        <button
          className="flex items-center gap-2 rounded border px-3 py-2 text-sm text-left hover:bg-muted"
          key={action}
          type="button"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
