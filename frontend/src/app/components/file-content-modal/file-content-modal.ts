import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-file-content-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-content-modal.html',
  styleUrls: ['./file-content-modal.css']
})
export class FileContentModal implements OnChanges {
  private fileService = inject(FileService);
  
  @Input() isOpen = false;
  @Input() filename: string = '';
  @Output() close = new EventEmitter<void>();

  content: string = '';
  isLoading = false;
  error: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['isOpen'] || changes['filename']) && this.isOpen && this.filename) {
      this.loadFileContent();
    }
  }

  private loadFileContent() {
    this.content = '';
    this.isLoading = true;
    this.error = null;

    this.fileService.getFileContent(this.filename).subscribe({
      next: (content) => {
        this.content = content;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = `Failed to load file: ${err.message}`;
        this.isLoading = false;
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
