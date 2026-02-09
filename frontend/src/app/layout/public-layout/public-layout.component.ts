import { Component, inject, signal, afterNextRender, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd, NavigationCancel, NavigationError, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/store/theme.service';
import { CartService } from '../../core/store/cart.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CmsService } from '../../core/services/api/cms.service';
import { RouteLoadingService } from '../../core/services/route-loading.service';
import { LucideAngularModule, ExternalLink } from 'lucide-angular';
import { Subscription, filter } from 'rxjs';

import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { RouteLoadingComponent } from '../../shared/components/route-loading/route-loading.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SkeletonComponent, LucideAngularModule, RouteLoadingComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  themeService = inject(ThemeService);
  cartService = inject(CartService);
  authService = inject(AuthService);
  private cmsService = inject(CmsService);
  routeLoadingService = inject(RouteLoadingService);

  readonly icons = {
    ExternalLink
  };

  searchQuery: string = '';
  isSearchOpen = false;
  isUserDropdownOpen = false;
  isMobileMenuOpen = false;
  isLoading = signal(true);
  cms: any = null;
  private routerSubscription?: Subscription;

  constructor() {
    afterNextRender(async () => {
      try {
        this.cms = await this.cmsService.getHomeCMS();
      } catch (error) {
        console.error('Failed to load CMS data:', error);
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  ngOnInit() {
    // Optimized router event handling
    this.routerSubscription = this.router.events
      .pipe(
        filter(event => 
          event instanceof RouteConfigLoadStart ||
          event instanceof RouteConfigLoadEnd ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        )
      )
      .subscribe(event => {
        if (event instanceof RouteConfigLoadStart) {
          this.routeLoadingService.show();
        } else {
          this.routeLoadingService.hide();
        }
        
        // Close mobile menu and dropdowns on navigation
        if (event instanceof NavigationEnd) {
          this.isMobileMenuOpen = false;
          this.isUserDropdownOpen = false;
        }
      });
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
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

  closeUserDropdown() {
    this.isUserDropdownOpen = false;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}
