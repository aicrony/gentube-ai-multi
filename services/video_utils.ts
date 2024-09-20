import sharp from 'sharp';
import { Storage } from '@google-cloud/storage/build/esm/src';

export async function resizeImage(path: string, outputPath: string) {
  try {
    await sharp(path).resize(768, 768).toFile(outputPath);
    console.log(`Image resized to 768x768 and saved to ${outputPath}`);
  } catch (error) {
    console.error('An error occurred while resizing the image:', error);
  }
}

/**
 * Resizes an image from a Buffer and returns a new Buffer.
 *
 * @param {Buffer} inputBuffer The input image as a Buffer.
 * @param {number} width The width to resize the image to.
 * @param {number} height The height to resize the image to.
 * @returns {Promise<Buffer>} The resized image as a Buffer.
 */
export async function resizeImageBuffer(
  inputBuffer: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  try {
    const outputBuffer = await sharp(inputBuffer)
      .resize(width, height)
      .toBuffer();
    console.log(`Image resized to ${width}x${height}`);
    return outputBuffer;
  } catch (error) {
    console.error('An error occurred while resizing the image:', error);
    throw error; // Rethrow the error to handle it in the calling function
  }
}

export async function getFileData(
  bucketName: string,
  imageName: string
): Promise<Buffer> {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(imageName);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = file.createReadStream();

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => {
      const fileData = Buffer.concat(chunks);
      console.log(`File data retrieved: ${fileData.length} bytes`);
      resolve(fileData);
    });
  });
}

/**
 * Fetches image data from a bucket, resizes it, and returns the resized image as a Buffer.
 *
 * @param {string} bucketName The name of the Google Cloud Storage bucket.
 * @param {string} imageName The name of the image file in the bucket.
 * @param {number} width The width to resize the image to.
 * @param {number} height The height to resize the image to.
 * @returns {Promise<Buffer>} A promise that resolves with the resized image as a Buffer.
 */
export async function getFileDataAndResize(
  bucketName: string,
  imageName: string,
  width: number,
  height: number
): Promise<Buffer> {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(imageName);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = file.createReadStream();

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', (err) => reject(err));
    stream.on('end', async () => {
      try {
        const fileData = Buffer.concat(chunks);
        console.log(`Original file data retrieved: ${fileData.length} bytes`);

        // Resize the image using the resizeImageBuffer function
        const resizedBuffer = await resizeImageBuffer(fileData, width, height);
        console.log(`Image resized to ${width}x${height}`);

        resolve(resizedBuffer);
      } catch (error) {
        console.error('An error occurred while resizing the image:', error);
        reject(error);
      }
    });
  });
}
