import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslationItem, TranslationUtils } from './utils';
import {
  AddTranslationModalComponent,
  AddTranslationData,
  AddTranslationErrors
} from './components/add-translation-modal/add-translation-modal.component';
import {
  BulkImportModalComponent,
  BulkImportData,
  BulkImportErrors
} from './components/bulk-import-modal/bulk-import-modal.component';
import {
  FilenamePromptModalComponent,
  FilenamePromptData,
  FilenamePromptErrors
} from './components/filename-prompt-modal/filename-prompt-modal.component';
import { MessageService } from './services/message.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, AddTranslationModalComponent, BulkImportModalComponent, FilenamePromptModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'translation-manager';

  private readonly toastr = inject(ToastrService);
  private readonly messageService = inject(MessageService);

  loadedFile: any = null;
  fileName: string = '';
  jsonContent: any = null;
  originalJsonContent: any = null;
  errorMessage: string = '';
  filterText: string = '';

  private readonly flattenedDataSubject = new BehaviorSubject<TranslationItem[]>([]);
  private readonly filterTriggerSubject = new BehaviorSubject<string>('');

  filteredData$: Observable<TranslationItem[]>;

  // Add item functionality
  showAddModal: boolean = false;
  addItemErrors: AddTranslationErrors = {};

  // Bulk import functionality
  showBulkImportModal: boolean = false;
  bulkImportErrors: BulkImportErrors = {};

  // Filename prompt functionality
  showFilenamePromptModal: boolean = false;
  filenamePromptErrors: FilenamePromptErrors = {};

  // Export filename prompt functionality
  showExportFilenameModal: boolean = false;
  exportFilenameErrors: FilenamePromptErrors = {};
  currentExportType: 'json' | 'excel' = 'json';

  constructor() {
    this.filteredData$ = combineLatest([
      this.flattenedDataSubject.asObservable(),
      this.filterTriggerSubject.asObservable()
    ]).pipe(
      map(([data, filterText]) => {
        let filteredData = data;

        // Apply text filter if provided
        if (filterText.trim()) {
          filteredData = data.filter(item =>
            item.key.toLowerCase().includes(filterText.toLowerCase())
          );
        }

        // Sort: error items first, then normal items in their original order
        return filteredData.sort((a, b) => {
          // Error items come first
          if (a.isError && !b.isError) return -1;
          if (!a.isError && b.isError) return 1;

          // For non-error items, maintain original order (no sorting)
          return 0;
        });
      })
    );
  }

  onCreateTranslation(): void {
    if (this.hasWorkspaceData()) {
      this.messageService.confirm(
        'This will clear the current workspace and create a new empty translation file. Are you sure?',
        (result) => {
          if (result) {
            this.openFilenamePromptModal();
          }
        },
        'Confirm Action',
        {
          confirmText: 'Yes, Continue',
          confirmButtonClass: 'btn-warning'
        }
      );
    } else {
      this.openFilenamePromptModal();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (this.hasWorkspaceData()) {
        this.messageService.confirm(
          'This will replace the current workspace with the selected file. Are you sure?',
          (result) => {
            if (result) {
              this.fileName = file.name;
              this.loadedFile = file;
              this.readFile(file);
            }
          },
          'Confirm Action',
          {
            confirmText: 'Yes, Continue',
            confirmButtonClass: 'btn-warning'
          }
        );
      } else {
        this.fileName = file.name;
        this.loadedFile = file;
        this.readFile(file);
      }
    }
  }

  private hasWorkspaceData(): boolean {
    return this.jsonContent !== null || this.flattenedDataSubject.value.length > 0;
  }

  openFilenamePromptModal(): void {
    this.showFilenamePromptModal = true;
    this.filenamePromptErrors = {};
  }

  closeFilenamePromptModal(): void {
    this.showFilenamePromptModal = false;
    this.filenamePromptErrors = {};
  }

  openExportFilenameModal(exportType: 'json' | 'excel'): void {
    this.currentExportType = exportType;
    this.showExportFilenameModal = true;
    this.exportFilenameErrors = {};
  }

  closeExportFilenameModal(): void {
    this.showExportFilenameModal = false;
    this.exportFilenameErrors = {};
  }

  onExportFilenameConfirm(data: FilenamePromptData): void {
    if (this.currentExportType === 'json') {
      this.exportFilenameErrors = this.validateFilename(data.filename);
      if (Object.keys(this.exportFilenameErrors).length === 0) {
        this.performJsonExport(data.filename);
        this.closeExportFilenameModal();
      }
    } else if (this.currentExportType === 'excel') {
      this.exportFilenameErrors = this.validateExcelExport(data.filename, data.additionalData ?? '');
      if (Object.keys(this.exportFilenameErrors).length === 0) {
        this.performExcelExport(data.filename, data.additionalData ?? '');
        this.closeExportFilenameModal();
      }
    }
  }

  onFilenameConfirm(data: FilenamePromptData): void {
    this.filenamePromptErrors = this.validateFilename(data.filename);

    if (Object.keys(this.filenamePromptErrors).length === 0) {
      // Create new translation file
      this.fileName = `${data.filename}.json`;
      this.jsonContent = {};
      this.originalJsonContent = {};
      this.flattenedDataSubject.next([]);
      this.errorMessage = '';
      this.toastr.success(`New translation file "${this.fileName}" created`, 'File Created');
      this.closeFilenamePromptModal();
    }
  }

  private performJsonExport(filename: string): void {
    const currentData = this.flattenedDataSubject.value;
    TranslationUtils.exportToJson(currentData, `${filename}.json`);
    this.toastr.success(`JSON file "${filename}.json" exported successfully`, 'Export Complete');
  }

  private performExcelExport(filename: string, languageCode: string): void {
    const currentData = this.flattenedDataSubject.value;
    TranslationUtils.exportToExcel(currentData, filename, languageCode);
    this.toastr.success(`Excel file "${filename}.xlsx" exported successfully`, 'Export Complete');
  }

  private validateFilename(filename: string): FilenamePromptErrors {
    const errors: FilenamePromptErrors = {};

    if (!filename.trim()) {
      errors.filename = 'Filename is required';
    } else if (filename.includes(' ')) {
      errors.filename = 'Filename cannot contain spaces';
    } else if (filename.includes('/') || filename.includes('\\')) {
      errors.filename = 'Filename cannot contain slashes';
    } else if (filename.includes('<') || filename.includes('>') || filename.includes(':') || filename.includes('"') || filename.includes('|') || filename.includes('?') || filename.includes('*')) {
      errors.filename = 'Filename contains invalid characters';
    } else if (filename.length > 100) {
      errors.filename = 'Filename is too long (max 100 characters)';
    }

    return errors;
  }

  private validateExcelExport(filename: string, languageCode: string): FilenamePromptErrors {
    const errors: FilenamePromptErrors = {};

    // Filename validation
    const filenameErrors = this.validateFilename(filename);
    if (filenameErrors.filename) {
      errors.filename = filenameErrors.filename;
    }

    // Language code validation
    if (!languageCode.trim()) {
      errors.additionalData = 'Language code is required';
    } else if (languageCode.length !== 2) {
      errors.additionalData = 'Language code must be exactly 2 characters';
    } else if (!/^[a-z]{2}$/.test(languageCode)) {
      errors.additionalData = 'Language code must contain only lowercase letters';
    }

    return errors;
  }

  private createEmptyTranslation(filename?: string): void {
    this.jsonContent = {};
    this.originalJsonContent = {};
    this.fileName = filename ? `${filename}.json` : 'new-translation.json';
    this.loadedFile = null;
    this.errorMessage = '';
    this.flattenedDataSubject.next([]);
    this.toastr.success('Created new empty translation file', 'New Translation Created');
  }

  private readFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        this.jsonContent = JSON.parse(content);
        this.originalJsonContent = JSON.parse(content);
        this.errorMessage = '';
        this.flattenObject();
        this.toastr.success(`Successfully loaded ${this.fileName}`, 'File Loaded');
      } catch (error) {
        console.error('Error parsing JSON:', error);
        this.errorMessage = 'Invalid JSON file. Please select a valid JSON file.';
        this.jsonContent = null;
        this.flattenedDataSubject.next([]);
        this.toastr.error('Invalid JSON file. Please select a valid JSON file.', 'Loading Failed');
      }
    };
    reader.readAsText(file);
  }

  private flattenObject(): void {
    const result = TranslationUtils.flattenObject(this.jsonContent);
    this.flattenedDataSubject.next(result);
  }

  onFilterClick(): void {
    this.filterTriggerSubject.next(this.filterText);
  }

  onFilterKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onFilterClick();
    }
  }

  editItem(key: string): void {
    const updatedData = TranslationUtils.updateItemInArray(
      this.flattenedDataSubject.value,
      key,
      (item) => ({
        ...item,
        isEditing: true,
        editValue: String(item.value),
        originalValue: item.value
      })
    );
    this.flattenedDataSubject.next(updatedData);
  }

  saveItem(key: string): void {
    const updatedData = TranslationUtils.updateItemInArray(
      this.flattenedDataSubject.value,
      key,
      (item) => {
        if (item.isEditing) {
          const newValue = item.editValue;
          const isChanged = TranslationUtils.isValueChanged(key, newValue, this.originalJsonContent);
          return {
            ...item,
            value: newValue,
            isEditing: false,
            editValue: undefined,
            originalValue: undefined,
            isChanged: isChanged
          };
        }
        return item;
      }
    );
    this.flattenedDataSubject.next(updatedData);
  }

  revertItem(key: string): void {
    const updatedData = TranslationUtils.updateItemInArray(
      this.flattenedDataSubject.value,
      key,
      (item) => {
        if (item.isEditing) {
          return {
            ...item,
            isEditing: false,
            editValue: undefined,
            originalValue: undefined
          };
        }
        return item;
      }
    );
    this.flattenedDataSubject.next(updatedData);
  }

  revertToOriginal(key: string): void {
    const updatedData = TranslationUtils.updateItemInArray(
      this.flattenedDataSubject.value,
      key,
      (item) => {
        const originalValue = TranslationUtils.getOriginalValue(key, this.originalJsonContent);
        return {
          ...item,
          value: originalValue,
          isChanged: false
        };
      }
    );
    this.flattenedDataSubject.next(updatedData);
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.addItemErrors = {};
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.addItemErrors = {};
  }

  onAddTranslation(data: AddTranslationData): void {
    this.addItemErrors = this.validateNewItem(data.key, data.value);

    if (Object.keys(this.addItemErrors).length === 0) {
      const currentData = this.flattenedDataSubject.value;
      const newItem: TranslationItem = {
        key: data.key,
        value: data.value,
        isChanged: true,
        isNew: true
      };

      const insertPosition = TranslationUtils.findInsertPosition(data.key, currentData);
      const updatedData = [
        ...currentData.slice(0, insertPosition),
        newItem,
        ...currentData.slice(insertPosition)
      ];
      this.flattenedDataSubject.next(updatedData);
      this.toastr.success(`Added new translation key: "${data.key}"`, 'Translation Added');
      this.closeAddModal();
    }
  }

  private validateNewItem(key: string, value: string): AddTranslationErrors {
    const errors: AddTranslationErrors = {};

    // Key validation
    if (!key.trim()) {
      errors.key = 'Key is required';
    } else if (key.includes(' ')) {
      errors.key = 'Key cannot contain whitespaces';
    } else if (key.includes('"')) {
      errors.key = 'Key cannot contain double quotes';
    } else if (this.keyExists(key)) {
      errors.key = 'Key already exists';
    }

    // Value validation
    if (!value || value.length < 1) {
      errors.value = 'Value must be at least 1 character long';
    }

    return errors;
  }

  private keyExists(key: string): boolean {
    const currentData = this.flattenedDataSubject.value;
    return currentData.some(item => item.key === key);
  }

  deleteItem(key: string): void {
    const updatedData = TranslationUtils.updateItemInArray(
      this.flattenedDataSubject.value,
      key,
      (item) => ({
        ...item,
        isDeleted: true,
        isEditing: false,
        editValue: undefined,
        originalValue: undefined
      })
    );
    this.flattenedDataSubject.next(updatedData);
  }

  restoreItem(key: string): void {
    const updatedData = TranslationUtils.updateItemInArray(
      this.flattenedDataSubject.value,
      key,
      (item) => ({
        ...item,
        isDeleted: false
      })
    );
    this.flattenedDataSubject.next(updatedData);
  }

  exportToJson(): void {
    if (!this.jsonContent || !this.fileName) {
      return;
    }

    const currentData = this.flattenedDataSubject.value;
    TranslationUtils.exportToJson(currentData, this.fileName);
    this.toastr.success('JSON file exported successfully', 'Export Complete');
  }

  openBulkImportModal(): void {
    this.showBulkImportModal = true;
    this.bulkImportErrors = {};
  }

  closeBulkImportModal(): void {
    this.showBulkImportModal = false;
    this.bulkImportErrors = {};
  }

  onBulkImport(data: BulkImportData): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        const validation = TranslationUtils.validateBulkImportFile(fileContent);

        if (!validation.isValid) {
          this.bulkImportErrors = {
            parsing: validation.error
          };
          return;
        }

        // Merge the new content with existing data
        const currentData = this.flattenedDataSubject.value;
        const mergedData = TranslationUtils.bulkImportTranslations(currentData, validation.content);

        // Update the flattened data
        this.flattenedDataSubject.next(mergedData);

        // Check for error items and show appropriate toast
        const errorItems = mergedData.filter(item => item.isError);
        const newItems = mergedData.filter(item => item.isNew && !item.isError);

        if (errorItems.length > 0) {
          this.toastr.error(
            `${errorItems.length} item(s) had conflicts and were marked as errors. Check the top of the list.`,
            'Import Completed with Errors',
            { timeOut: 5000 }
          );
        } else if (newItems.length > 0) {
          this.toastr.success(
            `Successfully imported ${newItems.length} new translation(s).`,
            'Import Successful'
          );
        }

        // Clear errors and close modal
        this.bulkImportErrors = {};
        this.closeBulkImportModal();

      } catch (error) {
        console.error('Error processing bulk import:', error);
        this.bulkImportErrors = {
          parsing: 'Failed to process the selected file. Please try again.'
        };
      }
    };

    reader.readAsText(data.file);
  }

  removeErrorItem(key: string): void {
    const updatedData = this.flattenedDataSubject.value.filter(item => item.key !== key);
    this.flattenedDataSubject.next(updatedData);
  }
}
