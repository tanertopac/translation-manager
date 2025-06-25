import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface BulkImportData {
  file: File;
}

export interface BulkImportErrors {
  file?: string;
  parsing?: string;
}

@Component({
  selector: 'app-bulk-import-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bulk-import-modal.component.html',
  styleUrl: './bulk-import-modal.component.scss'
})
export class BulkImportModalComponent {
  // Input signals
  isVisible = input.required<boolean>();
  errors = input<BulkImportErrors>({});

  // Output signals
  close = output<void>();
  importFile = output<BulkImportData>();

  // Local state
  selectedFile: File | null = null;
  fileName: string = '';

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onImport(): void {
    if (this.selectedFile) {
      this.importFile.emit({
        file: this.selectedFile
      });
    }
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.fileName = '';
  }
}
