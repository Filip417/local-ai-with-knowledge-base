import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sources-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sources-input.html',
  styleUrls: ['./sources-input.css'],
})
export class SourcesInput {
  @Output() upload = new EventEmitter<File>();
  @Output() clear = new EventEmitter<void>();

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.upload.emit(file);
      // Reset input value so same file can be selected again
      input.value = '';
    }
  }

  clearSources() {
    this.clear.emit();
  }
}
