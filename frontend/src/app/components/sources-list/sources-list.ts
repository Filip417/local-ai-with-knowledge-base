import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileModel } from '../../models/file';

@Component({
  selector: 'app-sources-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sources-list.html',
  styleUrls: ['./sources-list.css'],
})
export class SourcesList {
  @Input() sources: FileModel[] = [];
  @Output() deleteSource = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() selectionChanged = new EventEmitter<string[]>();
  
  selectedSources = new Set<string>();
  selectAll = false;

  toggleSelectAll() {
    if (this.selectAll) {
      this.sources.forEach(source => this.selectedSources.add(source.id));
    } else {
      this.selectedSources.clear();
    }
    this.emitSelectionChange();
  }

  toggleSource(sourceId: string) {
    if (this.selectedSources.has(sourceId)) {
      this.selectedSources.delete(sourceId);
    } else {
      this.selectedSources.add(sourceId);
    }
    this.updateSelectAllState();
    this.emitSelectionChange();
  }

  isSourceSelected(source: FileModel): boolean {
    return this.selectedSources.has(source.id);
  }

  updateSelectAllState() {
    this.selectAll = this.sources.length > 0 && this.selectedSources.size === this.sources.length;
  }

  deleteSelectedSource(filename: string) {
    const source = this.sources.find(s => s.file_name === filename);
    if (source) {
      this.selectedSources.delete(source.id);
    }
    this.deleteSource.emit(filename);
    this.updateSelectAllState();
    this.emitSelectionChange();
  }

  deleteSelected(event: Event) {
    event.stopPropagation();
    const filenamesToDelete: string[] = [];
    this.sources.forEach(source => {
      if (this.selectedSources.has(source.id)) {
        filenamesToDelete.push(source.file_name);
      }
    });
    filenamesToDelete.forEach(source => {
      this.deleteSource.emit(source);
    });
    this.selectedSources.clear();
    this.selectAll = false;
    this.emitSelectionChange();
  }

  clearSources() {
    this.clear.emit();
  }

  private emitSelectionChange() {
    this.selectionChanged.emit(Array.from(this.selectedSources));
  }

}
