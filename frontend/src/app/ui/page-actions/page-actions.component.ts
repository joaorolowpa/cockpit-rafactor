import { Component } from '@angular/core';

@Component({
  selector: 'div.page-actions, div[appPageActions]',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    class: 'page-actions'
  }
})
export class PageActionsComponent {}
