import { Component } from '@angular/core';
import { UI_IMPORTS } from '../../ui/ui.imports';

@Component({
  selector: 'app-backoffice-page',
  standalone: true,
  imports: [...UI_IMPORTS],
  templateUrl: './backoffice.component.html',
  styleUrl: './backoffice.component.scss'
})
export class BackofficeComponent {}
