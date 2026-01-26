import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { QuotationsComponent } from './quotations.component';
import { QuotationService } from '../../core/services/api/quotation.service';
import { FormsModule } from '@angular/forms';
import { QuotationRequest } from '../../core/models/models';

describe('QuotationsComponent', () => {
  let component: QuotationsComponent;
  let fixture: ComponentFixture<QuotationsComponent>;
  let quoteServiceSpy: jasmine.SpyObj<QuotationService>;

  const mockRequests: QuotationRequest[] = [
    { id: 'q1', customerName: 'User 1', status: 'Open' } as QuotationRequest
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('QuotationService', ['getRequests', 'addMessage', 'updateStatus']);

    await TestBed.configureTestingModule({
      imports: [QuotationsComponent, FormsModule],
      providers: [
        { provide: QuotationService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuotationsComponent);
    component = fixture.componentInstance;
    quoteServiceSpy = TestBed.inject(QuotationService) as jasmine.SpyObj<QuotationService>;
    quoteServiceSpy.getRequests.and.returnValue(Promise.resolve(mockRequests));

    fixture.detectChanges();
  });

  it('should create and load requests', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.requests.length).toBe(1);
    expect(quoteServiceSpy.getRequests).toHaveBeenCalled();
  }));

  it('should select a request', () => {
    component.selectRequest(mockRequests[0]);
    expect(component.selectedRequest).toBe(mockRequests[0]);
  });

  it('should send a message', fakeAsync(() => {
    component.selectedRequest = mockRequests[0];
    component.newMessage = 'Test message';
    component.sendMessage();

    tick();
    expect(quoteServiceSpy.addMessage).toHaveBeenCalled();
    expect(component.newMessage).toBe('');
  }));

  it('should close a request', fakeAsync(() => {
    component.selectedRequest = { ...mockRequests[0] };
    component.closeRequest();

    tick();
    expect(quoteServiceSpy.updateStatus).toHaveBeenCalledWith('q1', 'Closed');
    expect(component.selectedRequest?.status).toBe('Closed');
  }));
});
