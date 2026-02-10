import { Component, computed, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, UserRole } from '../../../../models/user.model';
import { UsersService } from '../user.service';
import { EditRolesDialogComponent } from '../users-edit-role-dialog/edit-roles-dialog.component';
import { UI_IMPORTS } from '../../../../ui/ui.imports';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, EditRolesDialogComponent, ...UI_IMPORTS],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss'
})
export class UsersTableComponent {
  private readonly usersService = inject(UsersService);
  
  users = input.required<User[]>();
  userUpdated = output<void>(); // Emite evento quando usuário é atualizado

  protected searchTerm = signal<string>('');
  protected selectedRole = signal<string>('');
  protected editingUser = signal<User | null>(null);
  protected showActionsMenu = signal<number | null>(null);
  protected confirmUserAction = signal<{ user: User; action: 'activate' | 'deactivate' } | null>(null);
  protected readonly confirmMessage = computed(() => {
    const state = this.confirmUserAction();
    if (!state) return '';
    return `Are you sure you want to ${state.action} ${state.user.name}?`;
  });

  protected get filteredUsers(): User[] {
    let filtered = this.users();

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    const role = this.selectedRole();
    if (role) {
      filtered = filtered.filter(user => user.roles.includes(role as UserRole));
    }

    return filtered;
  }

  protected get availableRoles(): string[] {
    const roles = new Set<string>();
    this.users().forEach(user => {
      user.roles.forEach(role => roles.add(role));
    });
    return Array.from(roles).sort();
  }

  protected toggleActionsMenu(userId: number): void {
    this.showActionsMenu.set(
      this.showActionsMenu() === userId ? null : userId
    );
  }

  protected openEditRoles(user: User): void {
    this.editingUser.set(user);
    this.showActionsMenu.set(null);
  }

  // ESTE É O MÉTODO CORRETO NO LUGAR CERTO
  protected toggleUserActive(user: User): void {
    this.showActionsMenu.set(null);
    const action = user.user_active ? 'deactivate' : 'activate';
    this.confirmUserAction.set({ user, action });
  }

  protected confirmToggleUser(): void {
    const state = this.confirmUserAction();
    if (!state) return;
    this.confirmUserAction.set(null);

    const { user, action } = state;

    const updateData = {
      email: user.email,
      name: user.name,
      roles: user.roles,
      user_active: !user.user_active
    };

    this.usersService.updateUser(updateData).subscribe({
      next: () => {
        console.log(`User ${action}d successfully`);
        this.userUpdated.emit(); // Emite evento para o componente pai recarregar
      },
      error: (error: any) => {
        console.error(`Error ${action}ing user:`, error);
        alert(`Failed to ${action} user. Please try again.`);
      }
    });
  }

  protected cancelToggleUser(): void {
    this.confirmUserAction.set(null);
  }

  protected closeEditDialog(): void {
    this.editingUser.set(null);
  }

  protected onRolesUpdated(): void {
    this.editingUser.set(null);
    this.userUpdated.emit(); // Emite evento para recarregar usuários
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set('');
  }
}
