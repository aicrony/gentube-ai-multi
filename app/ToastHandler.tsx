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
    } else if (toastData.type === 'image' || toastData.type === 'image-edit' || toastData.type === 'video') {
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

      // Ensure pathname is defined and handle edge cases
      const currentPath = pathname || '/';
      
      const isOnPageWithMyAssets = pagesWithMyAssets.some(page => {
        // Special handling for root path
        if (page === '/') {
          return currentPath === '/' || currentPath === '';
        }
        // For other paths, check if pathname includes the page
        return currentPath.includes(page);
      });
      
      console.log('Toast click debug:', {
        pathname,
        currentPath,
        isOnPageWithMyAssets,
        toastType: toastData.type,
        editedImageId: toastData.editedImageId
      });

      if (isOnPageWithMyAssets) {
        // If we're already on a page with MyAssets, just refresh
        if (typeof window !== 'undefined') {
          // First close any open modal
          window.dispatchEvent(new CustomEvent('closeModal'));
          
          // For image-edit with editedImageId, dispatch special event
          if (toastData.type === 'image-edit' && toastData.editedImageId) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshAndShowEditedImage', {
                detail: { editedImageId: toastData.editedImageId }
              }));
            }, 100);
          } else {
            // For regular image/video toasts, just refresh the assets
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('refreshAssets'));
            }, 100);
          }
        }
      } else {
        // If not on a page with MyAssets, navigate to the appropriate manage-image page
        const isBusinessContext = currentPath.includes('/business/');
        
        // Include openImage parameter only for image-edit toasts with editedImageId
        if (toastData.type === 'image-edit' && toastData.editedImageId) {
          const targetPath = isBusinessContext 
            ? `/business/manage-image?openImage=${toastData.editedImageId}`
            : `/personal/manage-image?openImage=${toastData.editedImageId}`;
          router.push(targetPath);
        } else {
          // For regular image/video toasts
          router.push(isBusinessContext ? '/business/manage-image' : '/personal/manage-image');
        }
      }
    }
  };

  return (
    <ToastProvider onToastClick={handleToastClick}>{children}</ToastProvider>
  );
}
