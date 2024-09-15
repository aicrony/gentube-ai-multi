import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";
import { Storage } from '@google-cloud/storage';
import getVideoResult from "../functions/getVideoResult";
import uploadImageToGCSFromUrl from "../functions/uploadImage";
import sharp from 'sharp';
import extractImageName from "../functions/uploadImage";
require('dotenv').config();

const apiKey = process.env.STABILITY_API_KEY;
const modelId = process.env.STABILITY_MODEL_ID;
const apiEndpoint = process.env.STABILITY_API_ENDPOINT;

async function resizeImage(path: string, outputPath: string) {
    try {
        await sharp(path)
            .resize(768, 768)
            .toFile(outputPath);
        console.log(`Image resized to 768x768 and saved to ${outputPath}`);
    } catch (error) {
        console.error("An error occurred while resizing the image:", error);
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
async function resizeImageBuffer(inputBuffer: Buffer, width: number, height: number): Promise<Buffer> {
    try {
        const outputBuffer = await sharp(inputBuffer)
            .resize(width, height)
            .toBuffer();
        console.log(`Image resized to ${width}x${height}`);
        return outputBuffer;
    } catch (error) {
        console.error("An error occurred while resizing the image:", error);
        throw error; // Rethrow the error to handle it in the calling function
    }
}

async function getFileData(bucketName: string, imageName: string): Promise<Buffer> {
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
async function getFileDataAndResize(bucketName: string, imageName: string, width: number, height: number): Promise<Buffer> {
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
                console.error("An error occurred while resizing the image:", error);
                reject(error);
            }
        });
    });
}

export default async function generateVideo(url: string) {

    try {
        const data = new FormData();
        // const imageName = await extractImageName(url);

        const urlParts = new URL(url);
        const pathParts = urlParts.pathname.split('/');
        const imageName = pathParts[pathParts.length - 1];

        if (!imageName) {
            throw new Error('Image name is required');
        } else {
            console.log("Image Name to Match: " + imageName);
        }

        // Instantiate storage
        const storage = new Storage();

        // Set the bucket name
        const bucketName = 'gen-image-storage';

        // Get a reference to the bucket
        const bucket = storage.bucket(bucketName);

        // Fetch the list of files in the bucket
        const [files] = await bucket.getFiles();

        // Extract and log the name of each file
        console.log("LIST OF FILES IN BUCKET:");
        files.forEach(file => {
            console.log(file.name);
            if(file.name === imageName) {
                console.log("MATCH FOUND: " + file.name);
            }
        });

        const fileMetaData = bucket.file(imageName);
        // console.log("FILE OBJECT: " + JSON.stringify(fileMetaData));

        // const file = await getFileData(bucketName, imageName);
        const file = await getFileDataAndResize(bucketName, imageName, 768, 768);

        data.append('image', file, imageName);

        // data.append('image', stream, imageName);

        // data.append("image", file, "./public/image.png");
        data.append("seed", 0); // 0-10  0=creative and 10=stable
        data.append("cfg_scale", 3); // 0-10 0=random and 10=less distortion
        data.append("motion_bucket_id", 150); // 150
        // Cat Wiggle: 0,3,150
        // Monkey Digging: 1,7,150
        // Waterfall: 0,3,150
        // Woman: 100,7,150
        // Godzilla: 100,8,150

        // https://platform.stability.ai/docs/api-reference#tag/v2alphageneration/paths/~1v2alpha~1generation~1image-to-video/post
        const response = await axios.request({
            url: `${process.env.STABILITY_API_ENDPOINT}`,
            method: "post",
            validateStatus: undefined,
            headers: {
                authorization: `Bearer ${apiKey}`,
                ...data.getHeaders(),
            },
            data: data,
        });
        console.log("Response from Stability AI: ", JSON.stringify(response.data));
        console.log("Generation ID:", response.data.id);

        // Call getVideoResult with the generation ID
        return await getVideoResult(response.data.id);

    } catch (error) {
        console.error("An error occurred while generating the video:", error);
    }
}
