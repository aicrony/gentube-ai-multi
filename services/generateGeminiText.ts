import dotenv from 'dotenv';
import got from 'got';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY as string;
const geminiApiUrl = process.env.GEMINI_API_ENDPOINT as string;

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

interface GenerateGeminiTextParams {
  prompt: string;
}

export default async function generateGeminiText(prompt: string) {
  try {
    if (
      process.env.GEMINI_TEST_MODE &&
      process.env.GEMINI_TEST_MODE === 'true'
    ) {
      return {
        response: {
          text: 'This is a test response from the Gemini API simulation.',
          request_id: 'test-request-id-' + Date.now()
        }
      };
    }

    const url = `${geminiApiUrl}?key=${geminiApiKey}`;

    const params = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const headers = {
      'Content-Type': 'application/json'
    };

    const response = (await got
      .post(url, {
        json: params,
        headers: headers
      })
      .json()) as GeminiResponse;

    const result = {
      text: response.candidates[0]?.content?.parts[0]?.text || '',
      request_id: `gemini-${Date.now()}`
    };

    console.log('Gemini API response received');
    return { response: result };
  } catch (error) {
    console.error(
      'An error occurred while generating text with Gemini:',
      error
    );
    throw error;
  }
}
