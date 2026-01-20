import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SourcesList } from '../sources-list/sources-list';
import { SourcesInput } from '../sources-input/sources-input';
import { FileModel } from '../../models/file';
import { SourcesService } from '../../services/sources.service';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [CommonModule, SourcesList, SourcesInput],
  templateUrl: './sources.html',
  styleUrls: ['./sources.css']
})
export class Sources implements OnInit {
  private sourcesService = inject(SourcesService);
  
  sources = signal<FileModel[]>([]);
  isUploading = signal(false);
  uploadMeta = signal<{ count: number; totalBytes: number; names: string[] }>({ count: 0, totalBytes: 0, names: [] });
  @ViewChild('sourcesContainer') sourcesContainer?: ElementRef<HTMLElement>;

  async ngOnInit() {
    await this.loadFiles();
  }

  async loadFiles() {
    try {
      const files = await this.sourcesService.loadFiles();
      this.sources.set(files);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }

  async uploadFiles(files: File[]) {
    if (this.isUploading() || !files?.length) return;

    const existingNames = new Set(this.sources().map(s => s.name));
    const uniqueFiles: File[] = [];
    const newFileNames: string[] = [];

    for (const file of files) {
      if (existingNames.has(file.name)) {
        console.warn(`Skipping duplicate file name: ${file.name}`);
        continue;
      }
      existingNames.add(file.name);
      uniqueFiles.push(file);
      newFileNames.push(file.name);
    }

    if (!uniqueFiles.length) return;

    const totalBytes = uniqueFiles.reduce((sum, f) => sum + (f.size || 0), 0);
    this.uploadMeta.set({ count: uniqueFiles.length, totalBytes, names: uniqueFiles.map(f => f.name) });
    this.isUploading.set(true);

    try {
      await this.sourcesService.uploadFiles(uniqueFiles);
      await this.loadFiles();
      
      // Auto-select newly uploaded files
      const newFileIds = this.sources()
        .filter(s => newFileNames.includes(s.name))
        .map(s => s.id);
      
      this.sourcesService.addSelectedFileIds(newFileIds);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      this.isUploading.set(false);
    }
  }

  async deleteFile(filename: string) {
    try {
      const fileToDelete = this.sources().find(s => s.name === filename);
      await this.sourcesService.deleteFile(filename);
      this.sources.update(arr => arr.filter(s => s.name !== filename));
      if (fileToDelete) {
        this.sourcesService.removeSelectedFileId(fileToDelete.id);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async clearSources() {
    try {
      await this.sourcesService.clearAllFiles();
      this.sources.set([]);
      this.sourcesService.clearSelectedFileIds();
    } catch (error) {
      console.error('Error clearing sources:', error);
    }
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[i]}`;
  }
}
