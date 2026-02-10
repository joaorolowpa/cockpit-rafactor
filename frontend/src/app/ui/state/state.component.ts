import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

type StateType = 'loading' | 'error' | 'empty';
type StateSize = 'default' | 'small' | 'compact';

@Component({
  selector: 'app-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './state.component.html',
  styleUrl: './state.component.scss'
})
export class StateComponent {
  @Input() type: StateType = 'loading';
  @Input() icon = '';
  @Input() message = '';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionVariant: 'primary' | 'secondary' | 'ghost' | 'text' = 'secondary';
  @Input() size: StateSize = 'default';

  @Output() action = new EventEmitter<void>();

  protected get stateClass(): string {
    const base = `${this.type}-state`;
    const size = this.size !== 'default' ? ` ${this.size}` : '';
    return `${base}${size}`;
  }
}
