import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';

describe('ForgotPasswordComponent', () => {
    let component: ForgotPasswordComponent;
    let fixture: ComponentFixture<ForgotPasswordComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ForgotPasswordComponent, FormsModule],
            providers: [provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(ForgotPasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should submit and show success after delay', fakeAsync(() => {
        component.email = 'test@test.com';
        component.onSubmit();

        expect(component.isLoading).toBeTrue();
        tick(1500);
        expect(component.isSubmitted).toBeTrue();
        expect(component.isLoading).toBeFalse();
    }));
});
