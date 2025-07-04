import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface UploadImageOptions {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
}

export interface UploadImageResult {
  key: string;
  url: string;
  bucket: string;
  signedUrl: string;
  expiresAt: Date;
}

/**
 * Upload an image to S3 with secure access
 */
export async function uploadImageToS3({
  buffer,
  fileName,
  mimeType,
  userId,
}: UploadImageOptions): Promise<UploadImageResult> {
  // Create a unique key with user folder structure
  const timestamp = Date.now();
  const key = `images/${userId}/${timestamp}_${fileName}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    // Private by default - no public access
    ServerSideEncryption: "AES256" as const,
    // Add metadata
    Metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate signed URL for secure access (24 hours)
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: 24 * 60 * 60 } // 24 hours
    );

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      key,
      url: signedUrl, // Return signed URL instead of public URL
      bucket: BUCKET_NAME,
      signedUrl,
      expiresAt,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error(
      `Failed to upload image to S3: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate a presigned URL for private access with custom expiration
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Refresh signed URL for an image
 */
export async function refreshSignedUrl(
  key: string,
  expiresIn: number = 24 * 60 * 60 // 24 hours default
): Promise<{ signedUrl: string; expiresAt: Date }> {
  const signedUrl = await getPresignedUrl(key, expiresIn);
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  
  return { signedUrl, expiresAt };
}

/**
 * Delete an image from S3
 */
export async function deleteImageFromS3(key: string): Promise<void> {
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error(
      `Failed to delete image from S3: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Delete an object from S3 by key and bucket
 */
export async function deleteFromS3(key: string, bucket?: string): Promise<void> {
  const deleteParams = {
    Bucket: bucket || BUCKET_NAME,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error(
      `Failed to delete object from S3: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get S3 configuration status for debugging
 */
export function getS3Config() {
  return {
    region: process.env.AWS_REGION || "us-east-1",
    bucket: BUCKET_NAME,
    hasCredentials: !!(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ),
  };
}

/**
 * Batch delete multiple objects from S3
 */
export async function batchDeleteFromS3(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  
  // S3 batch delete can handle up to 1000 objects at once
  const batchSize = 1000;
  const batches = [];
  
  for (let i = 0; i < keys.length; i += batchSize) {
    batches.push(keys.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    const deletePromises = batch.map(key => deleteFromS3(key));
    await Promise.all(deletePromises);
  }
}
