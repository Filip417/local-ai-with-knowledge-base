import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sources-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sources-list.html',
  styleUrls: ['./sources-list.css'],
})
export class SourcesList {
  @Input() sources: string[] = [];
}
