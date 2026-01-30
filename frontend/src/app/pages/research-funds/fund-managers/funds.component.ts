import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RouterLink } from '@angular/router';
import { Fund } from '../../../models/funds.model';
import { FundsService } from '../funds.service';

@Component({
  selector: 'app-fund-managers',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, RouterLink],
  templateUrl: './funds.component.html',
  styleUrl: './funds.component.scss'
})
export class FundManagersComponent implements OnInit {
  funds = signal<Fund[]>([]);
  filteredFunds = signal<Fund[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private fundService: FundsService) {}

  ngOnInit(): void {
    this.loadFunds();
  }

  loadFunds(): void {
    this.loading.set(true);
    this.error.set(null);

    this.fundService.getFundManagers().subscribe({
      next: (funds: Fund[]) => {
        console.log('✅ Funds received:', funds.length);
        this.funds.set(funds);
        this.filteredFunds.set([...funds]);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('❌ Error loading funds:', err);
        this.error.set('Failed to load fund managers');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm().toLowerCase().trim();
    
    if (!term) {
      this.filteredFunds.set([...this.funds()]);
      return;
    }

    this.filteredFunds.set(
      this.funds().filter(fund => 
        fund.display_name.toLowerCase().includes(term)
      )
    );
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.filteredFunds.set([...this.funds()]);
  }
}
