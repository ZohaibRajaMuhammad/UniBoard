const MATRIX_COLUMNS = [
  "01011010",
  "10100101",
  "UNIBOARD",
  "AI ROOM",
  "DEADLINE",
  "CONTEXT",
  "10110100",
  "SIGNAL",
  "KNOWLEDGE",
  "01001110",
  "ACADEMIC",
  "WORKFLOW"
];

export function AuthMatrixBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(77,117,255,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(27,201,142,0.12),transparent_26%)]" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute inset-0 auth-matrix-fade">
        {MATRIX_COLUMNS.map((column, index) => (
          <div
            key={`${column}-${index}`}
            className="auth-matrix-column"
            style={{
              left: `${index * 8.8}%`,
              animationDelay: `${index * -1.2}s`,
              animationDuration: `${18 + (index % 4) * 4}s`
            }}
          >
            {Array.from({ length: 10 }).map((_, row) => (
              <span key={`${column}-${row}`}>{column}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
