import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

// Lazy load layouts and components that were previously directly imported to reduce initial bundle size
const PublicLayoutComponent = () => import('./layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent);
const AdminLayoutComponent = () => import('./layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent);
const NotFoundComponent = () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent);


export const routes: Routes = [
    // Public Routes
    {
        path: '',
        loadComponent: PublicLayoutComponent,
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
                loadComponent: () => import('./public/brand/brand.component').then(m => m.BrandComponent),
                data: { preload: true }
            },
            {
                path: 'brands/:brand',
                loadComponent: () => import('./public/brand-detail/brand-detail.component').then(m => m.BrandDetailComponent)
            },
            {
                path: 'brands/:brand/:category',
                loadComponent: () => import('./public/products/products.component').then(m => m.ProductsComponent),
                data: { preload: true }
            },
            {
                path: 'products',
                loadComponent: () => import('./public/products/products.component').then(m => m.ProductsComponent),
                data: { preload: true }
            },
            {
                path: 'products/detail/:id',
                loadComponent: () => import('./public/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
            },
            {
                path: 'products/:category',
                loadComponent: () => import('./public/products/products.component').then(m => m.ProductsComponent),
            },
            {
                path: 'products/:category/:subcategory',
                loadComponent: () => import('./public/products/products.component').then(m => m.ProductsComponent),
            },
            {
                path: 'cart',
                loadComponent: () => import('./public/cart/cart.component').then(m => m.CartComponent)
            },
            {
                path: 'order-confirmation/:id',
                canActivate: [authGuard],
                loadComponent: () => import('./public/order-confirmation/order-confirmation.component').then(m => m.OrderConfirmationComponent)
            },
            {
                path: 'history',
                redirectTo: 'account/orders',
                pathMatch: 'full',
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
                        loadComponent: () => import('./public/account/orders/orders.component').then(m => m.OrdersComponent),
                        data: { preload: true }
                    },
                    {
                        path: 'orders/:id',
                        loadComponent: () => import('./public/account/orders/order-detail/order-detail.component').then(m => m.UserOrderDetailComponent)
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


    // Management Routes (formerly Admin)
    {
        path: 'dashboard',
        loadComponent: AdminLayoutComponent,
        canMatch: [adminGuard],
        children: [
            {
                path: '',
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
                loadComponent: () => import('./admin/brands/brands.component').then(m => m.BrandsComponent),
                data: { preload: true }
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
                path: 'orders/:id',
                loadComponent: () => import('./admin/orders/order-detail/order-detail.component').then(m => m.AdminOrderDetailComponent)
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
            }
        ]
    },

    {
        path: '**',
        loadComponent: NotFoundComponent
    }
];
