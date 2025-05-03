import type { ReactNode } from 'react';

// Augment the JSX namespace to allow the html element in layout returns
declare global {
  namespace JSX {
    interface IntrinsicElements {
      html: React.DetailedHTMLProps<React.HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>;
    }
  }
}

declare module 'next' {
  export interface LayoutProps {
    children: ReactNode;
  }
}