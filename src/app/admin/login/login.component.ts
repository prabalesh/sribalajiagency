import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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

    login() {
        // Mock login validation
        if (this.credentials.username === 'admin' && this.credentials.password === 'admin') {
            this.authService.login();
            this.router.navigate(['/admin/dashboard']);
        } else {
            alert('Invalid credentials');
        }
    }
}
