import crypto from 'crypto';
import { Storage } from '@google-cloud/storage';
import { Datastore } from '@google-cloud/datastore';

// Initialize Google Cloud services
const datastore = new Datastore();
const KIND = 'SocialMediaTokens';

// Encryption utilities using AES-256-GCM
// This provides authenticated encryption which is important for tokens
export const encryptToken = (text: string, secretKey: string): string => {
  const iv = crypto.randomBytes(16); // Initialization vector
  const key = crypto
    .createHash('sha256')
    .update(secretKey)
    .digest('base64')
    .substring(0, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get the auth tag (for GCM mode)
  const authTag = cipher.getAuthTag();

  // Return iv + authTag + encrypted data, all base64 encoded
  return Buffer.from(
    iv.toString('hex') + authTag.toString('hex') + encrypted
  ).toString('base64');
};

export const decryptToken = (
  encryptedText: string,
  secretKey: string
): string => {
  try {
    const buffer = Buffer.from(encryptedText, 'base64').toString('hex');

    // Extract iv, authTag and encrypted data
    const iv = Buffer.from(buffer.substring(0, 32), 'hex');
    const authTag = Buffer.from(buffer.substring(32, 64), 'hex');
    const encrypted = buffer.substring(64);

    const key = crypto
      .createHash('sha256')
      .update(secretKey)
      .digest('base64')
      .substring(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    // Set the auth tag
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting token:', error);
    throw new Error('Failed to decrypt token');
  }
};

// Types for social media tokens
export interface SocialToken {
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp
  tokenType?: string;
  scope?: string;
  platformUserId?: string; // Platform-specific user ID
  platformUserName?: string; // Username on the platform
}

export interface SocialTokenEntry {
  userId: string;
  platform: string;
  encryptedData: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// Save social media token to GCloud Datastore
export const saveSocialToken = async (
  userId: string,
  platform: string,
  tokenData: SocialToken
): Promise<boolean> => {
  try {
    if (!process.env.SOCIAL_TOKEN_ENCRYPTION_KEY) {
      throw new Error('Encryption key not configured');
    }

    // Encrypt the token data
    const encryptedData = encryptToken(
      JSON.stringify(tokenData),
      process.env.SOCIAL_TOKEN_ENCRYPTION_KEY
    );

    // Create key for Datastore - use platform name in the key path
    // This ensures one entry per platform per user
    const key = datastore.key([KIND, `${userId}_${platform.toLowerCase()}`]);

    // Create entity
    const entity = {
      key,
      data: {
        userId,
        platform: platform.toLowerCase(),
        encryptedData,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: tokenData.expiresAt
          ? new Date(tokenData.expiresAt * 1000)
          : undefined
      }
    };

    // Save to Datastore
    await datastore.save(entity);
    return true;
  } catch (error) {
    console.error(`Error saving ${platform} token for user ${userId}:`, error);
    return false;
  }
};

// Get social media token from GCloud Datastore
export const getSocialToken = async (
  userId: string,
  platform: string
): Promise<SocialToken | null> => {
  try {
    if (!process.env.SOCIAL_TOKEN_ENCRYPTION_KEY) {
      throw new Error('Encryption key not configured');
    }

    // Get the entity
    const key = datastore.key([KIND, `${userId}_${platform.toLowerCase()}`]);
    const [entity] = await datastore.get(key);

    if (!entity || !entity.encryptedData) {
      return null;
    }

    // Check if token is expired
    if (entity.expiresAt && entity.expiresAt < new Date()) {
      // In a real implementation, you'd use the refresh token here
      // For now, we'll just return null
      return null;
    }

    // Decrypt token data
    const decryptedData = decryptToken(
      entity.encryptedData,
      process.env.SOCIAL_TOKEN_ENCRYPTION_KEY
    );

    return JSON.parse(decryptedData);
  } catch (error) {
    console.error(
      `Error retrieving ${platform} token for user ${userId}:`,
      error
    );
    return null;
  }
};

// Delete social media token from GCloud Datastore
export const deleteSocialToken = async (
  userId: string,
  platform: string
): Promise<boolean> => {
  try {
    // Delete the entity
    const key = datastore.key([KIND, `${userId}_${platform.toLowerCase()}`]);
    await datastore.delete(key);
    return true;
  } catch (error) {
    console.error(
      `Error deleting ${platform} token for user ${userId}:`,
      error
    );
    return false;
  }
};

// Check if user has a valid token for a platform
export const hasValidToken = async (
  userId: string,
  platform: string
): Promise<boolean> => {
  try {
    const token = await getSocialToken(userId, platform);
    return !!token; // If token exists and isn't expired, it's valid
  } catch (error) {
    return false;
  }
};

// Get all platforms that a user has connected to
export const getUserConnectedPlatforms = async (
  userId: string
): Promise<string[]> => {
  try {
    // Query all tokens for this user
    const query = datastore.createQuery(KIND).filter('userId', '=', userId);

    const [entities] = await datastore.runQuery(query);

    // Get platforms and filter out expired tokens
    const platforms: string[] = [];
    const now = new Date();

    for (const entity of entities) {
      // Skip expired tokens
      if (entity.expiresAt && entity.expiresAt < now) {
        continue;
      }

      platforms.push(entity.platform);
    }

    return platforms;
  } catch (error) {
    console.error(
      `Error getting connected platforms for user ${userId}:`,
      error
    );
    return [];
  }
};
