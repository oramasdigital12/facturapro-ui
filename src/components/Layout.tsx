import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { ReactNode } from 'react';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-16">
        {children || <Outlet />}
      </main>
      <BottomNav />
    </div>
  );
} 