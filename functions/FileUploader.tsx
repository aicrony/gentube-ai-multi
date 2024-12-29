import React, { useState } from 'react';

const FileUploader = () => {
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
          <p>Base64 Data:</p>
          <textarea value={base64Data} readOnly rows={10} cols={50} />
        </div>
      )}
    </div>
  );
};

export default FileUploader;
