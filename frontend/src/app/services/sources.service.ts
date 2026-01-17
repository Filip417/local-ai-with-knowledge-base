import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { FileModel } from '../models/file';

/**
 * SourcesService encapsulates all HTTP logic for file/source operations.
 * Handles loading, uploading, and deleting files from the backend.
 */
@Injectable({
  providedIn: 'root'
})
export class SourcesService {
  private apiService = inject(ApiService);

  /**
   * Fetches all uploaded files from the backend.
   * @returns Promise resolving to an array of FileModel objects
   * @throws Error if the request fails
   */
  async loadFiles(): Promise<FileModel[]> {
    const response = await fetch(this.apiService.endpoints.files);
    
    if (!response.ok) {
      throw new Error(`Failed to load files: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  /**
   * Uploads a single file to the backend.
   * @param file - The File object to upload
   * @throws Error if the upload fails
   */
  async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(this.apiService.endpoints.file, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  }

  /**
   * Uploads multiple files sequentially.
   * @param files - Array of File objects to upload
   * @throws Error if any upload fails
   */
  async uploadFiles(files: File[]): Promise<void> {
    for (const file of files) {
      await this.uploadFile(file);
    }
  }

  /**
   * Deletes a file by name from the backend.
   * @param filename - The name of the file to delete
   * @throws Error if the deletion fails
   */
  async deleteFile(filename: string): Promise<void> {
    const response = await fetch(
      `${this.apiService.endpoints.file}?filename=${encodeURIComponent(filename)}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  }

  /**
   * Deletes all files from the backend.
   * @throws Error if the operation fails
   */
  async clearAllFiles(): Promise<void> {
    const response = await fetch(this.apiService.endpoints.files, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Clear sources failed: ${response.statusText}`);
    }
  }
}
