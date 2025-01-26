import React, { useState } from 'react';
import { UploadImageDynamicButton } from '@/components/dynamic/upload-image-event';
import { useUserId } from '@/context/UserIdContext';
import { fileTypeFromBuffer } from 'file-type';

const FileInterpreter: React.FC = () => {
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const userId = useUserId();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const validImageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp',
        'image/heic'
      ];
      if (!validImageTypes.includes(file.type)) {
        alert('Only image files are allowed!');
        return;
      }

      setFileSize(file.size);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result?.toString().split(',')[1];
        setBase64Data(base64String || null);

        if (base64String) {
          const buffer = Buffer.from(base64String, 'base64');
          const type = await fileTypeFromBuffer(buffer);
          setFileType(type?.ext || 'unknown');

          const img = new Image();
          img.onload = () => {
            setImageSize({ width: img.width, height: img.height });
          };
          img.src = `data:image/${type?.ext};base64,${base64String}`;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatFileSize = (size: number | null) => {
    if (size === null) return '';
    const kb = size / 1024;
    const mb = kb / 1024;
    return `${kb.toFixed(2)} KB (${mb.toFixed(2)} MB)`;
  };

  return (
    <div className="pt-4 flex flex-col items-center">
      <h1 className="text-xl font-bold">Upload Image (for AI Video)</h1>
      <p>Up to 5MB image:</p>
      <input type="file" onChange={handleFileChange} />
      {base64Data && (
        <div className="flex flex-col items-center">
          <div>
            {imageSize && (
              <p>
                Dimensions: {imageSize.width} x {imageSize.height} pixels
              </p>
            )}
            {fileSize !== null && <p>Bytes: {formatFileSize(fileSize)}</p>}
            {fileType && <p>File Type: {fileType}</p>}
          </div>

          <div>
            {fileType !== 'heic' && (
              <img
                src={`data:image/${fileType};base64,${base64Data}`}
                alt="Uploaded image."
                style={{ maxWidth: '140px' }}
              />
            )}
          </div>
          <UploadImageDynamicButton base64Image={base64Data} userId={userId} />
        </div>
      )}
    </div>
  );
};

export default FileInterpreter;
