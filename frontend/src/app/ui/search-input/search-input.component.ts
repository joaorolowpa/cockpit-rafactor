import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})
export class SearchInputComponent {
  @Input() value = '';
  @Input() placeholder = 'Search...';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  protected onInput(event: Event): void {
    const nextValue = (event.target as HTMLInputElement).value;
    this.valueChange.emit(nextValue);
  }

  protected onClear(): void {
    this.cleared.emit();
  }
}
