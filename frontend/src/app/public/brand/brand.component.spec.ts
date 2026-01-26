import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrandComponent } from './brand.component';
import { ProductService } from '../../core/services/api/product.service';
import { mockProductService, mockActivatedRoute } from '../../core/testing/mocks';
import { ActivatedRoute, provideRouter } from '@angular/router';

describe('BrandComponent', () => {
  let component: BrandComponent;
  let fixture: ComponentFixture<BrandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandComponent],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideRouter([])
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BrandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
