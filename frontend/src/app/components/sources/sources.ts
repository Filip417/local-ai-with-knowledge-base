import { Component, ElementRef, EventEmitter, inject, OnInit, Output, signal, ViewChild } from '@angular/core';
import { SourcesHeader } from '../sources-header/sources-header';
import { SourcesList } from '../sources-list/sources-list';
import { SourcesInput } from '../sources-input/sources-input';
import { FileModel } from '../../models/file';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [SourcesHeader, SourcesList, SourcesInput],
  templateUrl: './sources.html',
  styleUrls: ['./sources.css']
})
export class Sources implements OnInit {
  private apiService = inject(ApiService);
  
  @Output() selectionChanged = new EventEmitter<string[]>();
  sources = signal<FileModel[]>([]);
  selectedFileIds = signal<string[]>([]);
  isUploading = signal(false);
  @ViewChild('sourcesContainer') sourcesContainer?: ElementRef<HTMLElement>;

  async ngOnInit() {
    await this.loadFiles();
  }

  async loadFiles() {
    try {
      const response = await fetch(this.apiService.endpoints.files);
      if (response.ok) {
        const data = await response.json();
        this.sources.set(data.files || []);
      } else {
        console.error('Failed to load files:', response.statusText);
      }
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

    this.isUploading.set(true);

    try {
      for (const file of uniqueFiles) {
        await this.uploadSingleFile(file);
      }

      await this.loadFiles();
      
      // Auto-select newly uploaded files
      const newFileIds = this.sources()
        .filter(s => newFileNames.includes(s.name))
        .map(s => s.id);
      
      this.selectedFileIds.update(ids => [...ids, ...newFileIds]);
      this.selectionChanged.emit(this.selectedFileIds());
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      this.isUploading.set(false);
    }
  }

  private async uploadSingleFile(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(this.apiService.endpoints.file, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('Upload failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }

  async deleteFile(filename: string) {
    try {
      const response = await fetch(`${this.apiService.endpoints.file}?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.sources.update(arr => arr.filter(s => s.name !== filename));
        this.selectedFileIds.update(ids => ids.filter(id => {
          const file = this.sources().find(s => s.name === filename);
          return file ? id !== file.id : true;
        }));
      } else {
        console.error('Delete failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  onSelectionChanged(selectedIds: string[]) {
    this.selectedFileIds.set(selectedIds);
    this.selectionChanged.emit(selectedIds);
  }

  async clearSources() {
    try {
      const response = await fetch(this.apiService.endpoints.files, {
        method: 'DELETE'
      });
      if (response.ok) {
        this.sources.set([]);
        this.selectedFileIds.set([]);
      } else {
        console.error('Clear sources failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error clearing sources:', error);
    }
  }

  toggleFileSelection(fileId: string) {
    this.selectedFileIds.update(ids => 
      ids.includes(fileId) 
        ? ids.filter(id => id !== fileId)
        : [...ids, fileId]
    );
  }

  isFileSelected(fileId: string): boolean {
    return this.selectedFileIds().includes(fileId);
  }
}
