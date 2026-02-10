import { Component } from '@angular/core';

@Component({
  selector: 'table.data-table, table[appDataTable]',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    class: 'data-table'
  }
})
export class DataTableComponent {}
