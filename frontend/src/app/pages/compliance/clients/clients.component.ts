import { Component } from '@angular/core';
import { UI_IMPORTS } from '../../../ui/ui.imports';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [...UI_IMPORTS],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent {}
