import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { Fund, FundService } from './fund.service';

@Component({
  selector: 'app-fund-managers',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule],
  templateUrl: './funds.component.html',
  styleUrl: './funds.component.scss'
})
export class FundManagersComponent implements OnInit {
  funds = signal<Fund[]>([]);
  filteredFunds = signal<Fund[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(
    private router: Router,
    private fundService: FundService
  ) {}

  ngOnInit(): void {
    this.loadFunds();
  }

  loadFunds(): void {
    this.loading.set(true);
    this.error.set(null);

    this.fundService.getFundsManagers().subscribe({
      next: (funds) => {
        console.log('✅ Funds received:', funds.length);
        this.funds.set(funds);
        this.filteredFunds.set([...funds]);
        this.loading.set(false);
      },
      error: (err) => {
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

  onFundClick(fund: Fund): void {
    this.router.navigate(['/research-funds/fund-managers', fund.id]);
  }
}
