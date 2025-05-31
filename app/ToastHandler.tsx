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
      // Close any open modal first by dispatching a custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('closeModal'));
      }

      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        // Navigate to manage image page with specific image ID in URL
        router.push(
          `/personal/manage-image?openImage=${toastData.editedImageId}`
        );
      }, 100);
    } else if (toastData.type === 'image' || toastData.type === 'image-edit') {
      router.push('/personal/manage-image');
    } else if (toastData.type === 'video') {
      router.push('/personal/manage-image'); // Same page handles both
    }
  };

  return (
    <ToastProvider onToastClick={handleToastClick}>{children}</ToastProvider>
  );
}
