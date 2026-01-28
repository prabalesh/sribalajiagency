import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressesComponent } from './addresses.component';
import { AuthService } from '../../../core/services/auth/auth.service';
import { mockAuthService } from '../../../core/testing/mocks';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';

describe('AddressesComponent', () => {
    let component: AddressesComponent;
    let fixture: ComponentFixture<AddressesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AddressesComponent, FormsModule],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AddressesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.addresses.length).toBe(2);
    });

    it('should add an address', () => {
        component.newAddress = { type: 'Work', name: 'N', street: 'S', city: 'C', state: 'T', zip: '123' };
        component.addAddress();
        expect(component.addresses.length).toBe(3);
    });

    it('should delete an address', () => {
        component.deleteAddress('1');
        expect(component.addresses.length).toBe(1);
    });

    it('should set default address', () => {
        component.setDefault('2');
        expect(component.addresses[1].isDefault).toBeTrue();
        expect(component.addresses[0].isDefault).toBeFalse();
    });
});
