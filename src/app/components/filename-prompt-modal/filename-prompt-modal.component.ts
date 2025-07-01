import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface FilenamePromptData {
  filename: string;
  additionalData?: string;
}

export interface FilenamePromptErrors {
  filename?: string;
  additionalData?: string;
}

@Component({
  selector: 'app-filename-prompt-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filename-prompt-modal.component.html',
  styleUrls: ['./filename-prompt-modal.component.scss']
})
export class FilenamePromptModalComponent {
  // Inputs
  isVisible = input<boolean>(false);
  title = input<string>('Enter Filename');
  placeholder = input<string>('Enter filename');
  extension = input<string>('.json');
  errors = input<FilenamePromptErrors>({});
  showAdditionalField = input<boolean>(false);
  additionalFieldLabel = input<string>('Additional Field');
  additionalFieldPlaceholder = input<string>('Enter value');

  // Outputs
  close = output<void>();
  confirm = output<FilenamePromptData>();

  // Local state
  filename: string = '';
  additionalData: string = '';

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit({
      filename: this.filename,
      additionalData: this.additionalData
    });
  }

  private resetForm(): void {
    this.filename = '';
    this.additionalData = '';
  }
}
