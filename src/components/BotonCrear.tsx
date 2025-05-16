import { FiPlus } from 'react-icons/fi';

interface BotonCrearProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export default function BotonCrear({ onClick, label = 'Crear', className = '' }: BotonCrearProps) {
  const isFab = !label;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white text-lg font-bold shadow-md hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
      style={{ minWidth: 0 }}
    >
      <FiPlus className={`${isFab ? 'text-6xl m-0 p-0' : 'text-2xl'}`} />
      {label && <span>{label}</span>}
    </button>
  );
} 