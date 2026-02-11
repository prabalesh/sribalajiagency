import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, User, Package, MapPin, LogOut } from 'lucide-angular';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
    selector: 'app-account-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    template: `
        <div class="account-layout container">
            <!-- Desktop: Horizontal Tabs Header -->
            <header class="account-header">
                <!-- Profile Info -->
                <div class="profile-section">
                    <div class="avatar">
                        {{ (authService.user()?.name || 'User').charAt(0).toUpperCase() }}
                    </div>
                    <div class="profile-info">
                        <h3>{{ authService.user()?.name }}</h3>
                        <p>{{ authService.user()?.email }}</p>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <nav class="tabs-nav">
                    <a routerLink="/account/profile" 
                       routerLinkActive="active"
                       class="tab">
                        <lucide-icon [img]="User" [size]="18"></lucide-icon>
                        <span>Profile</span>
                    </a>
                    <a routerLink="/account/orders" 
                       routerLinkActive="active"
                       class="tab">
                        <lucide-icon [img]="Package" [size]="18"></lucide-icon>
                        <span>Orders</span>
                    </a>
                    <a routerLink="/account/addresses" 
                       routerLinkActive="active"
                       class="tab">
                        <lucide-icon [img]="MapPin" [size]="18"></lucide-icon>
                        <span>Addresses</span>
                    </a>
                </nav>

                <!-- Logout Button -->
                <button (click)="logout()" class="logout-btn">
                    <lucide-icon [img]="LogOut" [size]="18"></lucide-icon>
                    <span class="logout-text">Sign Out</span>
                </button>
            </header>

            <!-- Routed Content -->
            <main class="account-content">
                <router-outlet></router-outlet>
            </main>

            <!-- Mobile: Bottom Navigation -->
            <nav class="mobile-nav">
                <a routerLink="/account/profile" 
                   routerLinkActive="active"
                   class="nav-item"
                   aria-label="Profile">
                    <lucide-icon [img]="User" [size]="20"></lucide-icon>
                    <span class="nav-label">Profile</span>
                </a>
                <a routerLink="/account/orders" 
                   routerLinkActive="active"
                   class="nav-item"
                   aria-label="Orders">
                    <lucide-icon [img]="Package" [size]="20"></lucide-icon>
                    <span class="nav-label">Orders</span>
                </a>
                <a routerLink="/account/addresses" 
                   routerLinkActive="active"
                   class="nav-item"
                   aria-label="Addresses">
                    <lucide-icon [img]="MapPin" [size]="20"></lucide-icon>
                    <span class="nav-label">Addresses</span>
                </a>
                <button (click)="logout()" 
                        class="nav-item logout-mobile"
                        aria-label="Sign out">
                    <lucide-icon [img]="LogOut" [size]="20"></lucide-icon>
                    <span class="nav-label">Logout</span>
                </button>
            </nav>
        </div>
    `,
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
