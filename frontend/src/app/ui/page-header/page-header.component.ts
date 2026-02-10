import { Component } from '@angular/core';

@Component({
  selector: 'div.page-header, div[appPageHeader]',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    class: 'page-header'
  }
})
export class PageHeaderComponent {}
