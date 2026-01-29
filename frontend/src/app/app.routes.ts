import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layout/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';


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
                path: 'products/detail/:id',
                loadComponent: () => import('./public/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
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
                path: 'cart',
                loadComponent: () => import('./public/cart/cart.component').then(m => m.CartComponent)
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
                path: 'login',
                loadComponent: () => import('./public/auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'register',
                loadComponent: () => import('./public/auth/register/register.component').then(m => m.RegisterComponent)
            },
            {
                path: 'forgot-password',
                loadComponent: () => import('./public/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
            },
            {
                path: 'reset-password',
                loadComponent: () => import('./public/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
            },
            {
                path: 'account',
                canActivate: [authGuard],
                children: [
                    {
                        path: 'profile',
                        loadComponent: () => import('./public/account/profile/profile.component').then(m => m.ProfileComponent)
                    },
                    {
                        path: 'orders',
                        loadComponent: () => import('./public/account/orders/orders.component').then(m => m.OrdersComponent)
                    },
                    {
                        path: 'addresses',
                        loadComponent: () => import('./public/account/addresses/addresses.component').then(m => m.AddressesComponent)
                    },
                    {
                        path: '',
                        redirectTo: 'profile',
                        pathMatch: 'full'
                    }
                ]
            },
            {
                path: 'feedback',
                loadComponent: () => import('./public/feedback/feedback.component').then(m => m.FeedbackComponent)
            }
        ]
    },


    // Admin Routes
    {
        path: 'admin',
        component: AdminLayoutComponent,
        canMatch: [adminGuard],
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
                path: 'orders',
                loadComponent: () => import('./admin/orders/orders.component').then(m => m.OrdersComponent)
            },
            {
                path: 'coupons',
                loadComponent: () => import('./admin/coupons/coupons.component').then(m => m.CouponsComponent)
            },
            {
                path: 'permissions',
                loadComponent: () => import('./admin/permissions/permissions.component').then(m => m.PermissionsComponent)
            },
            {
                path: 'home-cms',
                loadComponent: () => import('./admin/home-cms/home-cms.component').then(m => m.HomeCMSComponent)
            },
            {
                path: 'settings/locations',
                loadComponent: () => import('./admin/settings/location-restrictions/location-restrictions.component').then(m => m.LocationRestrictionsComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }

        ]
    },

    {
        path: '**',
        component: NotFoundComponent
    }
];
