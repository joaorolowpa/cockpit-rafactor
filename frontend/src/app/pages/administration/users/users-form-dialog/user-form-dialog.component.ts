import { Component, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { UserRole } from '../../../../models/user.model';
import { UsersService } from '../user.service';


@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, CheckboxModule],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss'
})
export class UserFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);

  close = output<void>();
  userCreated = output<void>();

  protected isSubmitting = signal<boolean>(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', Validators.required],
    user_active: [true]
  });

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const formValue = this.form.getRawValue();
    const userData = {
      ...formValue,
      roles: [UserRole.STANDARD]
    };

    this.usersService.createUser(userData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.userCreated.emit();
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }
}
