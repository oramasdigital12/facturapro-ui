interface FacturaProLogoProps {
  size?: number;
  className?: string;
}

export default function FacturaProLogo({ size = 120, className = '' }: FacturaProLogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Icono del documento */}
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2"
      >
        {/* Documento principal */}
        <rect
          x="8"
          y="4"
          width="44"
          height="52"
          rx="4"
          fill="#3B82F6"
          className="drop-shadow-lg"
        />
        
        {/* Esquina doblada */}
        <path
          d="M44 4 L52 12 L44 12 Z"
          fill="#1D4ED8"
        />
        
        {/* Líneas de texto */}
        <rect x="16" y="20" width="28" height="2" rx="1" fill="white" opacity="0.9" />
        <rect x="16" y="26" width="24" height="2" rx="1" fill="white" opacity="0.7" />
        <rect x="16" y="32" width="20" height="2" rx="1" fill="white" opacity="0.5" />
        
        {/* Líneas de velocidad */}
        <rect x="4" y="18" width="6" height="2" rx="1" fill="#3B82F6" />
        <rect x="4" y="22" width="4" height="2" rx="1" fill="#3B82F6" />
        <rect x="4" y="26" width="2" height="2" rx="1" fill="#3B82F6" />
        
        {/* Corte inferior */}
        <path
          d="M26 52 L34 52 L30 56 Z"
          fill="#1D4ED8"
        />
      </svg>
      
      {/* Texto "facturapro" */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
          facturapro
        </h1>
        <p className="text-xs text-gray-600 mt-1 font-medium">
          Sistema de Gestión
        </p>
      </div>
    </div>
  );
}
