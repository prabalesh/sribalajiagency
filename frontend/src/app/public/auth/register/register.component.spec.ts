import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router, provideRouter } from '@angular/router';
import { mockAuthService } from '../../../core/testing/mocks';
import { FormsModule } from '@angular/forms';

describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let authService: AuthService;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RegisterComponent, FormsModule],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        authService = TestBed.inject(AuthService);
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should check if passwords match', () => {
        component.password = '123';
        component.confirmPassword = '456';
        component.onSubmit();
        expect(component.error).toBe('Passwords do not match');
    });

    it('should register successfully and navigate home', fakeAsync(() => {
        spyOn(authService, 'register').and.returnValue(Promise.resolve(true));
        const navigateSpy = spyOn(router, 'navigate');

        component.name = 'Test';
        component.email = 'test@test.com';
        component.password = 'pass';
        component.confirmPassword = 'pass';
        component.onSubmit();

        tick();
        expect(authService.register).toHaveBeenCalledWith('Test', 'test@test.com', 'pass');
        expect(navigateSpy).toHaveBeenCalledWith(['/']);
    }));

    it('should show error if registration fails', fakeAsync(() => {
        spyOn(authService, 'register').and.returnValue(Promise.resolve(false));

        component.password = 'pass';
        component.confirmPassword = 'pass';
        component.onSubmit();
        tick();

        expect(component.error).toBe('Registration failed. Please try again.');
    }));
});
