export default function PageHeader({ icon: Icon, title, subtitle }) {
  return (
    <header className="app-header">
      <h1>
        {Icon && <Icon size={20} />}
        {title}
      </h1>
      {subtitle && <span className="muted">{subtitle}</span>}
    </header>
  );
}
