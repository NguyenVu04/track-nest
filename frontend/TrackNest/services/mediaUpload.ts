import { getBaseUrl } from "@/utils";
import { getAuthMetadata } from "@/utils/auth";
import axios from "axios";

export interface MediaFile {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

// MinIO Service for file uploads
class MinIOService {
  private baseUrl: string = "";
  private minioBaseUrl: string = "";
  
  // Bucket name for criminal reports media
  private bucketName = "criminal-reports";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getBaseUrl();
    }
    // MinIO typically runs on port 9000
    this.minioBaseUrl = process.env.EXPO_PUBLIC_MINIO_URL || "http://localhost:9000";
    
    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        ...authMetadata,
        "Content-Type": "multipart/form-data",
      },
    });
  }

  /**
   * Upload a file to MinIO storage
   * Uses the backend's file upload endpoint
   */
  async uploadFile(file: {
    uri: string;
    filename: string;
    type: string;
  }): Promise<{ url: string; filename: string }> {
    const client = await this.getApiClient();
    
    // Create form data
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.filename,
      type: file.type,
    } as any);
    
    // If there's a specific bucket, append it
    formData.append("bucket", this.bucketName);

    try {
      const response = await client.post("/file/upload", formData);
      return {
        url: response.data.publicUrl || response.data.url, // Support both response formats
        filename: response.data.filename || file.filename,
      };
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file. Please try again.");
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: Array<{
    uri: string;
    filename: string;
    type: string;
  }>): Promise<Array<{ url: string; filename: string }>> {
    const results = await Promise.all(
      files.map(file => this.uploadFile(file))
    );
    return results;
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(filename: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/file/${this.bucketName}/${filename}`);
  }

  /**
   * Get public URL for a file (for viewing)
   */
  getFileUrl(filename: string): string {
    return `${this.minioBaseUrl}/${this.bucketName}/${filename}`;
  }
}

// Export singleton instance
export const minioService = new MinIOService();
export default minioService;

// Helper to create file from image picker result
export function createFileFromImagePicker(
  result: { assets?: Array<{ uri: string; fileName?: string; type?: string }> }
): { uri: string; filename: string; type: string } | null {
  if (!result.assets || result.assets.length === 0) {
    return null;
  }
  
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    filename: asset.fileName || `image_${Date.now()}.jpg`,
    type: asset.type || "image/jpeg",
  };
}