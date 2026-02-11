import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Shield, Edit, Trash2 } from 'lucide-angular';
import { Role } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
    selector: 'app-role-list',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './role-list.component.html',
    styleUrl: './role-list.component.scss'
})
export class RoleListComponent {
    public authService = inject(AuthService);

    @Input({ required: true }) roles: Role[] = [];
    @Input() isLoading = false;
    @Input() isDeleting = false;
    @Input() isSaving = false;

    @Output() edit = new EventEmitter<Role>();
    @Output() delete = new EventEmitter<string>();

    readonly Shield = Shield;
    readonly Edit = Edit;
    readonly Trash2 = Trash2;

    onEdit(role: Role) {
        this.edit.emit(role);
    }

    onDelete(id: string) {
        this.delete.emit(id);
    }
}
