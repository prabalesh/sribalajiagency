import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/store/theme.service';
import { CartService } from '../../core/store/cart.service';
import { AuthService } from '../../core/services/auth/auth.service';

import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent implements OnInit {
  private router = inject(Router);
  themeService = inject(ThemeService);
  cartService = inject(CartService);
  authService = inject(AuthService);

  searchQuery: string = '';
  isSearchOpen = false;
  isUserDropdownOpen = false;
  isMobileMenuOpen = false;
  isLoading = signal(true);

  ngOnInit() {
    // Set loading to false after a short delay to ensure all services are initialized
    setTimeout(() => {
      this.isLoading.set(false);
    }, 100);
  }

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
