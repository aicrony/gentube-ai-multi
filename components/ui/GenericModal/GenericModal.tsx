import React, { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const GenericModal: React.FC<ModalProps> = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-gray-200 p-4 rounded shadow-lg max-w-4xl w-full max-h-screen overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <div className="flex justify-center">{children}</div>
      </div>
    </div>
  );
};

export default GenericModal;
