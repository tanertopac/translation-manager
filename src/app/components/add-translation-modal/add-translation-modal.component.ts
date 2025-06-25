import { Component, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface AddTranslationData {
  key: string;
  value: string;
}

export interface AddTranslationErrors {
  key?: string;
  value?: string;
}

@Component({
  selector: 'app-add-translation-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-translation-modal.component.html',
  styleUrl: './add-translation-modal.component.scss'
})
export class AddTranslationModalComponent {
  // Input signals
  isVisible = input.required<boolean>();
  errors = input<AddTranslationErrors>({});

  // Output signals
  close = output<void>();
  addTranslation = output<AddTranslationData>();

  // Local state
  newItemKey: string = '';
  newItemValue: string = '';

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onAdd(): void {
    this.addTranslation.emit({
      key: this.newItemKey,
      value: this.newItemValue
    });
  }

  private resetForm(): void {
    this.newItemKey = '';
    this.newItemValue = '';
  }
}
