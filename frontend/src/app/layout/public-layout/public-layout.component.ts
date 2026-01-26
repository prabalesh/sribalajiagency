import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/store/theme.service';
import { CartService } from '../../core/store/cart.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent {
  private router = inject(Router);
  themeService = inject(ThemeService);
  cartService = inject(CartService);
  authService = inject(AuthService);

  searchQuery: string = '';
  isSearchOpen = false;
  isUserDropdownOpen = false;

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    if (!this.isSearchOpen) {
      this.searchQuery = '';
    }
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.isSearchOpen = false;
      this.searchQuery = '';
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
