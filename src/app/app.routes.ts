import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // Public Routes
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
            {
                path: '',
                loadComponent: () => import('./public/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'search',
                loadComponent: () => import('./public/search/search.component').then(m => m.SearchComponent)
            },
            {
                path: 'brands',
                loadComponent: () => import('./public/brand/brand.component').then(m => m.BrandComponent)
            },
            {
                path: 'products',
                loadComponent: () => import('./public/products/products.component').then(m => m.ProductsComponent)
            },
            {
                path: 'products/:category',
                loadComponent: () => import('./public/products/products.component').then(m => m.ProductsComponent)
            },
            {
                path: 'products/:category/:subcategory',
                loadComponent: () => import('./public/products/products.component').then(m => m.ProductsComponent)
            },
            {
                path: 'history',
                loadComponent: () => import('./public/history/history.component').then(m => m.HistoryComponent)
            },
            {
                path: 'request-quote',
                loadComponent: () => import('./public/quotations/quotations.component').then(m => m.QuotationsComponent)
            },
            {
                path: 'my-quotes',
                loadComponent: () => import('./public/my-quotes/my-quotes.component').then(m => m.MyQuotesComponent)
            },
            {
                path: 'contact',
                loadComponent: () => import('./public/contact/contact.component').then(m => m.ContactComponent)
            },
            {
                path: 'feedback',
                loadComponent: () => import('./public/feedback/feedback.component').then(m => m.FeedbackComponent)
            }
        ]
    },

    // Admin Login (No Layout or separate layout)
    {
        path: 'admin/login',
        loadComponent: () => import('./admin/login/login.component').then(m => m.LoginComponent)
    },

    // Admin Routes
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('./admin/users/users.component').then(m => m.UsersComponent)
            },
            {
                path: 'categories',
                loadComponent: () => import('./admin/categories/categories.component').then(m => m.CategoriesComponent)
            },
            {
                path: 'brands',
                loadComponent: () => import('./admin/brands/brands.component').then(m => m.BrandsComponent)
            },
            {
                path: 'products',
                loadComponent: () => import('./admin/products/products.component').then(m => m.ProductsComponent)
            },
            {
                path: 'models',
                loadComponent: () => import('./admin/models/models.component').then(m => m.ModelsComponent)
            },
            {
                path: 'quotations',
                loadComponent: () => import('./admin/quotations/quotations.component').then(m => m.QuotationsComponent)
            },
            {
                path: 'feedback',
                loadComponent: () => import('./admin/feedback/feedback.component').then(m => m.FeedbackComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./admin/settings/settings.component').then(m => m.SettingsComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },

    // Fallback
    {
        path: '**',
        redirectTo: ''
    }
];
