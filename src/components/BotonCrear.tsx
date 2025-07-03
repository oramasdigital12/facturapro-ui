import { FiPlus } from 'react-icons/fi';

interface BotonCrearProps {
  onClick: () => void;
  label?: string;
  className?: string;
  color_personalizado?: string;
  size?: 'md' | 'fab';
}

function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

export default function BotonCrear({ onClick, label = 'Crear', className = '', color_personalizado, size = 'md' }: BotonCrearProps) {
  const isFab = size === 'fab';
  const color = color_personalizado || '#2563eb';
  const hoverColor = hexToRgba(color, 0.85);
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isFab
          ? `flex items-center justify-center rounded-full w-14 h-14 shadow-xl text-white text-4xl transition-all ${className}`
          : `flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white text-lg font-bold shadow-md transition-all focus:outline-none focus:ring-2 ${className}`
      }
      style={{ background: color, minWidth: 0, borderColor: color, borderWidth: isFab ? 0 : 2, borderStyle: 'solid' }}
      onMouseOver={e => (e.currentTarget.style.background = hoverColor)}
      onMouseOut={e => (e.currentTarget.style.background = color)}
    >
      <FiPlus className={isFab ? 'text-4xl m-0 p-0' : 'text-2xl'} />
      {!isFab && label && <span>{label}</span>}
    </button>
  );
} 