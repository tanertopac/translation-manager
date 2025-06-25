import { Component, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface ExcelExportData {
  filename: string;
  languageCode: string;
}

export interface ExcelExportErrors {
  filename?: string;
  languageCode?: string;
}

@Component({
  selector: 'app-excel-export-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './excel-export-modal.component.html',
  styleUrl: './excel-export-modal.component.scss'
})
export class ExcelExportModalComponent {
  // Input signals
  isVisible = input.required<boolean>();
  errors = input<ExcelExportErrors>({});

  // Output signals
  close = output<void>();
  exportToExcel = output<ExcelExportData>();

  // Local state
  filename: string = '';
  languageCode: string = '';

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onExport(): void {
    this.exportToExcel.emit({
      filename: this.filename,
      languageCode: this.languageCode
    });
  }

  private resetForm(): void {
    this.filename = '';
    this.languageCode = '';
  }
}
