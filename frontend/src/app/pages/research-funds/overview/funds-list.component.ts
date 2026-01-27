import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsTableComponent } from './funds-metrics-table/metrics-table.component';
import { GroupedFund } from '../../../models/funds.model';

@Component({
  selector: 'app-funds-accordion',
  standalone: true,
  imports: [CommonModule, MetricsTableComponent],
  templateUrl: './funds-list.component.html',
  styleUrl: './funds-list.component.scss'
})
export class FundsAccordionComponent {
  groupedFunds = input.required<GroupedFund[]>();
  
  protected expandedFund = signal<number | null>(null);
  protected expandedRelationship = signal<string | null>(null);

  protected toggleFund(index: number): void {
    this.expandedFund.set(
      this.expandedFund() === index ? null : index
    );
    this.expandedRelationship.set(null);
  }

  protected toggleRelationship(relationshipId: string): void {
    this.expandedRelationship.set(
      this.expandedRelationship() === relationshipId ? null : relationshipId
    );
  }

  protected isFundExpanded(index: number): boolean {
    return this.expandedFund() === index;
  }

  protected isRelationshipExpanded(relationshipId: string): boolean {
    return this.expandedRelationship() === relationshipId;
  }
}