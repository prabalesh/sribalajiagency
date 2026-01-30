import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

import { APP_PERMISSIONS } from '../constants/permissions.constants';

export const adminGuard: CanMatchFn = (route, segments) => {
    const authService = inject(AuthService);

    if (authService.isAuthenticated() && authService.hasPermission(APP_PERMISSIONS.ACCESS_DASHBOARD)) {
        return true;
    } else {
        return false;
    }
};
