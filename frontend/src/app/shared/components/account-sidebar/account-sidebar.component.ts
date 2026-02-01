import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
    selector: 'app-account-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './account-sidebar.component.html',
    styleUrls: ['./account-sidebar.component.scss']
})
export class AccountSidebarComponent {
    authService = inject(AuthService);

    logout() {
        this.authService.logout();
    }
}
