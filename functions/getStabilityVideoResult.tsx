import axios from "axios";
import { Storage } from "@google-cloud/storage";

async function uploadVideoToGCS(videoData: Buffer, fileName: string): Promise<string> {

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

    const bucketName = process.env.GCLOUD_BUCKET_NAME;
    const bucket = storage.bucket(`${bucketName}`);

    const file = bucket.file(fileName);
    await file.save(videoData, {
        metadata: { contentType: "video/mp4" },
    });
    // await file.makePublic(); // Make the file publicly accessible
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

export default async function getStabilityVideoResult(generationId: string): Promise<string> {
    try {
        const response = await axios.request({
            url: `${process.env.STABILITY_API_ENDPOINT}/result/${generationId}`,
            method: "get",
            responseType: 'arraybuffer', // to handle binary data
            headers: {
                Accept: "video/*",
                authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
            },
        });

        if (response.status === 202) {
            console.log("Generation in-progress, trying again in 10 seconds.");
            await new Promise(resolve => setTimeout(resolve, 10000));
            return getStabilityVideoResult(generationId);
        } else if (response.status === 200) {
            console.log("Generation complete!");
            const videoFileName = `${generationId}.mp4`;
            const videoUrl = await uploadVideoToGCS(response.data, videoFileName);
            console.log("Video uploaded to GCS:", videoUrl);
            return videoUrl;
        } else {
            throw new Error(JSON.stringify(response.data));
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error("An error occurred while getting the video result:", error.response.status, error.response.data);
        } else {
            console.error("An unexpected error occurred:", error);
        }
        throw error;
    }
}
