import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MyQuotesComponent } from './my-quotes.component';
import { QuotationService } from '../../core/services/api/quotation.service';
import { FormsModule } from '@angular/forms';

describe('MyQuotesComponent', () => {
    let component: MyQuotesComponent;
    let fixture: ComponentFixture<MyQuotesComponent>;
    let quoteServiceSpy: jasmine.SpyObj<QuotationService>;

    beforeEach(async () => {
        const spy = jasmine.createSpyObj('QuotationService', ['getRequests', 'addMessage']);

        await TestBed.configureTestingModule({
            imports: [MyQuotesComponent, FormsModule],
            providers: [
                { provide: QuotationService, useValue: spy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MyQuotesComponent);
        component = fixture.componentInstance;
        quoteServiceSpy = TestBed.inject(QuotationService) as jasmine.SpyObj<QuotationService>;
        quoteServiceSpy.getRequests.and.returnValue(Promise.resolve([]));

        fixture.detectChanges();
    });

    it('should create and load quotes', fakeAsync(() => {
        component.ngOnInit();
        tick();
        expect(quoteServiceSpy.getRequests).toHaveBeenCalled();
    }));

    it('should select a quote', () => {
        const mockQuote = { id: 'q1', email: 'alice@example.com' } as any;
        component.selectRequest(mockQuote);
        expect(component.selectedRequest).toBe(mockQuote);
    });

    it('should send a message', () => {
        component.selectedRequest = { id: 'q1' } as any;
        component.newMessage = 'Hello';
        component.sendMessage();
        expect(quoteServiceSpy.addMessage).toHaveBeenCalled();
        expect(component.newMessage).toBe('');
    });
});
