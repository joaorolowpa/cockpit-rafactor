import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Fund, FundService } from './fund.service';

@Component({
  selector: 'app-fund-managers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './funds.component.html',
  styleUrl: './funds.component.scss'
})
export class FundManagersComponent implements OnInit {
  funds: Fund[] = [];
  filteredFunds: Fund[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private fundService: FundService
  ) {
    console.log('Component initialized'); // ✅ Debug
  }

  ngOnInit(): void {
    console.log('ngOnInit called'); // ✅ Debug
    this.loadFunds();
  }

  loadFunds(): void {
    console.log('loadFunds started, loading:', this.loading); // ✅ Debug
    this.loading = true;
    this.error = null;

    this.fundService.getFundsManagers().subscribe({
      next: (funds) => {
        console.log('✅ Funds received:', funds); // ✅ Debug
        console.log('✅ Number of funds:', funds.length); // ✅ Debug
        this.funds = funds;
        this.filteredFunds = [...funds];
        this.loading = false; // ✅ IMPORTANTE
        console.log('Loading set to false:', this.loading); // ✅ Debug
      },
      error: (err) => {
        console.error('❌ Error loading funds:', err); // ✅ Debug
        this.error = 'Failed to load fund managers';
        this.loading = false; // ✅ IMPORTANTE
        console.log('Loading set to false (error):', this.loading); // ✅ Debug
      },
      complete: () => {
        console.log('✅ Observable completed'); // ✅ Debug
      }
    });

    console.log('loadFunds called, loading is now:', this.loading); // ✅ Debug
  }

  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredFunds = [...this.funds];
      return;
    }

    this.filteredFunds = this.funds.filter(fund => 
      fund.display_name.toLowerCase().includes(term)
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredFunds = [...this.funds];
  }

  onFundClick(fund: Fund): void {
    console.log('Fund clicked:', fund); // ✅ Debug
    this.router.navigate(['/research-funds/fund-managers', fund.id]);
  }
}