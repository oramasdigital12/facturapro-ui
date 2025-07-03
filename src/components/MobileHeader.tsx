import React from "react";

interface MobileHeaderProps {
  logo_url?: string;
  color_personalizado?: string;
  children?: React.ReactNode;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ logo_url, children }) => {
  return (
    <div className="block md:hidden w-full flex justify-between items-center px-4 pt-4 pb-2">
      <img
        src={logo_url && logo_url.trim() !== '' ? logo_url : "/crm-icon.svg"}
        alt="Logo"
        className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 p-2 shadow-md object-contain"
      />
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
};

export default MobileHeader; 