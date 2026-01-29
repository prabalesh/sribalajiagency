import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const adminGuard: CanMatchFn = (route, segments) => {
    const authService = inject(AuthService);

    if (authService.isAuthenticated() && authService.isAdmin()) {
        return true;
    } else {
        return false;
    }
};
