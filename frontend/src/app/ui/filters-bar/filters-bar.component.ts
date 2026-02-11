import { Component } from '@angular/core';

@Component({
  selector: 'div.filters-bar, div[appFiltersBar]',
  standalone: true,
  template: '<ng-content></ng-content>',
  host: {
    class: 'filters-bar'
  },
  styleUrl: './filters-bar.component.scss'
})
export class FiltersBarComponent {}
