const { Storage } = require('@google-cloud/storage');
const path = require('path');

const bucketName = process.env.GOOGLE_CONFIG_BUCKET_NAME;
const srcFilename = process.env.GOOGLE_CONFIG_FILE_NAME;
const destFilename = path.join(
  __dirname,
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);

async function downloadFile() {
  const storage = new Storage();
  const options = {
    destination: destFilename
  };

  await storage.bucket(bucketName).file(srcFilename).download(options);

  console.log(`Downloaded ${srcFilename} to ${destFilename}`);
}

downloadFile().catch(console.error);
