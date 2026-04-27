import { Component, inject, signal, afterNextRender, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd, NavigationCancel, NavigationError, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';
import { LucideAngularModule, Search, Sun, Moon, ShoppingBag, User, Menu, X, LogIn, LogOut, Package, MapPin, ExternalLink } from 'lucide-angular';
import { ThemeService } from '../../core/store/theme.service';
import { CartService } from '../../core/store/cart.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CmsService } from '../../core/services/api/cms.service';
import { RouteLoadingService } from '../../core/services/route-loading.service';
import { RouteLoadingComponent } from '../../shared/components/route-loading/route-loading.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, RouteLoadingComponent],
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

  // Lucide icons
  readonly Search = Search;
  readonly Sun = Sun;
  readonly Moon = Moon;
  readonly ShoppingBag = ShoppingBag;
  readonly User = User;
  readonly Menu = Menu;
  readonly X = X;
  readonly LogIn = LogIn;
  readonly LogOut = LogOut;
  readonly Package = Package;
  readonly MapPin = MapPin;
  readonly ExternalLink = ExternalLink;

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

        if (event instanceof NavigationEnd) {
          this.closeAll();
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
      this.closeAll();
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  closeAll() {
    this.isSearchOpen = false;
    this.isUserDropdownOpen = false;
    this.isMobileMenuOpen = false;
    this.searchQuery = '';
  }
}
