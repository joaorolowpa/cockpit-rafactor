import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'administration',
        children: [
          {
            path: '',
            redirectTo: 'users',
            pathMatch: 'full'
          },
          {
            path: 'users',
            loadComponent: () => import('./pages/administration/users/users.component').then(m => m.UsersComponent)
          }
        ]
      },
      {
        path: 'compliance',
        children: [
          {
            path: '',
            redirectTo: 'clients',
            pathMatch: 'full'
          },
          {
            path: 'clients',
            loadComponent: () => import('./pages/compliance/clients/clients.component').then(m => m.ClientsComponent)
          },
          {
            path: 'investor-position',
            loadComponent: () => import('./pages/compliance/investor-position/investor-position.component').then(m => m.InvestorPositionComponent)
          }
        ]
      },
      {
        path: 'research-funds',
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            loadComponent: () => import('./pages/research-funds/overview/overview.component').then(m => m.OverviewComponent)
          },
          {
            path: 'backoffice',
            loadComponent: () => import('./pages/research-funds/backoffice/backoffice.component').then(m => m.BackofficeComponent)
          },
          {
            path: 'fund-managers',
            loadComponent: () => import('./pages/research-funds/fund-managers/fund-managers.component').then(m => m.FundManagersComponent)
          },
          {
            path: 'notes',
            loadComponent: () => import('./pages/research-funds/notes/notes.component').then(m => m.NotesComponent)
          }
        ]
      },
      {
        path: 'research-equities',
        children: [
          {
            path: '',
            redirectTo: 'companies',
            pathMatch: 'full'
          },
          {
            path: 'companies',
            loadComponent: () => import('./pages/research-equities/companies/companies.component').then(m => m.CompaniesComponent)
          },
          {
            path: 'coverage-list',
            loadComponent: () => import('./pages/research-equities/coverage-list/coverage-list.component').then(m => m.CoverageListComponent)
          }
        ]
      },
      {
        path: 'research-manager',
        children: [
          {
            path: '',
            redirectTo: 'funds',
            pathMatch: 'full'
          },
          {
            path: 'funds',
            loadComponent: () => import('./pages/research-manager/funds/funds.component').then(m => m.FundsComponent)
          }
        ]
      },
      {
        path: 'wpa-accounting',
        children: [
          {
            path: '',
            redirectTo: 'nav',
            pathMatch: 'full'
          },
          {
            path: 'nav',
            loadComponent: () => import('./pages/wpa-accounting/nav/nav.component').then(m => m.NavComponent)
          },
          {
            path: 'create-assets',
            loadComponent: () => import('./pages/wpa-accounting/create-assets/create-assets.component').then(m => m.CreateAssetsComponent)
          },
          {
            path: 'assets-values',
            loadComponent: () => import('./pages/wpa-accounting/assets-values/assets-values.component').then(m => m.AssetsValuesComponent)
          },
          {
            path: 'deposits-ledger',
            loadComponent: () => import('./pages/wpa-accounting/deposits-ledger/deposits-ledger.component').then(m => m.DepositsLedgerComponent)
          },
          {
            path: 'controls',
            loadComponent: () => import('./pages/wpa-accounting/controls/controls.component').then(m => m.ControlsComponent)
          }
        ]
      },
      {
        path: 'backoffice',
        loadComponent: () => import('./pages/backoffice/backoffice.component').then(m => m.BackofficeComponent)
      }
    ]
  }
];
