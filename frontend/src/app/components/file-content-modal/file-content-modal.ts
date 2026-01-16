import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';

@Component({
  selector: 'app-file-content-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-content-modal.html',
  styleUrls: ['./file-content-modal.css']
})
export class FileContentModal implements OnInit {
  @Input() isOpen = false;
  @Input() filename: string = '';
  @Output() close = new EventEmitter<void>();

  content: string = '';
  formattedSize: string = '';
  isLoading = false;
  error: string | null = null;

  constructor(private fileService: FileService) { }

  ngOnInit() {
    if (this.isOpen && this.filename) {
      this.loadFileContent();
    }
  }

  ngOnChanges() {
    if (this.isOpen && this.filename) {
      this.loadFileContent();
    }
  }

  loadFileContent() {
    this.isLoading = true;
    this.error = null;

    this.fileService.getFileContent(this.filename).subscribe({
      next: (response) => {
        this.content = response.content;
        this.formattedSize = this.fileService.formatFileSize(response.file_size_bytes);
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
