const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const bucketName = process.env.GOOGLE_CONFIG_BUCKET_NAME;
const srcFilename = process.env.GOOGLE_CONFIG_FILE_NAME;
const destFilename = path.join(
  __dirname,
  'local-cedar-324921-5c8f531afb2e.json'
);

async function downloadAndWriteFile() {
  const storage = new Storage();
  const options = {
    destination: '/tmp/tempfile'
  };

  // Download the file to a temporary location
  await storage.bucket(bucketName).file(srcFilename).download(options);

  // Read the downloaded file
  const fileContent = fs.readFileSync('/tmp/tempfile', 'utf8');

  // Write the content to the existing file
  fs.writeFileSync(destFilename, fileContent, 'utf8');

  console.log(
    `Downloaded ${srcFilename} and wrote its content to ${destFilename}`
  );
}

downloadAndWriteFile().catch(console.error);
