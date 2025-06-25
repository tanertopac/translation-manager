# TranslationManager

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.15.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Features

### Translation Management
- **Load JSON Files**: Import existing translation files
- **Edit Translations**: In-line editing with real-time updates
- **Add New Keys**: Create new translation entries with validation
- **Bulk Import**: Import multiple translations from another JSON file
- **Delete/Restore**: Soft delete translations with restore functionality
- **Filter**: Search translations by key name

### Export Options
- **JSON Export**: Export modified translations back to JSON with timestamps
- **Excel Export**: Export translations to Excel format with configurable language codes

### Error Handling
- **Duplicate Detection**: Automatically detect and flag duplicate keys from bulk imports
- **Validation**: File format validation and error reporting
- **Visual Indicators**: Color-coded items (new, modified, deleted, errors)

## Usage

1. **Load a Translation File**: Click "Load Translation File" and select a JSON file
2. **Edit Translations**: Click the edit button (✏️) next to any translation to modify it
3. **Add New Translations**: Use the "+ Add" button to create new translation keys
4. **Bulk Import**: Use "📁 Add in Bulk" to import translations from another JSON file
5. **Export**: Choose between JSON or Excel export formats

### Bulk Import Notes
- Duplicate keys will be marked as errors and excluded from exports
- Invalid entries are highlighted and can be removed
- The bulk import feature merges new translations with existing ones
