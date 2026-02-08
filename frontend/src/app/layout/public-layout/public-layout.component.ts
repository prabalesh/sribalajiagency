import { Component, inject, signal, afterNextRender, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/store/theme.service';
import { CartService } from '../../core/store/cart.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CmsService } from '../../core/services/api/cms.service';
import { RouteLoadingService } from '../../core/services/route-loading.service';
import { LucideAngularModule, ExternalLink } from 'lucide-angular';
import { Subscription } from 'rxjs';

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
      this.cms = await this.cmsService.getHomeCMS();
      this.isLoading.set(false);
    });
  }

  ngOnInit() {
    // Listen to router events to show/hide loading screen
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof RouteConfigLoadStart) {
        // Lazy-loaded module/component is being loaded
        this.routeLoadingService.show();
      } else if (event instanceof RouteConfigLoadEnd ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError) {
        // Loading complete or navigation finished/cancelled/errored
        this.routeLoadingService.hide();
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
}
