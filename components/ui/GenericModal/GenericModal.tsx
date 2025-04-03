import React, { ReactNode } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const GenericModal: React.FC<ModalProps> = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  const { theme } = useTheme();
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={handleBackgroundClick}
      data-theme={theme}
    >
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 text-2xl"
        >
          &times;
        </button>
        <div className="flex justify-center">{children}</div>
      </div>
    </div>
  );
};

export default GenericModal;
