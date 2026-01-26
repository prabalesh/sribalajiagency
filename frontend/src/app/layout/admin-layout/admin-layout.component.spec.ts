import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLayoutComponent } from './admin-layout.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/store/theme.service';
import { mockAuthService, mockThemeService } from '../../core/testing/mocks';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let authServiceSpy: any;

  beforeEach(async () => {
    authServiceSpy = {
      ...mockAuthService,
      logout: jasmine.createSpy('logout')
    };

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should toggle sidebar', () => {
    expect(component.isSidebarOpen).toBeFalse();
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBeTrue();
    component.toggleSidebar();
    expect(component.isSidebarOpen).toBeFalse();
  });

  it('should call authService.logout on logout', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});
