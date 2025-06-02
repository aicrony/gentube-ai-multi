'use client';

import { ToastProvider, ToastData } from '@/components/ui/Toast';
import { useRouter, usePathname } from 'next/navigation';

interface ToastHandlerProps {
  children: React.ReactNode;
}

export default function ToastHandler({ children }: ToastHandlerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleToastClick = (id: string, toastData: ToastData) => {
    console.log('Toast clicked:', id, toastData);

    // Handle different toast types
    if (toastData.type === 'error') {
      // Navigate to pricing page for credit-related errors
      router.push('/pricing');
    } else if (toastData.type === 'image-edit' && toastData.editedImageId) {
      // Check if we're on a page that has MyAssets component
      const pagesWithMyAssets = [
        '/personal/manage-image',
        '/business/manage-image',
        '/personal/upload-image',
        '/business/upload-image',
        '/business/product-image',
        '/business/brand-image',
        '/personal/animate-photo',
        '/business/animate-photo',
        '/personal/social-media',
        '/business/social-media',
        '/personal/generate-image',
        '/business/business-image',
        '/business/logo-creation',
        '/personal/story-video',
        '/business/product-video',
        '/upload-to-video',
        '/',
        '/image-url-to-video',
        '/text-to-video'
      ];

      const isOnPageWithMyAssets = pagesWithMyAssets.some(page => {
        // Special handling for root path
        if (page === '/') {
          return pathname === '/';
        }
        // For other paths, check if pathname includes the page
        return pathname?.includes(page);
      });

      if (isOnPageWithMyAssets) {
        // If we're already on a page with MyAssets, dispatch an event to refresh and show the image
        if (typeof window !== 'undefined') {
          // First close any open modal
          window.dispatchEvent(new CustomEvent('closeModal'));
          
          // Then dispatch event to refresh assets and open the edited image
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshAndShowEditedImage', {
              detail: { editedImageId: toastData.editedImageId }
            }));
          }, 100);
        }
      } else {
        // If not on a page with MyAssets, navigate to manage-image
        router.push(
          `/personal/manage-image?openImage=${toastData.editedImageId}`
        );
      }
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
