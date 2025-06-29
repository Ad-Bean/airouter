import { put } from "@vercel/blob";

export interface ImageStorageResult {
  url: string;
  pathname: string;
  downloadUrl: string;
}

export class ImageStorage {
  /**
   * Download image from URL and store in Vercel Blob
   */
  static async storeImage(
    imageUrl: string,
    userId: string,
    prompt: string,
    provider: string
  ): Promise<ImageStorageResult> {
    try {
      // Download the image from the provider
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") || "image/png";

      // Generate a unique filename
      const timestamp = Date.now();
      const fileExtension = this.getFileExtension(contentType);
      const filename = `${userId}/${provider}/${timestamp}_${this.sanitizePrompt(
        prompt
      )}.${fileExtension}`;

      // Store in Vercel Blob
      const blob = await put(filename, imageBuffer, {
        access: "public",
        contentType,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        downloadUrl: blob.downloadUrl,
      };
    } catch (error) {
      console.error("Error storing image:", error);
      throw new Error("Failed to store image");
    }
  }

  /**
   * Alternative: Store image in local filesystem (development only)
   */
  static async storeImageLocal(
    imageUrl: string,
    userId: string,
    prompt: string,
    provider: string
  ): Promise<string> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Local storage not available in production");
    }

    const fs = await import("fs/promises");
    const path = await import("path");

    try {
      // Download the image
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();

      // Create storage directory
      const uploadDir = path.join(process.cwd(), "public", "uploads", userId);
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate filename
      const timestamp = Date.now();
      const filename = `${provider}_${timestamp}_${this.sanitizePrompt(
        prompt
      )}.png`;
      const filePath = path.join(uploadDir, filename);

      // Save file
      await fs.writeFile(filePath, Buffer.from(imageBuffer));

      // Return public URL
      return `/uploads/${userId}/${filename}`;
    } catch (error) {
      console.error("Error storing image locally:", error);
      throw new Error("Failed to store image locally");
    }
  }

  private static getFileExtension(contentType: string): string {
    switch (contentType) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      case "image/gif":
        return "gif";
      default:
        return "png";
    }
  }

  private static sanitizePrompt(prompt: string): string {
    return prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  }

  /**
   * Delete stored image
   */
  static async deleteImage(pathname: string): Promise<void> {
    try {
      const { del } = await import("@vercel/blob");
      await del(pathname);
    } catch (error) {
      console.error("Error deleting image:", error);
      throw new Error("Failed to delete image");
    }
  }
}
