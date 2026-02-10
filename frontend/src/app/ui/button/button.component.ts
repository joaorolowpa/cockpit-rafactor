import { Component, HostBinding, Input } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text' | 'outline' | 'danger';
type ButtonSize = 'default' | 'compact';

@Component({
  selector: 'button.btn, a.btn, button[appButton], a[appButton]',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'secondary';
  @Input() size: ButtonSize = 'default';
  @Input() iconOnly = false;

  @HostBinding('class.btn')
  readonly baseClass = true;

  @HostBinding('class.btn-primary')
  get isPrimary(): boolean {
    return this.variant === 'primary';
  }

  @HostBinding('class.btn-secondary')
  get isSecondary(): boolean {
    return this.variant === 'secondary';
  }

  @HostBinding('class.btn-ghost')
  get isGhost(): boolean {
    return this.variant === 'ghost';
  }

  @HostBinding('class.btn-text')
  get isText(): boolean {
    return this.variant === 'text';
  }

  @HostBinding('class.btn-outline')
  get isOutline(): boolean {
    return this.variant === 'outline';
  }

  @HostBinding('class.btn-danger')
  get isDanger(): boolean {
    return this.variant === 'danger';
  }

  @HostBinding('class.btn-icon')
  get isIconOnly(): boolean {
    return this.iconOnly;
  }

  @HostBinding('class.btn-compact')
  get isCompact(): boolean {
    return this.size === 'compact';
  }
}
