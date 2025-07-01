import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent {
  // Inputs
  isVisible = input<boolean>(false);
  title = input<string>('Confirm Action');
  message = input<string>('Are you sure you want to continue?');
  cancelText = input<string>('Cancel');
  confirmText = input<string>('Confirm');
  confirmButtonClass = input<string>('btn-warning');

  // Output
  confirm = output<boolean>();

  onCancel() {
    this.confirm.emit(false);
  }

  onConfirm() {
    this.confirm.emit(true);
  }
}
