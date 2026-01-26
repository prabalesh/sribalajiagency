import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ResetPasswordComponent } from './reset-password.component';
import { FormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';

describe('ResetPasswordComponent', () => {
    let component: ResetPasswordComponent;
    let fixture: ComponentFixture<ResetPasswordComponent>;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ResetPasswordComponent, FormsModule],
            providers: [provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(ResetPasswordComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should check passwords match', () => {
        component.password = '1';
        component.confirmPassword = '2';
        component.onSubmit();
        expect(component.error).toBe('Passwords do not match');
    });

    it('should reset successfully and navigate home after delay', fakeAsync(() => {
        const navigateSpy = spyOn(router, 'navigate');
        component.password = 'pass';
        component.confirmPassword = 'pass';
        component.onSubmit();

        tick(1500);
        expect(component.isSuccess).toBeTrue();

        tick(3000);
        expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    }));
});
