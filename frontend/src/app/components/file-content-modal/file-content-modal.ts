import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../services/file.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-file-content-modal',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  templateUrl: './file-content-modal.html',
  styleUrls: ['./file-content-modal.css']
})
export class FileContentModal implements OnChanges {
  @Input() isOpen = false;
  @Input() filename: string = '';
  @Output() close = new EventEmitter<void>();

  content: string = '';
  isLoading = false;
  error: string | null = null;

  constructor(
    private fileService: FileService,
    private cdr: ChangeDetectorRef
  ) { }


  ngOnChanges(changes: SimpleChanges) {
    if (this.isOpen && this.filename && 
        (changes['isOpen']?.currentValue === true || changes['filename']?.currentValue)) {
      this.loadFileContent();
    }
  }

  private loadFileContent() {
    this.content = '';
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.fileService.getFileContent(this.filename).subscribe({
      next: (content) => {
        this.content = content;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = `Failed to load file: ${err.message}`;
        this.isLoading = false;
        this.cdr.detectChanges();
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
