import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { SettingsInfo } from '../../models/settings';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.html',
  styleUrls: ['./settings-modal.css']
})
export class SettingsModal implements OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  settings: SettingsInfo | null = null;
  promptDraft = '';
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  saveMessage = '';

  constructor(
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue === true) {
      this.loadSettings();
    }
  }

  async loadSettings(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.saveMessage = '';

    try {
      const fetched = await this.settingsService.fetchSettings();
      // Ensure view updates immediately even if resolution occurs outside Angular zone
      this.zone.run(() => {
        this.settings = fetched;
        this.promptDraft = this.settings.role_llm_prompt || '';
      });
    } catch (err: any) {
      this.error = err?.message ? `Failed to load settings: ${err.message}` : 'Failed to load settings.';
    } finally {
      this.zone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async savePrompt(): Promise<void> {
    const trimmed = this.promptDraft.trim();
    if (!trimmed) {
      this.error = 'Prompt cannot be empty.';
      return;
    }

    this.isSaving = true;
    this.error = null;
    this.saveMessage = '';

    try {
      const updatedPrompt = await this.settingsService.updatePrompt(trimmed);
      this.zone.run(() => {
        if (this.settings) {
          this.settings = { ...this.settings, role_llm_prompt: updatedPrompt };
        }
        this.promptDraft = updatedPrompt;
        this.saveMessage = 'Prompt updated.';
      });
    } catch (err: any) {
      this.error = err?.message ? `Failed to save prompt: ${err.message}` : 'Failed to save prompt.';
    } finally {
      this.zone.run(() => {
        this.isSaving = false;
        this.cdr.detectChanges();
      });
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
