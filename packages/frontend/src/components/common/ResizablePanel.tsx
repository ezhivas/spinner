import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePanelProps {
  children: ((width: number) => ReactNode) | ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  storageKey?: string;
}

/**
 * Панель с возможностью изменения ширины
 */
export const ResizablePanel = ({
  children,
  defaultWidth = 400,
  minWidth = 200,
  maxWidth = 800,
  className = '',
  storageKey = 'resizable-panel-width',
}: ResizablePanelProps) => {
  // Initialize width from localStorage or use default
  const getInitialWidth = () => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    }
    return defaultWidth;
  };

  const [width, setWidth] = useState(getInitialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Save width to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [width, storageKey]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <div
      ref={panelRef}
      style={{ width: `${width}px` }}
      className={`relative flex-shrink-0 ${className}`}
    >
      {typeof children === 'function' ? children(width) : children}
      
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-500 transition-colors group"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute top-0 right-0 w-1 h-full bg-transparent group-hover:bg-primary-500" />
      </div>
    </div>
  );
};
