import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'div.table-wrapper, div[appTableWrapper]',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    class: 'table-wrapper'
  }
})
export class TableWrapperComponent {
  @Input() compact = false;

  @HostBinding('class.compact')
  get isCompact(): boolean {
    return this.compact;
  }
}
