import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from '../../api/api.service';
import { PLATFORM_ID } from '@angular/core';

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    // Mock localStorage
    const store: { [key: string]: string } = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value);
    spyOn(localStorage, 'clear').and.callFake(() => {
      for (const key in store) delete store[key];
    });

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: spy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    service = TestBed.inject(AuthService);

    // Prevent actual redirects during tests
    spyOn<any>(service, 'redirect').and.stub();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login and set user in current signal and localStorage', async () => {
    const mockUser = { id: 'u1', name: 'User', email: 'u@a.com', roles: [], createdAt: new Date() };
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { user: mockUser } } as any));

    const success = await service.login('test@abc.com', 'pass');
    expect(success).toBeTrue();
    expect(service.user()).toEqual(mockUser);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('should handle login error', async () => {
    apiServiceSpy.post.and.returnValue(Promise.reject('error'));
    const success = await service.login('test@abc.com', 'pass');
    expect(success).toBeFalse();
    expect(service.user()).toBeNull();
  });

  it('should register', async () => {
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: {} } as any));
    const success = await service.register('User', 'test@abc.com', 'pass');
    expect(success).toBeTrue();
    expect(apiServiceSpy.post).toHaveBeenCalled();
  });

  it('should logout and clear local state', async () => {
    apiServiceSpy.post.and.returnValue(Promise.resolve({} as any));

    await service.logout();
    expect(service.user()).toBeNull();
    expect(localStorage.clear).toHaveBeenCalled();
  });

  it('should update profile', async () => {
    const mockUser = { id: 'u1', name: 'User', email: 'u@a.com', roles: [], createdAt: new Date() };
    (service as any).currentUser.set(mockUser);

    apiServiceSpy.put.and.returnValue(Promise.resolve({ data: { ...mockUser, name: 'New Name' } } as any));
    await service.updateProfile('New Name', 'test@abc.com');

    expect(service.user()?.name).toBe('New Name');
  });

  it('should check admin role correctly', () => {
    const adminUser = { id: 'u1', roles: [{ name: 'admin' }] } as any;
    (service as any).currentUser.set(adminUser);
    expect(service.isAdmin()).toBeTrue();

    const regularUser = { id: 'u2', roles: [{ name: 'user' }] } as any;
    (service as any).currentUser.set(regularUser);
    expect(service.isAdmin()).toBeFalse();
  });
});
