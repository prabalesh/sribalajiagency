import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated() && authService.isAdmin()) {
        return true;
    } else {
        // If not authenticated, go to login
        if (!authService.isAuthenticated()) {
            router.navigate(['/admin/login']);
        } else {
            // If authenticated but not admin, go to home or some forbidden page
            router.navigate(['/']);
        }
        return false;
    }
};
