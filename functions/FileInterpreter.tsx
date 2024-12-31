import React, { useState } from 'react';
import { UploadImageDynamicButton } from '@/components/dynamic/upload-image-event';

const FileInterpreter: React.FC = () => {
  const [base64Data, setBase64Data] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(',')[1];
        setBase64Data(base64String || null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      {base64Data && (
        <div>
          <div>
            <p>Base64 Data:</p>
            <img
              src={`data:image/png;base64,${base64Data}`}
              alt="Uploaded image."
            />
          </div>
          <UploadImageDynamicButton
            base64Image={base64Data}
            productName="ExampleProduct"
            subscriptionStatus="active"
            userId="12345"
          />
        </div>
      )}
    </div>
  );
};

export default FileInterpreter;
