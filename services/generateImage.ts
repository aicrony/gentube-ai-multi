import dotenv from 'dotenv';
import got from 'got';
import {uploadImageToGCSFromBase64} from "@/functions/uploadImage";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const modelId = process.env.OPENAI_MODEL_ID;
const openAiApiEndpoint = process.env.OPENAI_API_ENDPOINT;

interface ApiResponse {
    data: {
        b64_json: string;
    }[];
}

export async function callImageApi(imageDescription: string | string[] | undefined){
    const url = 'https://api.openai.com/v1/images/generations'
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Authorization': process.env.OPENAI_API_KEY_W_BEARER,
    };

    const params = {
        "model": process.env.OPENAI_MODEL_ID,
        "prompt":imageDescription,
        "n":1,
        "size":"1024x1024",
        "response_format":"b64_json"
    }
    try {
        const response = await got.post(url, {json: params, headers: headers}).json() as ApiResponse;
        console.log("ASYNC URL Response:")
        // console.log(response);
        // Return the URL of the uploaded image
        return await uploadImageToGCSFromBase64(response.data[0].b64_json)
    } catch (err) {
        console.log(err);
        return err
    }
}
