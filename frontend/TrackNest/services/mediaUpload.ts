import { getCriminalUrl } from "@/utils";
import { getAuthMetadata } from "@/utils/auth";
import axios from "axios";
export type { MediaFile } from "@/types/mediaUpload";

class MinIOService {
  private baseUrl: string = "";
  private bucketName = "criminal-reports";

  private async getApiClient() {
    if (!this.baseUrl) {
      this.baseUrl = await getCriminalUrl();
    }

    const authMetadata = await getAuthMetadata();
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        ...authMetadata,
        "Content-Type": "multipart/form-data",
      },
    });
  }

  async uploadFile(file: {
    uri: string;
    filename: string;
    type: string;
  }): Promise<{ url: string; filename: string }> {
    const client = await this.getApiClient();

    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.filename,
      type: file.type,
    } as any);
    formData.append("bucket", this.bucketName);

    try {
      const response = await client.post("/file/upload", formData);
      return {
        url: response.data.publicUrl || response.data.url,
        filename: response.data.filename || file.filename,
      };
    } catch (error) {
      console.error("File upload failed:", error);
      throw new Error("Failed to upload file. Please try again.");
    }
  }

  async uploadMultipleFiles(
    files: Array<{ uri: string; filename: string; type: string }>,
  ): Promise<Array<{ url: string; filename: string }>> {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }

  async uploadDocumentFile(
    documentId: string,
    file: { uri: string; filename: string; type: string },
  ): Promise<{ url: string; filename: string }> {
    const client = await this.getApiClient();
    const formData = new FormData();
    formData.append("file", {
      uri: file.uri,
      name: file.filename,
      type: file.type,
    } as unknown as Blob);

    try {
      const response = await client.post(`/file/document/${documentId}`, formData);
      return {
        url: response.data.publicUrl || response.data.url,
        filename: response.data.filename || file.filename,
      };
    } catch (error) {
      console.error("Document file upload failed:", error);
      throw new Error("Failed to upload document file. Please try again.");
    }
  }

  async deleteDocumentFolder(documentId: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/file/document/${documentId}`);
  }

  async deleteFile(filename: string): Promise<void> {
    const client = await this.getApiClient();
    await client.delete(`/file/${this.bucketName}/${filename}`);
  }

  getFileUrl(filename: string): string {
    return `${this.baseUrl}/file/${this.bucketName}/${filename}`;
  }
}

export const minioService = new MinIOService();
export default minioService;
