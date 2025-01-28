import React from 'react';

interface ModalProps {
  mediaUrl: string;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ mediaUrl, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg max-w-lg w-full">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
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
