import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, inject } from '@angular/core';
import { ConfirmationModalComponent } from '../components/confirmation-modal/confirmation-modal.component';

export interface ConfirmConfig {
  cancelText?: string;
  confirmText?: string;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  confirm(
    message: string,
    callback: (result: boolean) => void,
    title: string = 'Confirm Action',
    config?: ConfirmConfig
  ): void {
    // Create the component
    const componentRef = createComponent(ConfirmationModalComponent, {
      environmentInjector: this.injector
    });

    // Set the input values
    componentRef.setInput('isVisible', true);
    componentRef.setInput('title', title);
    componentRef.setInput('message', message);
    componentRef.setInput('cancelText', config?.cancelText ?? 'Cancel');
    componentRef.setInput('confirmText', config?.confirmText ?? 'Confirm');
    componentRef.setInput('confirmButtonClass', config?.confirmButtonClass ?? 'btn-primary');

    // Subscribe to the confirm output
    componentRef.instance.confirm.subscribe((result: boolean) => {
      callback(result);
      this.destroyComponent(componentRef);
    });

    // Attach the component to the application
    this.appRef.attachView(componentRef.hostView);

    // Append to document body
    const domElement = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElement);
  }

  private destroyComponent(componentRef: ComponentRef<ConfirmationModalComponent>): void {
    // Remove from DOM
    const domElement = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    domElement?.parentNode?.removeChild(domElement);

    // Detach from application
    this.appRef.detachView(componentRef.hostView);

    // Destroy the component
    componentRef.destroy();
  }
}
