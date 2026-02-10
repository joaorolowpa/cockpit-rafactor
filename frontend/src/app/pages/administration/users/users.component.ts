import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';
import { UsersService } from './user.service';
import { UsersTableComponent } from './users-table/users-table.component';
import { UserFormDialogComponent } from './users-form-dialog/user-form-dialog.component';
import { UI_IMPORTS } from '../../../ui/ui.imports';


@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, UsersTableComponent, UserFormDialogComponent, ...UI_IMPORTS],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  
  protected users = signal<User[]>([]);
  protected isLoading = signal<boolean>(true);
  protected showCreateDialog = signal<boolean>(false);

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.isLoading.set(true);
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users.sort((a, b) => a.id - b.id));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading.set(false);
      }
    });
  }

  protected openCreateDialog(): void {
    this.showCreateDialog.set(true);
  }

  protected onDialogClose(): void {
    this.showCreateDialog.set(false);
  }

  protected onUserCreated(): void {
    this.showCreateDialog.set(false);
    this.loadUsers();
  }

  
}
