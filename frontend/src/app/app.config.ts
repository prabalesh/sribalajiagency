import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CustomPreloadingStrategy } from './core/strategies/custom-preloading.strategy';
import { IMAGE_LOADER } from '@angular/common';
import { sbaImageLoader } from './core/loaders/image-loader';
import { AuthService } from './core/services/auth/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LUCIDE_ICONS, LucideIconProvider, Search, Sun, Moon, ShoppingBag, User, Menu, X, LogIn, LogOut, Package, MapPin, ExternalLink, ChevronDown } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(CustomPreloadingStrategy), withInMemoryScrolling(
      { scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }
    )),
    provideClientHydration(withEventReplay()),
    {
      provide: IMAGE_LOADER,
      useValue: sbaImageLoader
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => () => authService.fetchCurrentUser(),
      deps: [AuthService],
      multi: true
    },
    provideAnimationsAsync(),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Search, Sun, Moon, ShoppingBag, User, Menu, X, LogIn, LogOut, Package, MapPin, ExternalLink, ChevronDown })
    }
  ]
};
