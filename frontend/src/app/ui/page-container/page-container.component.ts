import { Component } from '@angular/core';

@Component({
  selector: 'div.page-container, div[appPageContainer]',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    class: 'page-container'
  }
})
export class PageContainerComponent {}
