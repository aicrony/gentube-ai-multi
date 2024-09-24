import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function Uploader() {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heif']; // Add allowed extensions here

  // @ts-ignore
  const onDrop = useCallback((acceptedFiles) => {
    // @ts-ignore
    const filteredFiles = acceptedFiles.filter((file) => {
      const fileExtension = file.name.split('.').pop();
      return allowedExtensions.includes(`.${fileExtension}`);
    });

    // @ts-ignore
    filteredFiles.forEach((file) => {
      console.log(file.name);
      // You can perform other actions with the file here
    });
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
