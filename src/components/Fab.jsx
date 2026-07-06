import { Plus } from 'lucide-react';

export default function Fab({ onClick, label = 'Add' }) {
  return (
    <button className="fab" onClick={onClick} aria-label={label}>
      <Plus size={26} strokeWidth={2.5} />
    </button>
  );
}
