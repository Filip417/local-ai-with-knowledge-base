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
  @Output() upload = new EventEmitter<File[]>();

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length) {
      this.upload.emit(files);
      input.value = ''; // allow re-selecting same files
    }
  }

}
