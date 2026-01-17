import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileModel } from '../../models/file';
import { FileContentModal } from '../file-content-modal/file-content-modal';

@Component({
  selector: 'app-sources-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FileContentModal],
  templateUrl: './sources-list.html',
  styleUrls: ['./sources-list.css'],
})
export class SourcesList implements OnChanges {
  @Input() sources: FileModel[] = [];
  @Input() selectedFileIds: string[] = [];
  @Output() deleteSource = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() selectionChanged = new EventEmitter<string[]>();
  
  selectedSources = signal<string[]>([]);
  isAllSelected = computed(() => 
    this.sources.length > 0 && 
    this.selectedSources().length === this.sources.length
  );
  isModalOpen = signal(false);
  selectedFilename = signal('');

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedFileIds'] && this.selectedFileIds) {
      this.selectedSources.set(this.selectedFileIds);
    }
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedSources.set([]);
    } else {
      this.selectedSources.set(this.sources.map(s => s.id));
    }
    this.emitSelectionChange();
  }

  toggleSource(sourceId: string, event: Event) {
    event.stopPropagation();
    const current = this.selectedSources();
    if (current.includes(sourceId)) {
      this.selectedSources.set(current.filter(id => id !== sourceId));
    } else {
      this.selectedSources.set([...current, sourceId]);
    }
    this.emitSelectionChange();
  }

  isSourceSelected(source: FileModel): boolean {
    return this.selectedSources().includes(source.id);
  }

  deleteSelectedSource(filename: string, event: Event) {
    event.stopPropagation();
    const source = this.sources.find(s => s.name === filename);
    if (source) {
      this.selectedSources.set(this.selectedSources().filter(id => id !== source.id));
    }
    this.deleteSource.emit(filename);
    this.emitSelectionChange();
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
    this.selectedSources.set([]);
    this.emitSelectionChange();
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

  private emitSelectionChange() {
    this.selectionChanged.emit(this.selectedSources());
  }

}
