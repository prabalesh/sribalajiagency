import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../../core/services/auth.service';
import { mockAuthService } from '../../../core/testing/mocks';
import { provideRouter, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

describe('ProfileComponent', () => {
    let component: ProfileComponent;
    let fixture: ComponentFixture<ProfileComponent>;
    let authServiceSpy: any;
    let router: Router;

    beforeEach(async () => {
        authServiceSpy = {
            ...mockAuthService,
            updateProfile: jasmine.createSpy().and.returnValue(Promise.resolve()),
            logout: jasmine.createSpy()
        };

        await TestBed.configureTestingModule({
            imports: [ProfileComponent, FormsModule],
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileComponent);
        component = fixture.componentInstance;
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update profile and show success message', fakeAsync(() => {
        component.name = 'New Name';
        component.email = 'new@test.com';
        component.saveProfile();

        expect(authServiceSpy.updateProfile).toHaveBeenCalledWith('New Name', 'new@test.com');
        tick();
        expect(component.message).toBe('Profile updated successfully!');
        expect(component.isEditing).toBeFalse();

        tick(3000);
        expect(component.message).toBe('');
    }));

    it('should logout and navigate to login', () => {
        const navigateSpy = spyOn(router, 'navigate');
        component.logout();
        expect(authServiceSpy.logout).toHaveBeenCalled();
        expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
});
