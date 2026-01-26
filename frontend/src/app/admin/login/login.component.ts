import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    credentials = {
        username: '',
        password: ''
    };

    constructor(private authService: AuthService, private router: Router) { }

    async login() {
        // Updated to use centralized AuthService
        const success = await this.authService.login('admin@sribalaji.com', 'admin123');
        if (success) {
            this.router.navigate(['/admin/dashboard']);
        } else {
            alert('Invalid credentials');
        }
    }
}
