import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router, provideRouter } from '@angular/router';
import { mockAuthService } from '../../../core/testing/mocks';
import { FormsModule } from '@angular/forms';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let authService: AuthService;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoginComponent, FormsModule],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should login successfully and navigate to home', fakeAsync(() => {
        spyOn(authService, 'login').and.returnValue(Promise.resolve(true));
        const navigateSpy = spyOn(router, 'navigate');

        component.email = 'test@test.com';
        component.password = 'password';
        component.onSubmit();

        tick();
        expect(authService.login).toHaveBeenCalledWith('test@test.com', 'password');
        expect(navigateSpy).toHaveBeenCalledWith(['/']);
        expect(component.isLoading).toBeFalse();
    }));

    it('should show error on login failure', fakeAsync(() => {
        spyOn(authService, 'login').and.returnValue(Promise.resolve(false));

        component.onSubmit();
        tick();

        expect(component.error).toBe('Invalid email or password.');
        expect(component.isLoading).toBeFalse();
    }));

    it('should handle service exception', fakeAsync(() => {
        spyOn(authService, 'login').and.returnValue(Promise.reject('API Error'));

        component.onSubmit();
        tick();

        expect(component.error).toBe('An error occurred during sign in.');
        expect(component.isLoading).toBeFalse();
    }));
});
