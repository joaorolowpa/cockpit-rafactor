import { Component } from '@angular/core';
import { UI_IMPORTS } from '../../../ui/ui.imports';

@Component({
  selector: 'app-investor-position',
  standalone: true,
  imports: [...UI_IMPORTS],
  templateUrl: './investor-position.component.html',
  styleUrl: './investor-position.component.scss'
})
export class InvestorPositionComponent {}
