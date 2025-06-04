import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

export interface ToastData {
  id: string;
  type: 'image' | 'video' | 'image-edit' | 'error' | 'success';
  prompt: string;
  assetUrl?: string;
  duration?: number;
  editedImageId?: string; // For tracking the new edited image
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  onToastClick?: (id: string, toastData: ToastData) => void;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  onToastClick
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toastData: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastData = {
      ...toastData,
      id,
      duration: toastData.duration || 15000
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const handleToastClick = useCallback(
    (id: string) => {
      const toast = toasts.find((t) => t.id === id);
      if (toast && onToastClick) {
        onToastClick(id, toast);
        // Close the toast after handling the click (except for success toasts which shouldn't be clickable)
        if (toast.type !== 'success') {
          removeToast(id);
        }
      }
    },
    [toasts, onToastClick, removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast, clearAllToasts }}>
      {children}

      {/* Render toasts */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 space-y-2 z-50">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{ transform: `translateY(-${index * 10}px)` }}
          >
            <Toast
              id={toast.id}
              type={toast.type}
              prompt={toast.prompt}
              onClose={removeToast}
              onClick={handleToastClick}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
