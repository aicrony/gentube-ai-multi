// components/ui/GuidedMessage.tsx
import React from 'react';

interface GuidedMessageProps {
  children: React.ReactNode;
  title?: string;
  showTitle?: boolean;
}

const GuidedMessage: React.FC<GuidedMessageProps> = ({
  children,
  title = 'Default Title',
  showTitle = false
}) => {
  return (
    <div
      className="mb-6 p-4 rounded-md"
      style={{
        backgroundColor: 'var(--card-bg-hover)',
        color: 'var(--text-color)',
        borderLeft: '4px solid var(--primary-color)'
      }}
    >
      {showTitle && <h3 className="font-bold mb-2">{title}</h3>}
      {children}
    </div>
  );
};

export default GuidedMessage;
