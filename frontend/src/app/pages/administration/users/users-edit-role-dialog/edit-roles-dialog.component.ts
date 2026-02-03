import { Component, input, output, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { User, UserRole } from '../../../../models/user.model';
import { UsersService } from '../user.service';


@Component({
  selector: 'app-edit-roles-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, CheckboxModule],
  templateUrl: './edit-roles-dialog.component.html',
  styleUrl: './edit-roles-dialog.component.scss'
})
export class EditRolesDialogComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  user = input.required<User>();
  close = output<void>();
  rolesUpdated = output<void>();

  protected selectedRoles = signal<UserRole[]>([]);
  protected isSubmitting = signal<boolean>(false);
  protected showSummary = signal<boolean>(true);

  protected readonly availableRoles = Object.values(UserRole);

  ngOnInit(): void {
    this.selectedRoles.set([...this.user().roles]);
  }

  protected toggleRole(role: UserRole): void {
    const current = this.selectedRoles();
    if (current.includes(role)) {
      this.selectedRoles.set(current.filter(r => r !== role));
    } else {
      this.selectedRoles.set([...current, role]);
    }
  }

  protected isRoleSelected(role: UserRole): boolean {
    return this.selectedRoles().includes(role);
  }

  protected toggleSummary(): void {
    this.showSummary.set(!this.showSummary());
  }

  protected onSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const updateData = {
      email: this.user().email,
      name: this.user().name,
      user_active: this.user().user_active,
      roles: this.selectedRoles()
    };

    this.usersService.updateUser(updateData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.rolesUpdated.emit();
      },
      error: (error) => {
        console.error('Error updating roles:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }
}
