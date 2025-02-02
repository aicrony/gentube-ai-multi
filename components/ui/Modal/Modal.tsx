import React from 'react';

interface ModalProps {
  mediaUrl: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ mediaUrl, onClose }) => {
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
      <div className="bg-white p-4 rounded shadow-lg max-w-3xl w-full relative">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <div className="flex justify-center">
          {mediaUrl.endsWith('.mp4') ? (
            <video src={mediaUrl} controls className="max-w-full h-auto" />
          ) : (
            <img src={mediaUrl} alt="Media" className="max-w-full h-auto" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
