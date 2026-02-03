import { AfterViewInit, Component, ElementRef, ViewChild, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss'
})
export class RichTextEditorComponent implements AfterViewInit {
  label = input<string>('');
  placeholder = input<string>('');
  value = input<string>('');
  valueChange = output<string>();

  @ViewChild('editable') editable?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      const el = this.editable?.nativeElement;
      if (!el) return;
      if (document.activeElement === el) return;
      const nextValue = this.value() ?? '';
      if (el.innerHTML !== nextValue) {
        el.innerHTML = nextValue;
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.editable?.nativeElement;
    if (!el) return;
    const nextValue = this.value() ?? '';
    if (el.innerHTML !== nextValue) {
      el.innerHTML = nextValue;
    }
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLDivElement | null;
    if (!target) return;
    this.valueChange.emit(target.innerHTML);
  }

  protected onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  }

  protected exec(command: string, value?: string): void {
    this.editable?.nativeElement.focus();
    document.execCommand(command, false, value);
    this.valueChange.emit(this.editable?.nativeElement.innerHTML ?? '');
  }

  protected insertLink(): void {
    const url = prompt('Enter URL');
    if (!url) return;
    this.exec('createLink', url);
  }

  protected get isEmpty(): boolean {
    const current = this.value() ?? '';
    return current.trim().length === 0;
  }
}
