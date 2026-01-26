import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LocationRestrictionsComponent } from './location-restrictions.component';
import { LocationService } from '../../../core/store/location.service';
import { FormsModule } from '@angular/forms';

describe('LocationRestrictionsComponent', () => {
    let component: LocationRestrictionsComponent;
    let fixture: ComponentFixture<LocationRestrictionsComponent>;
    let locationServiceSpy: jasmine.SpyObj<LocationService>;

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('LocationService', ['getLocations', 'addLocation', 'updateLocation', 'deleteLocation']);

        await TestBed.configureTestingModule({
            imports: [LocationRestrictionsComponent, FormsModule],
            providers: [
                { provide: LocationService, useValue: spy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LocationRestrictionsComponent);
        component = fixture.componentInstance;
        locationServiceSpy = TestBed.inject(LocationService) as jasmine.SpyObj<LocationService>;
        locationServiceSpy.getLocations.and.returnValue(Promise.resolve([]));

        fixture.detectChanges();
    });

    it('should load locations on init', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(locationServiceSpy.getLocations).toHaveBeenCalled();
    }));

    it('should add a new location', fakeAsync(() => {
        component.newLocation = { state: 'TN', city: 'CBE', isAllowed: true };
        component.isEditing = false;
        component.saveLocation();
        tick();
        expect(locationServiceSpy.addLocation).toHaveBeenCalled();
    }));

    it('should delete location after confirm', fakeAsync(() => {
        spyOn(window, 'confirm').and.returnValue(true);
        component.deleteLocation('l1');
        tick();
        expect(locationServiceSpy.deleteLocation).toHaveBeenCalledWith('l1');
    }));
});
