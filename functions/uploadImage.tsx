import { nanoid } from 'nanoid'
import axios from 'axios';
import { Storage } from '@google-cloud/storage';
require('dotenv').config();

const google_app_creds = {
    "type": process.env.TYPE,
    "project_id": process.env.PROJECT_ID,
    "private_key_id": process.env.PRIVATE_KEY_ID,
    "private_key": process.env.PRIVATE_KEY,
    "client_email": process.env.CLIENT_EMAIL,
    "client_id": process.env.CLIENT_ID,
    "auth_uri": process.env.AUTH_URI,
    "token_uri": process.env.TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL
}

// TODO: Storage for GCP, which requires higher security - https://cloud.google.com/run/docs/configuring/services/environment-variables
// const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });

// Storage for Vercel
const storage = new Storage({
    credentials: google_app_creds
});

const bucketName = 'gen-image-storage';
const gcsBucket = storage.bucket(bucketName);

/**
 * Uploads an image to GCS from a base64 encoded JSON.
 * @param base64data A base64 encoded JSON string containing the image data.
 * @returns The URL of the uploaded image.
 */
export async function uploadImageToGCSFromBase64(base64data: string): Promise<string> {

    // Assuming the image data is stored in a property named 'base64data' and is base64 encoded
    const imageBuffer = Buffer.from(base64data, 'base64');

    // Generate a unique filename for the image
    const fileName = `${nanoid()}.png`; // Adjust the file extension based on your image data

    const file = gcsBucket.file(fileName);

    // Upload the image buffer to GCS
    await new Promise((resolve, reject) => {
        const stream = file.createWriteStream({
            metadata: {
                contentType: 'image/png', // Adjust the content type based on your image data
            },
        });
        stream.on('error', reject);
        stream.on('finish', resolve);
        stream.end(imageBuffer);
    });

    // Construct the URL to access the uploaded image
    const resultingGcsUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log(`Image uploaded to GCS: ${resultingGcsUrl}`);
    return resultingGcsUrl;
}

export default async function uploadImageToGCSFromUrl(imageUrl: string): Promise<string> {
    console.log("IMAGE GOING TO GCS: " + imageUrl);

    const urlParts = new URL(imageUrl);
    const pathParts = urlParts.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];

    // const fileName = extractImageName(imageUrl);
    console.log("FILENAME: " + fileName);

    const file = gcsBucket.file(fileName);
    // console.log("FILE: " + JSON.stringify(file));

    const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream'
    });

    await new Promise((resolve, reject) => {
        response.data.pipe(file.createWriteStream({
            metadata: {
                contentType: 'image/png',
                // Removed public: true,
                validation: 'md5'
            }
        }))
            .on('error', reject)
            .on('finish', resolve);
    });

    // Removed the call to file.makePublic()
    const resultingGcsUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    console.log(`Image uploaded to GCS: ${resultingGcsUrl}`);
    return resultingGcsUrl;
}

function extractImageName(url: string) {
    const urlParts = new URL(url);
    const pathParts = urlParts.pathname.split('/');
    const extractedImageName = pathParts[pathParts.length - 1];
    console.log("Extracted Image Name: " + extractedImageName);
    return extractedImageName;
}
