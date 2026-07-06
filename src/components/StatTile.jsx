export default function StatTile({ label, value, tone }) {
  return (
    <div className={`stat-tile ${tone || ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
