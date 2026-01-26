import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicLayoutComponent } from './public-layout.component';
import { provideRouter } from '@angular/router';
import { ThemeService } from '../../core/store/theme.service';
import { mockThemeService } from '../../core/testing/mocks';

describe('PublicLayoutComponent', () => {
  let component: PublicLayoutComponent;
  let fixture: ComponentFixture<PublicLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: ThemeService, useValue: mockThemeService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PublicLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
