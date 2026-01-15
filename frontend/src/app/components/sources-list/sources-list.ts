import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sources-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sources-list.html',
  styleUrls: ['./sources-list.css'],
})
export class SourcesList {
  @Input() sources: string[] = [];
  @Output() deleteSource = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  
  selectedSources = new Set<string>();
  selectAll = false;

  toggleSelectAll() {
    if (this.selectAll) {
      this.sources.forEach(source => this.selectedSources.add(source));
    } else {
      this.selectedSources.clear();
    }
  }

  toggleSource(source: string) {
    if (this.selectedSources.has(source)) {
      this.selectedSources.delete(source);
    } else {
      this.selectedSources.add(source);
    }
    this.updateSelectAllState();
  }

  isSourceSelected(source: string): boolean {
    return this.selectedSources.has(source);
  }

  updateSelectAllState() {
    this.selectAll = this.sources.length > 0 && this.selectedSources.size === this.sources.length;
  }

  deleteSelectedSource(source: string) {
    this.deleteSource.emit(source);
    this.selectedSources.delete(source);
    this.updateSelectAllState();
  }

  deleteSelected(event: Event) {
    event.stopPropagation();
    const sourcesToDelete = Array.from(this.selectedSources);
    sourcesToDelete.forEach(source => {
      this.deleteSource.emit(source);
    });
    this.selectedSources.clear();
    this.selectAll = false;
  }

    clearSources() {
    this.clear.emit();
  }

}
