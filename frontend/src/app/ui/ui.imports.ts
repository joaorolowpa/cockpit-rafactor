import { ButtonComponent } from './button/button.component';
import { CheckboxComponent } from './checkbox/checkbox.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { DataTableComponent } from './data-table/data-table.component';
import { DialogComponent } from './dialog/dialog.component';
import { FiltersBarComponent } from './filters-bar/filters-bar.component';
import { PageActionsComponent } from './page-actions/page-actions.component';
import { PageContainerComponent } from './page-container/page-container.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { SearchInputComponent } from './search-input/search-input.component';
import { StateComponent } from './state/state.component';
import { TableContainerComponent } from './table-container/table-container.component';
import { TableWrapperComponent } from './table-wrapper/table-wrapper.component';

export const UI_IMPORTS = [
  ButtonComponent,
  CheckboxComponent,
  ConfirmDialogComponent,
  DataTableComponent,
  DialogComponent,
  FiltersBarComponent,
  PageActionsComponent,
  PageContainerComponent,
  PageHeaderComponent,
  SearchInputComponent,
  StateComponent,
  TableContainerComponent,
  TableWrapperComponent
] as const;
