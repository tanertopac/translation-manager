import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideAnimations(),
        provideToastr({
          timeOut: 3000,
          positionClass: 'toast-top-right',
          preventDuplicates: true,
          progressBar: true,
          closeButton: true
        })
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'translation-manager' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('translation-manager');
  });

  it('should render translation manager navbar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.navbar-brand')?.textContent).toContain('Translation Manager');
  });

  it('should show add modal when openAddModal is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.openAddModal();
    expect(app.showAddModal).toBe(true);
  });

  it('should show export filename modal when openExportFilenameModal is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.openExportFilenameModal('excel');
    expect(app.showExportFilenameModal).toBe(true);
    expect(app.currentExportType).toBe('excel');
  });

  it('should show filename prompt modal when openFilenamePromptModal is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.openFilenamePromptModal();
    expect(app.showFilenamePromptModal).toBe(true);
  });
});
