import { TestBed } from '@angular/core/testing';
import { QuotationService } from './quotation.service';
import { ApiService } from '../../api/api.service';
import { QuotationRequest } from '../../models/quotation.model';

describe('QuotationService', () => {
  let service: QuotationService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch']);

    TestBed.configureTestingModule({
      providers: [
        QuotationService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(QuotationService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch list of requests', async () => {
    const mockRequests = [{ id: 'q1', customerName: 'Test' } as QuotationRequest];
    apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockRequests } as any));

    const result = await service.getRequests();
    expect(result).toEqual(mockRequests);
    expect(apiServiceSpy.get).toHaveBeenCalledWith('/quotations');
  });

  it('should fetch request by id', async () => {
    const mockRequest = { id: 'q1', customerName: 'Test' } as QuotationRequest;
    apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockRequest } as any));

    const result = await service.getRequestById('q1');
    expect(result).toEqual(mockRequest);
    expect(apiServiceSpy.get).toHaveBeenCalledWith('/quotations/q1');
  });

  it('should create a new request', async () => {
    const dto = { customerName: 'New' };
    const mockRes = { id: 'q2', ...dto } as QuotationRequest;
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: mockRes } as any));

    const result = await service.createRequest(dto);
    expect(result.id).toBe('q2');
    expect(apiServiceSpy.post).toHaveBeenCalledWith('/quotations', dto);
  });

  it('should update request status', async () => {
    const mockRes = { id: 'q1', status: 'Closed' } as QuotationRequest;
    apiServiceSpy.patch.and.returnValue(Promise.resolve({ data: mockRes } as any));

    const result = await service.updateStatus('q1', 'Closed');
    expect(result.status).toBe('Closed');
    expect(apiServiceSpy.patch).toHaveBeenCalledWith('/quotations/q1/status', { status: 'Closed' });
  });

  it('should log message (addMessage)', async () => {
    spyOn(console, 'log');
    await service.addMessage('q1', { sender: 'user', content: 'hello', timestamp: new Date() });
    expect(console.log).toHaveBeenCalled();
  });
});
