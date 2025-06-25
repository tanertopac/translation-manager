import * as XLSX from 'xlsx';

export interface TranslationItem {
  key: string;
  value: any;
  isEditing?: boolean;
  editValue?: string;
  originalValue?: any;
  isChanged?: boolean;
  isNew?: boolean;
  isDeleted?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export class TranslationUtils {
  static flattenObject(obj: any, prefix: string = ''): TranslationItem[] {
    if (!obj) {
      return [];
    }

    const result: TranslationItem[] = [];

    const flatten = (current: any, pre: string = '') => {
      if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
        Object.keys(current).forEach(key => {
          const newKey = pre ? `${pre}.${key}` : key;
          flatten(current[key], newKey);
        });
      } else {
        result.push({ key: pre, value: current });
      }
    };

    flatten(obj, prefix);
    return result;
  }

  static getOriginalValue(key: string, originalJsonContent: any): any {
    if (!originalJsonContent) return null;

    const keys = key.split('.');
    let current = originalJsonContent;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return current;
  }

  static isValueChanged(key: string, currentValue: any, originalJsonContent: any): boolean {
    const originalValue = TranslationUtils.getOriginalValue(key, originalJsonContent);
    return originalValue !== currentValue;
  }

  static updateItemInArray<T extends TranslationItem>(
    array: T[],
    key: string,
    updateFn: (item: T) => T
  ): T[] {
    return array.map(item => {
      if (item.key === key) {
        return updateFn(item);
      }
      return item;
    });
  }

  static findInsertPosition(newKey: string, currentData: TranslationItem[]): number {
    const newKeyParts = newKey.split('.');
    const newKeyPrefix = newKeyParts.slice(0, -1).join('.');

    // If it's a root level key (no dots), add at the end
    if (newKeyParts.length === 1) {
      return currentData.length;
    }

    // Find the last item that shares the same parent path
    let insertIndex = currentData.length;

    for (let i = currentData.length - 1; i >= 0; i--) {
      const currentKeyParts = currentData[i].key.split('.');
      const currentKeyPrefix = currentKeyParts.slice(0, -1).join('.');

      // If we find an item with the same parent path, insert after it
      if (currentKeyPrefix === newKeyPrefix) {
        insertIndex = i + 1;
        break;
      }

      // If we find an item that starts with our prefix (it's a parent),
      // continue looking for the last child of that parent
      if (currentData[i].key.startsWith(newKeyPrefix + '.')) {
        insertIndex = i + 1;
      }
    }

    return insertIndex;
  }

  static keyExistsInOriginal(key: string, originalJsonContent: any): boolean {
    if (!originalJsonContent) return false;

    const keys = key.split('.');
    let current = originalJsonContent;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return false;
      }
    }

    return true;
  }

  static unflattenToNestedObject(items: TranslationItem[]): any {
    const result: any = {};

    items.forEach(item => {
      // Skip deleted and error items
      if (item.isDeleted || item.isError) {
        return;
      }

      const keys = item.key.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
      }

      // Set the final value
      const finalKey = keys[keys.length - 1];
      current[finalKey] = item.value;
    });

    return result;
  }

  static createTimestampedFilename(originalFilename: string): string {
    const now = new Date();

    // Format: YYYY-MM-DD_HH-MM-SS
    const timestamp = now.getFullYear() +
      '-' + String(now.getMonth() + 1).padStart(2, '0') +
      '-' + String(now.getDate()).padStart(2, '0') +
      '_' + String(now.getHours()).padStart(2, '0') +
      '-' + String(now.getMinutes()).padStart(2, '0') +
      '-' + String(now.getSeconds()).padStart(2, '0');

    // Extract filename without extension and add timestamp
    const lastDotIndex = originalFilename.lastIndexOf('.');
    if (lastDotIndex > 0) {
      const nameWithoutExt = originalFilename.substring(0, lastDotIndex);
      const extension = originalFilename.substring(lastDotIndex);
      return `${nameWithoutExt}_${timestamp}${extension}`;
    } else {
      return `${originalFilename}_${timestamp}.json`;
    }
  }

  static exportToJson(items: TranslationItem[], filename: string): void {
    const nestedObject = TranslationUtils.unflattenToNestedObject(items);
    const jsonString = JSON.stringify(nestedObject, null, 2);

    // Create timestamped filename
    const exportFilename = TranslationUtils.createTimestampedFilename(filename);

    // Create and download the file
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = exportFilename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static exportToExcel(items: TranslationItem[], filename: string, languageCode: string): void {
    // Prepare Excel data with required columns
    const excelData = items
      .filter(item => TranslationUtils.shouldExportItem(item)) // Exclude deleted and error items
      .map(item => ({
        ID: '', // Empty as requested
        LANG: languageCode,
        KEY: item.key,
        TEXT: item.value
      }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Ensure header cells exist and style them (make it bold)
    const headers = ['ID', 'LANG', 'KEY', 'TEXT'];
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });

      // Ensure the cell exists
      worksheet[cellAddress] ??= { t: 's', v: header };

      // Apply bold styling
      worksheet[cellAddress].s ??= {};
      worksheet[cellAddress].s.font = { bold: true };
    });

    // Auto-resize columns to fit content
    const columnWidths: any[] = [];

    // Initialize column widths with header lengths
    headers.forEach((header, index) => {
      columnWidths[index] = { wch: header.length };
    });

    // Check each data row to find the maximum width needed
    excelData.forEach(row => {
      Object.values(row).forEach((value, index) => {
        const valueLength = String(value).length;
        if (valueLength > columnWidths[index].wch) {
          columnWidths[index].wch = Math.min(valueLength, 50); // Cap at 50 characters
        }
      });
    });

    // Apply column widths
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Translations');

    // Generate filename with .xlsx extension
    const exportFilename = filename.endsWith('.xlsx')
      ? filename
      : `${filename}.xlsx`;

    // Save the file
    XLSX.writeFile(workbook, exportFilename);
  }

  static validateExcelExportInputs(filename: string, languageCode: string): { filename?: string; languageCode?: string } {
    const errors: { filename?: string; languageCode?: string } = {};

    // Filename validation
    if (!filename.trim()) {
      errors.filename = 'Filename is required';
    }

    // Language code validation
    if (!languageCode.trim()) {
      errors.languageCode = 'Language code is required';
    } else if (languageCode.length !== 2) {
      errors.languageCode = 'Language code must be exactly 2 characters';
    } else if (!/^[a-z]{2}$/.test(languageCode)) {
      errors.languageCode = 'Language code must contain only lowercase letters';
    }

    return errors;
  }

  static bulkImportTranslations(
    existingItems: TranslationItem[],
    newJsonContent: any
  ): TranslationItem[] {
    if (!newJsonContent) {
      return existingItems;
    }

    const newItems = TranslationUtils.flattenObject(newJsonContent);
    const existingKeys = new Set(existingItems.map(item => item.key));
    const result: TranslationItem[] = [...existingItems];

    newItems.forEach(newItem => {
      if (existingKeys.has(newItem.key)) {
        // Mark as error - duplicate key
        result.push({
          ...newItem,
          isError: true,
          errorMessage: 'Duplicate key from bulk import',
          isNew: true
        });
      } else {
        // Add as new item
        result.push({
          ...newItem,
          isNew: true,
          isChanged: true
        });
      }
    });

    return result;
  }

  static validateBulkImportFile(fileContent: string): { isValid: boolean; error?: string; content?: any } {
    try {
      const content = JSON.parse(fileContent);

      if (!content || typeof content !== 'object') {
        return {
          isValid: false,
          error: 'File must contain a valid JSON object'
        };
      }

      // Check if the JSON contains nested objects or just primitives
      const hasValidStructure = Object.values(content).every(value =>
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        (typeof value === 'object' && value !== null)
      );

      if (!hasValidStructure) {
        return {
          isValid: false,
          error: 'File contains invalid translation structure'
        };
      }

      return {
        isValid: true,
        content: content
      };
    } catch (error) {
      console.error('JSON parsing error:', error);
      return {
        isValid: false,
        error: 'Invalid JSON format. Please check your file syntax.'
      };
    }
  }

  static shouldExportItem(item: TranslationItem): boolean {
    // Don't export deleted or error items
    return !item.isDeleted && !item.isError;
  }
}
