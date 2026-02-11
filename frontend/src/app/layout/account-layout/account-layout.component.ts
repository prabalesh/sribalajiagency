import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, User, Package, MapPin, LogOut } from 'lucide-angular';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
    selector: 'app-account-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    templateUrl: './account-layout.component.html',
    styleUrls: ['./account-layout.component.scss']
})
export class AccountLayoutComponent {
    authService = inject(AuthService);
    
    readonly User = User;
    readonly Package = Package;
    readonly MapPin = MapPin;
    readonly LogOut = LogOut;

    logout() {
        this.authService.logout();
    }
}
