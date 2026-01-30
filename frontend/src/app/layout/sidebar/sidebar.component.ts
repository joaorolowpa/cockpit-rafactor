import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface SidebarMenuItem {
  label: string;
  icon?: string;
  routerLink?: string;
  items?: SidebarMenuItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  protected readonly isCollapsed = signal<boolean>(false);
  protected searchTerm = signal<string>('');
  protected readonly expandedItems = signal<Record<string, boolean>>({});

  protected readonly menuItems: SidebarMenuItem[] = [
    {
      label: 'Home',
      icon: 'fa-solid fa-house',
      routerLink: '/home'
    },
    {
      label: 'Administration',
      icon: 'fa-solid fa-users',
      items: [
        {
          label: 'Users',
          routerLink: '/administration/users'
        }
      ]
    },
    {
      label: 'Compliance',
      icon: 'fa-solid fa-shield',
      items: [
        {
          label: 'Clients',
          routerLink: '/compliance/clients'
        },
        {
          label: 'Investor Position',
          routerLink: '/compliance/investor-position'
        }
      ]
    },
    {
      label: 'Research - Funds',
      icon: 'fa-solid fa-chart-line',
      items: [
        {
          label: 'Overview',
          routerLink: '/research-funds/overview'
        },
        {
          label: 'Backoffice',
          routerLink: '/research-funds/backoffice'
        },
        {
          label: 'Fund Managers',
          routerLink: '/research-funds/fund-managers'
        },
        {
          label: 'Notes',
          routerLink: '/research-funds/notes'
        }
      ]
    },
    {
      label: 'Research - Equities',
      icon: 'fa-solid fa-chart-bar',
      items: [
        {
          label: 'Companies',
          routerLink: '/research-equities/companies'
        },
        {
          label: 'Coverage List',
          routerLink: '/research-equities/coverage-list'
        }
      ]
    },
    {
      label: 'Research - Manager',
      icon: 'fa-solid fa-briefcase',
      items: [
        {
          label: 'Funds',
          routerLink: '/research-manager/funds'
        }
      ]
    },
    {
      label: 'WPA (Accounting)',
      icon: 'fa-solid fa-database',
      items: [
        {
          label: 'NAV',
          routerLink: '/wpa-accounting/nav'
        },
        {
          label: 'Create Assets',
          routerLink: '/wpa-accounting/create-assets'
        },
        {
          label: 'Assets Values',
          routerLink: '/wpa-accounting/assets-values'
        },
        {
          label: 'Deposits Ledger',
          routerLink: '/wpa-accounting/deposits-ledger'
        },
        {
          label: 'Controls',
          routerLink: '/wpa-accounting/controls'
        }
      ]
    },
    {
      label: 'Backoffice',
      icon: 'fa-solid fa-folder',
      routerLink: '/backoffice'
    }
  ];

  protected readonly userMenuItem: SidebarMenuItem = {
    label: 'Joao LOCAL DEV',
    icon: 'fa-solid fa-user',
    routerLink: '#'
  };

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
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

  protected toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  protected onSearchClick(): void {
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
      setTimeout(() => {
        const input = document.querySelector('.search-input') as HTMLInputElement;
        input?.focus();
      }, 300);
    }
  }

  protected onSearchChange(value: string): void {
    this.searchTerm.set(value.toLowerCase());
  }

  protected getFilteredMenuItems(): SidebarMenuItem[] {
    const term = this.searchTerm();
    if (!term) {
      return this.menuItems;
    }

    return this.menuItems
      .map(item => {
        const itemMatches = (item.label ?? '').toLowerCase().includes(term);
        const children = item.items ?? [];
        const filteredChildren = children.filter(child =>
          (child.label ?? '').toLowerCase().includes(term)
        );

        if (itemMatches) {
          return { ...item, expanded: true };
        }

        if (filteredChildren.length > 0) {
          return { ...item, items: filteredChildren, expanded: true };
        }

        return null;
      })
      .filter(item => item !== null) as SidebarMenuItem[];
  }

  protected toggleItem(item: SidebarMenuItem): void {
    if (!item.items || item.items.length === 0) {
      return;
    }

    const key = item.label;
    const isExpanded = this.expandedItems()[key] ?? false;
    this.expandedItems.set({ ...this.expandedItems(), [key]: !isExpanded });
  }

  protected isItemExpanded(item: SidebarMenuItem): boolean {
    if (item.expanded) {
      return true;
    }

    if (this.searchTerm() && item.items && item.items.length > 0) {
      return true;
    }

    return this.expandedItems()[item.label] ?? false;
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected onNavigate(item: SidebarMenuItem, event: Event, parent?: SidebarMenuItem): void {
    if (!item.routerLink) {
      return;
    }

    if (this.isCollapsed()) {
      event.preventDefault();
      this.isCollapsed.set(false);
      if (parent) {
        this.expandedItems.set({ ...this.expandedItems(), [parent.label]: true });
      }
      setTimeout(() => {
        void this.router.navigateByUrl(item.routerLink!);
      }, 250);
    }
  }
}
