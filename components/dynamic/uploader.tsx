import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadImageToGCSFromBase64 } from '@/utils/gcloud/uploadImage';

function Uploader() {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heif'];
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filteredFiles = acceptedFiles.filter((file: File) => {
      const fileExtension = file.name.split('.').pop();
      return allowedExtensions.includes(`.${fileExtension}`);
    });

    for (const file of filteredFiles) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data) {
          try {
            const gcsUrl = await uploadImageToGCSFromBase64(
              'gentube-user-image-storage',
              base64data
            );
            console.log(`File uploaded to GCS: ${gcsUrl}`);
          } catch (error) {
            console.error('Error uploading file to GCS:', error);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
    </div>
  );
}

export default Uploader;
