import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { CompaniesService } from '../companies.service';
import { Company } from '../../../models/companies.model';
import { CompanyFormDialogComponent } from './company-form-dialog/company-form-dialog.component';
import { UI_IMPORTS } from '../../../ui/ui.imports';

@Component({
  selector: 'app-coverage-list',
  standalone: true,
  imports: [CommonModule, CompanyFormDialogComponent, ...UI_IMPORTS],
  templateUrl: './coverage-list.component.html',
  styleUrl: './coverage-list.component.scss'
})
export class CoverageListComponent implements OnInit {
  companies = signal<Company[]>([]);
  filteredCompanies = signal<Company[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  showDialog = signal<boolean>(false);
  editingCompany = signal<Company | null>(null);
  confirmTarget = signal<Company | null>(null);

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

  openCreateDialog(): void {
    this.editingCompany.set(null);
    this.showDialog.set(true);
  }

  openEditDialog(company: Company): void {
    this.editingCompany.set(company);
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.editingCompany.set(null);
  }

  onCompanySaved(): void {
    this.closeDialog();
    this.loadCompanies();
  }

  requestDeleteCompany(company: Company): void {
    if (!this.isDeletable(company)) return;
    this.confirmTarget.set(company);
  }

  confirmDeleteCompany(): void {
    const company = this.confirmTarget();
    if (!company) return;
    this.confirmTarget.set(null);

    this.companiesService.deleteCompany(company.id).subscribe({
      next: () => {
        this.loadCompanies();
      },
      error: (error: unknown) => {
        console.error('Error deleting company:', error);
      }
    });
  }

  cancelDeleteCompany(): void {
    this.confirmTarget.set(null);
  }

  isDeletable(company: Company): boolean {
    const createdAt = new Date(company.created_at);
    if (Number.isNaN(createdAt.getTime())) return false;
    const diffMs = Date.now() - createdAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  }

  formatCreatedAt(value: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return formatDate(date, 'MMM d, y, HH:mm', 'en-US');
  }

  formatAnalysts(analysts?: { name: string }[]): string {
    if (!analysts || analysts.length === 0) return '-';
    return analysts.map(analyst => analyst.name).join(', ');
  }

  trackById(_index: number, item: Company): number {
    return item.id;
  }
}
