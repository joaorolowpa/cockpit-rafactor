import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'home',
        data: { breadcrumb: 'Home' },
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'administration',
        data: { breadcrumb: 'Administration' },
        children: [
          {
            path: '',
            redirectTo: 'users',
            pathMatch: 'full'
          },
          {
            path: 'users',
            data: { breadcrumb: 'Users' },
            loadComponent: () => import('./pages/administration/users/users.component').then(m => m.UsersComponent)
          }
        ]
      },
      {
        path: 'compliance',
        data: { breadcrumb: 'Compliance' },
        children: [
          {
            path: '',
            redirectTo: 'clients',
            pathMatch: 'full'
          },
          {
            path: 'clients',
            data: { breadcrumb: 'Clients' },
            loadComponent: () => import('./pages/compliance/clients/clients.component').then(m => m.ClientsComponent)
          },
          {
            path: 'investor-position',
            data: { breadcrumb: 'Investor Position' },
            loadComponent: () => import('./pages/compliance/investor-position/investor-position.component').then(m => m.InvestorPositionComponent)
          }
        ]
      },
      {
        path: 'research-funds',
        data: { breadcrumb: 'Research - Funds' },
        children: [
          {
            path: '',
            redirectTo: 'overview',
            pathMatch: 'full'
          },
          {
            path: 'overview',
            data: { breadcrumb: 'Overview' },
            loadComponent: () => import('./pages/research-funds/overview/overview.component').then(m => m.OverviewComponent)
          },
          {
            path: 'backoffice',
            data: { breadcrumb: 'Backoffice' },
            loadComponent: () => import('./pages/research-funds/backoffice/backoffice.component').then(m => m.BackofficeComponent)
          },
          {
            path: 'fund-managers',
            data: { breadcrumb: 'Fund Managers' },
            loadComponent: () => import('./pages/research-funds/fund-managers/funds.component').then(m => m.FundManagersComponent)
          },
          {
            path: 'fund-managers/:id',
            data: { breadcrumb: 'Fund Manager' },
            loadComponent: () => import('./pages/research-funds/fund-managers/fund-manager-detail/fund-manager-detail.component').then(m => m.FundManagerDetailComponent)
          }
        ]
      },
      {
        path: 'research-equities',
        data: { breadcrumb: 'Research - Equities' },
        children: [
          {
            path: '',
            redirectTo: 'companies',
            pathMatch: 'full'
          },
          {
            path: 'companies/:id',
            data: { breadcrumb: 'Company Details' },
            loadComponent: () =>
              import('./pages/research-equities/companies/company-detail/company-detail.component')
                .then(m => m.CompanyDetailComponent)
          },
          {
            path: 'companies',
            data: { breadcrumb: 'Companies' },
            loadComponent: () => import('./pages/research-equities/companies/companies.component').then(m => m.CompaniesComponent)
          },
          {
            path: 'coverage-list',
            data: { breadcrumb: 'Coverage List' },
            loadComponent: () => import('./pages/research-equities/coverage-list/coverage-list.component').then(m => m.CoverageListComponent)
          }
        ]
      },
      {
        path: 'research-manager',
        data: { breadcrumb: 'Research - Manager' },
        children: [
          {
            path: '',
            redirectTo: 'funds',
            pathMatch: 'full'
          },
          {
            path: 'funds',
            data: { breadcrumb: 'Funds' },
            loadComponent: () => import('./pages/research-funds/fund-managers/funds.component').then(m => m.FundManagersComponent)
          }
        ]
      },
      {
        path: 'wpa-accounting',
        data: { breadcrumb: 'WPA (Accounting)' },
        children: [
          {
            path: '',
            redirectTo: 'nav',
            pathMatch: 'full'
          },
          {
            path: 'nav',
            data: { breadcrumb: 'NAV' },
            loadComponent: () => import('./pages/wpa-accounting/nav/nav.component').then(m => m.NavComponent)
          },
          {
            path: 'create-assets',
            data: { breadcrumb: 'Create Assets' },
            loadComponent: () => import('./pages/wpa-accounting/create-assets/create-assets.component').then(m => m.CreateAssetsComponent)
          },
          {
            path: 'assets-values',
            data: { breadcrumb: 'Assets Values' },
            loadComponent: () => import('./pages/wpa-accounting/assets-values/assets-values.component').then(m => m.AssetsValuesComponent)
          },
          {
            path: 'deposits-ledger',
            data: { breadcrumb: 'Deposits Ledger' },
            loadComponent: () => import('./pages/wpa-accounting/deposits-ledger/deposits-ledger.component').then(m => m.DepositsLedgerComponent)
          },
          {
            path: 'controls',
            data: { breadcrumb: 'Controls' },
            loadComponent: () => import('./pages/wpa-accounting/controls/controls.component').then(m => m.ControlsComponent)
          }
        ]
      },
      {
        path: 'backoffice',
        data: { breadcrumb: 'Backoffice' },
        loadComponent: () => import('./pages/backoffice/backoffice.component').then(m => m.BackofficeComponent)
      }
    ]
  }
];
