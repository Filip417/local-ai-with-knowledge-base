import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { FileModel } from '../models/file';

/**
 * SourcesService encapsulates all HTTP logic for file/source operations.
 * Handles loading, uploading, and deleting files from the backend.
 * Also manages centralized file selection state.
 */
@Injectable({
  providedIn: 'root'
})
export class SourcesService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  
  // Centralized selection state
  readonly selectedFileIds = signal<string[]>([]);

  /**
   * Fetches all uploaded files from the backend.
   * @returns Promise resolving to an array of FileModel objects
   * @throws Error if the request fails
   */
  async loadFiles(): Promise<FileModel[]> {
    const data = await lastValueFrom(
      this.http.get<{ files: FileModel[] }>(this.apiService.endpoints.files)
    );
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

    await lastValueFrom(
      this.http.post(this.apiService.endpoints.file, formData)
    );
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
    await lastValueFrom(
      this.http.delete(`${this.apiService.endpoints.file}?filename=${encodeURIComponent(filename)}`)
    );
  }

  /**
   * Deletes all files from the backend.
   * @throws Error if the operation fails
   */
  async clearAllFiles(): Promise<void> {
    await lastValueFrom(
      this.http.delete(this.apiService.endpoints.files)
    );
  }

  // Selection management methods
  getSelectedFileIds(): string[] {
    return this.selectedFileIds();
  }

  setSelectedFileIds(ids: string[]): void {
    this.selectedFileIds.set(ids);
  }

  addSelectedFileIds(ids: string[]): void {
    this.selectedFileIds.update(current => [...current, ...ids]);
  }

  removeSelectedFileId(id: string): void {
    this.selectedFileIds.update(ids => ids.filter(i => i !== id));
  }

  toggleSelectedFileId(id: string): void {
    this.selectedFileIds.update(ids => 
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  clearSelectedFileIds(): void {
    this.selectedFileIds.set([]);
  }
}
