import { Component } from '@angular/core';

@Component({
  selector: 'div.table-container, div[appTableContainer]',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    class: 'table-container'
  },
  styleUrl: './table-container.component.scss'
})
export class TableContainerComponent {}
