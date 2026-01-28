import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Основной layout приложения
 */
export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {children}
    </div>
  );
};
