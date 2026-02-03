import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupedFund, Fund } from '../../../models/funds.model';
import { FundsAccordionComponent } from './funds-list.component';
import { FundsService } from '../funds.service';


@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, FundsAccordionComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  private readonly fundsService = inject(FundsService);

  protected isLoading = signal<boolean>(true);
  protected groupedFunds = signal<GroupedFund[]>([]);
  protected error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  protected loadData(): void {  // MUDOU: private -> protected
    this.isLoading.set(true);
    this.error.set(null);

    this.fundsService.getFundManagers().subscribe({
      next: (funds: Fund[]) => {  // ADICIONOU TIPO
        if (funds.length === 0) {
          this.isLoading.set(false);
          return;
        }

        this.fundsService.getGroupedFundsData(funds).subscribe({
          next: (groupedData: GroupedFund[]) => {  // ADICIONOU TIPO
            this.groupedFunds.set(groupedData);
            this.isLoading.set(false);
          },
          error: (err: any) => {  // ADICIONOU TIPO
            console.error('Error loading grouped data:', err);
            this.error.set('Failed to load fund metrics');
            this.isLoading.set(false);
          }
        });
      },
      error: (err: any) => {  // ADICIONOU TIPO
        console.error('Error loading funds:', err);
        this.error.set('Failed to load funds');
        this.isLoading.set(false);
      }
    });
  }
}
