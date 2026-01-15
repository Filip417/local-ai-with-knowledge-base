import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { SourcesHeader } from '../sources-header/sources-header';
import { SourcesList } from '../sources-list/sources-list';
import { SourcesInput } from '../sources-input/sources-input';

@Component({
  selector: 'app-sources',
  standalone: true,
  imports: [SourcesHeader, SourcesList, SourcesInput],
  templateUrl: './sources.html',
  styleUrls: ['./sources.css']
})
export class Sources {
  sources = signal<string[]>([]);
  isUploading = signal(false);
  @ViewChild('sourcesContainer') sourcesContainer?: ElementRef<HTMLElement>;

  private readonly ENDPOINT_URL = 'http://localhost:8000/api/v1/file';
  private readonly CLEAR_ENDPOINT_URL = 'http://localhost:8000/api/v1/files';
  private readonly DELETE_FILE_ENDPOINT_URL = 'http://localhost:8000/api/v1/file';

  async uploadFile(file: File) {
    if (this.isUploading() || !file) return;

    this.isUploading.set(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(this.ENDPOINT_URL, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        this.addSource(file.name);
      } else {
        console.error('Upload failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      this.isUploading.set(false);
    }
  }

  private addSource(source: string) {
    this.sources.update(arr => [...arr, source]);
  }

  async deleteFile(filename: string) {
    try {
      const response = await fetch(`${this.DELETE_FILE_ENDPOINT_URL}?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.sources.update(arr => arr.filter(s => s !== filename));
      } else {
        console.error('Delete failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async clearSources() {
    this.sources.set([]);
    try {
      const response = await fetch(this.CLEAR_ENDPOINT_URL, {
        method: 'DELETE'
      });
      if (!response.ok) {
        console.error('Clear sources failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error clearing sources:', error);
    }
  }
}
