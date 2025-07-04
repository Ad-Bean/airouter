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
}

/**
 * Upload an image to S3
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
    // Make images publicly readable
    // ACL: "public-read" as const,
    // Add metadata
    Metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct the public URL
    const url = `https://${BUCKET_NAME}.s3.${
      process.env.AWS_REGION || "us-east-1"
    }.amazonaws.com/${key}`;

    return {
      key,
      url,
      bucket: BUCKET_NAME,
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
 * Generate a presigned URL for private access (if needed)
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
