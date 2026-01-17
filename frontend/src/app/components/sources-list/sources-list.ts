import { Component, Input, Output, EventEmitter, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileModel } from '../../models/file';
import { FileContentModal } from '../file-content-modal/file-content-modal';
import { SourcesService } from '../../services/sources.service';

@Component({
  selector: 'app-sources-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FileContentModal],
  templateUrl: './sources-list.html',
  styleUrls: ['./sources-list.css'],
})
export class SourcesList {
  private sourcesService = inject(SourcesService);
  
  @Input() sources: FileModel[] = [];
  @Output() deleteSource = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  
  selectedSources = this.sourcesService.selectedFileIds;
  isAllSelected = computed(() => 
    this.sources.length > 0 && 
    this.selectedSources().length === this.sources.length
  );
  isModalOpen = signal(false);
  selectedFilename = signal('');

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.sourcesService.clearSelectedFileIds();
    } else {
      this.sourcesService.setSelectedFileIds(this.sources.map(s => s.id));
    }
  }

  toggleSource(sourceId: string, event: Event) {
    event.stopPropagation();
    this.sourcesService.toggleSelectedFileId(sourceId);
  }

  isSourceSelected(source: FileModel): boolean {
    return this.selectedSources().includes(source.id);
  }

  deleteSelectedSource(filename: string, event: Event) {
    event.stopPropagation();
    this.deleteSource.emit(filename);
  }

  deleteSelected(event: Event) {
    event.stopPropagation();
    const filenamesToDelete: string[] = [];
    this.sources.forEach(source => {
      if (this.selectedSources().includes(source.id)) {
        filenamesToDelete.push(source.name);
      }
    });
    filenamesToDelete.forEach(source => {
      this.deleteSource.emit(source);
    });
  }

  clearSources() {
    this.clear.emit();
  }

  openModal(filename: string) {
    this.selectedFilename.set(filename);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }
}
