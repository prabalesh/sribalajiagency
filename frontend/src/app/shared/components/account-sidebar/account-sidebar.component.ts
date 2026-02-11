import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, User, Package, MapPin, LogOut } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
    selector: 'app-account-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './account-sidebar.component.html',
    styleUrls: ['./account-sidebar.component.scss']
})
export class AccountSidebarComponent {
    authService = inject(AuthService);
    
    readonly User = User;
    readonly Package = Package;
    readonly MapPin = MapPin;
    readonly LogOut = LogOut;

    logout() {
        this.authService.logout();
    }
}
