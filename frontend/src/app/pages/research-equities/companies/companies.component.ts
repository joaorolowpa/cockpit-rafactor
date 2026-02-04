import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Company } from '../../../models/companies.model';
import { CompaniesService } from '../companies.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.scss'
})
export class CompaniesComponent implements OnInit {
  companies = signal<Company[]>([]);
  filteredCompanies = signal<Company[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  constructor(private companiesService: CompaniesService) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loading.set(true);
    this.error.set(null);

    this.companiesService.getCompanies().subscribe({
      next: (companies: Company[]) => {
        this.companies.set(companies);
        this.filteredCompanies.set([...companies]);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading companies:', err);
        this.error.set('Failed to load companies');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    const term = this.searchTerm().toLowerCase().trim();

    if (!term) {
      this.filteredCompanies.set([...this.companies()]);
      return;
    }

    this.filteredCompanies.set(
      this.companies().filter(company =>
        company.display_name.toLowerCase().includes(term)
      )
    );
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.filteredCompanies.set([...this.companies()]);
  }
}
