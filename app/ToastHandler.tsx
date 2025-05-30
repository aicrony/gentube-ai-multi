'use client';

import { ToastProvider, ToastData } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface ToastHandlerProps {
  children: React.ReactNode;
}

export default function ToastHandler({ children }: ToastHandlerProps) {
  const router = useRouter();

  const handleToastClick = (id: string, toastData: ToastData) => {
    console.log('Toast clicked:', id, toastData);
    
    // Handle different toast types
    if (toastData.type === 'error') {
      // Navigate to pricing page for credit-related errors
      router.push('/pricing');
    } else if (toastData.type === 'image-edit' && toastData.editedImageId) {
      // Navigate to manage image page with specific image ID in URL
      router.push(`/personal/manage-image?openImage=${toastData.editedImageId}`);
    } else if (toastData.type === 'image' || toastData.type === 'image-edit') {
      router.push('/personal/manage-image');
    } else if (toastData.type === 'video') {
      router.push('/personal/manage-image'); // Same page handles both
    }
    
    // TODO: Implement the specific edit pane reopening functionality
    // This would require more complex state management across the app
  };

  return (
    <ToastProvider onToastClick={handleToastClick}>
      {children}
    </ToastProvider>
  );
}