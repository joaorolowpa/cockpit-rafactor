import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

type DialogSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: DialogSize = 'md';
  @Input() dialogClass = '';
  @Input() closeOnOverlay = true;
  @Input() showClose = true;

  @Output() close = new EventEmitter<void>();

  protected get sizeClass(): string {
    return `dialog-${this.size}`;
  }

  protected onOverlayClick(): void {
    if (this.closeOnOverlay) {
      this.close.emit();
    }
  }
}
