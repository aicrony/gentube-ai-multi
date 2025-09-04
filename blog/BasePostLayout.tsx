import React from 'react';
import RootLayout from '@/app/layout';

interface BasePostLayoutProps {
  children: React.ReactNode;
}

const BasePostLayout: React.FC<BasePostLayoutProps> = ({ children }) => {
  return (
    <RootLayout>
      <article className="prose mx-auto px-4 py-8">{children}</article>
    </RootLayout>
  );
};

export default BasePostLayout;
