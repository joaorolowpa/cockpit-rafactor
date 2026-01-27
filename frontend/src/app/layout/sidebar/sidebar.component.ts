import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  protected readonly expandedItems = signal<Set<string>>(new Set());
  protected readonly isCollapsed = signal<boolean>(false);
  protected searchTerm = signal<string>('');
  
  protected readonly menuItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'fas fa-home',
      route: '/home'
    },
    {
      label: 'Administration',
      icon: 'fas fa-cog',
      route: '/administration',
      children: [
        {
          label: 'Users',
          route: '/administration/users'
        }
      ]
    },
    {
      label: 'Compliance',
      icon: 'fa-solid fa-shield',
      route: '/compliance',
      children: [
        {
          label: 'Clients',
          route: '/compliance/clients'
        },
        {
          label: 'Investor Position',
          route: '/compliance/investor-position'
        }
      ]
    },
    {
      label: 'Research - Funds',
      icon: 'fas fa-graduation-cap',
      route: '/research-funds',
      children: [
        {
          label: 'Overview',
          route: '/research-funds/overview'
        },
        {
          label: 'Backoffice',
          route: '/research-funds/backoffice'
        },
        {
          label: 'Fund Managers',
          route: '/research-funds/fund-managers'
        },
        {
          label: 'Notes',
          route: '/research-funds/notes'
        }
      ]
    },
    {
      label: 'Research - Equities',
      icon: 'fas fa-graduation-cap',
      route: '/research-equities',
      children: [
        {
          label: 'Companies',
          route: '/research-equities/companies'
        },
        {
          label: 'Coverage List',
          route: '/research-equities/coverage-list'
        }
      ]
    },
    {
      label: 'Research - Manager',
      icon: 'fas fa-graduation-cap',
      route: '/research-manager',
      children: [
        {
          label: 'Funds',
          route: '/research-manager/funds'
        }
      ]
    },
    {
      label: 'WPA (Accounting)',
      icon: 'fas fa-file-alt',
      route: '/wpa-accounting',
      children: [
        {
          label: 'NAV',
          route: '/wpa-accounting/nav'
        },
        {
          label: 'Create Assets',
          route: '/wpa-accounting/create-assets'
        },
        {
          label: 'Assets Values',
          route: '/wpa-accounting/assets-values'
        },
        {
          label: 'Deposits Ledger',
          route: '/wpa-accounting/deposits-ledger'
        },
        {
          label: 'Controls',
          route: '/wpa-accounting/controls'
        }
      ]
    },
    {
      label: 'Backoffice',
      icon: 'fas fa-folder',
      route: '/backoffice'
    },
    {
      label: 'Developer Utils',
      icon: 'fas fa-code',
      route: '/developer-utils'
    }
  ];

  protected readonly userMenuItem: MenuItem = {
    label: 'João LOCAL DEV',
    icon: 'fas fa-user',
    route: '#'
  };

  ngOnInit(): void {
    // Expand sidebar by default on large screens
    if (window.innerWidth > 768) {
      this.isCollapsed.set(false);
    } else {
      this.isCollapsed.set(true);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768 && this.isCollapsed()) {
      this.isCollapsed.set(false);
    }
  }

  protected toggleExpand(itemLabel: string): void {
    if (this.isCollapsed()) return;
    
    const expanded = this.expandedItems();
    if (expanded.has(itemLabel)) {
      expanded.delete(itemLabel);
    } else {
      expanded.add(itemLabel);
    }
    this.expandedItems.set(new Set(expanded));
  }

  protected isExpanded(itemLabel: string): boolean {
    return this.expandedItems().has(itemLabel);
  }

  protected toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
    if (this.isCollapsed()) {
      this.expandedItems.set(new Set());
    }
  }

  protected onSearchClick(): void {
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
      // Focus on input after animation
      setTimeout(() => {
        const input = document.querySelector('.search-input') as HTMLInputElement;
        input?.focus();
      }, 300);
    }
  }

  protected onSearchChange(value: string): void {
    this.searchTerm.set(value.toLowerCase());
    
    if (value) {
      const itemsToExpand = new Set<string>();
      this.menuItems.forEach(item => {
        if (item.children && this.hasMatchingChildren(item)) {
          itemsToExpand.add(item.label);
        }
      });
      this.expandedItems.set(itemsToExpand);
    }
  }

  protected getFilteredMenuItems(): MenuItem[] {
    const term = this.searchTerm();
    if (!term) {
      return this.menuItems;
    }

    return this.menuItems.map(item => {
      if (item.label.toLowerCase().includes(term)) {
        return item;
      }

      if (item.children) {
        const filteredChildren = item.children.filter(child =>
          child.label.toLowerCase().includes(term)
        );

        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren };
        }
      }

      return null;
    }).filter(item => item !== null) as MenuItem[];
  }

  private hasMatchingChildren(item: MenuItem): boolean {
    const term = this.searchTerm();
    if (!item.children) return false;
    
    return item.children.some(child =>
      child.label.toLowerCase().includes(term)
    );
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
    this.expandedItems.set(new Set());
  }
}