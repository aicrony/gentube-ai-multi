// googleCredentials.ts
import dotenv from 'dotenv';

dotenv.config();

export interface GoogleAppCreds {
  type: string | undefined;
  projectId: string | undefined;
  privateKeyId: string | undefined;
  private_key: string | undefined;
  client_email: string | undefined;
  clientId: string | undefined;
  authUri: string | undefined;
  tokenUri: string | undefined;
  authProviderX509CertUrl: string | undefined;
  clientX509CertUrl: string | undefined;
}

export const google_app_creds: GoogleAppCreds = {
  type: process.env.TYPE,
  projectId: process.env.PROJECT_ID,
  privateKeyId: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  clientId: process.env.CLIENT_ID,
  authUri: process.env.AUTH_URI,
  tokenUri: process.env.TOKEN_URI,
  authProviderX509CertUrl: process.env.AUTH_PROVIDER_X509_CERT_URL,
  clientX509CertUrl: process.env.CLIENT_X509_CERT_URL
};
