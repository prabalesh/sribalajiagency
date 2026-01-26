import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from '../api/api.service';
import { PLATFORM_ID } from '@angular/core';

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

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
        { provide: ApiService, useValue: apiSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(AuthService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', async () => {
    const mockUser = { id: '1', name: 'Admin', roles: [{ name: 'admin' }] };
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { user: mockUser } } as any));

    const result = await service.login('admin@test.com', 'password');
    expect(result).toBeTrue();
    expect(service.user()).toEqual(mockUser as any);
    expect(service.isAdmin()).toBeTrue();
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('should return false on login failure', async () => {
    apiServiceSpy.post.and.returnValue(Promise.reject('Error'));
    const result = await service.login('fail@test.com', 'wrong');
    expect(result).toBeFalse();
    expect(service.user()).toBeNull();
  });

  it('should logout and clear state', async () => {
    const mockUser = { id: '1', name: 'User' };
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { user: mockUser } } as any));
    await service.login('u@t.com', 'p');

    apiServiceSpy.post.and.returnValue(Promise.resolve({} as any));

    // Stub the private redirect method
    spyOn(service as any, 'redirect').and.stub();

    await service.logout();

    expect(service.user()).toBeNull();
    expect(localStorage.clear).toHaveBeenCalled();
    expect((service as any).redirect).toHaveBeenCalledWith('/login');
  });

  it('should check authentication status correctly', async () => {
    expect(service.isAuthenticated()).toBeFalse();

    const mockUser = { id: '1', name: 'User' };
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { user: mockUser } } as any));
    await service.login('u@t.com', 'p');

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('should fetch users', async () => {
    const mockUsers = [{ id: '1', name: 'U1' }];
    apiServiceSpy.get.and.returnValue(Promise.resolve({ data: mockUsers } as any));

    const result = await service.getUsers();
    expect(result).toEqual(mockUsers as any);
    expect(apiServiceSpy.get).toHaveBeenCalledWith('/users');
  });

  it('should update user profile', async () => {
    const initialUser = { id: '1', name: 'Old', email: 'o@t.com' };
    apiServiceSpy.post.and.returnValue(Promise.resolve({ data: { user: initialUser } } as any));
    await service.login('o@t.com', 'p');

    const updatedUser = { ...initialUser, name: 'New' };
    apiServiceSpy.put.and.returnValue(Promise.resolve({ data: updatedUser } as any));

    await service.updateProfile('New', 'o@t.com');

    expect(service.user()?.name).toBe('New');
    expect(apiServiceSpy.put).toHaveBeenCalledWith('/users/profile', { name: 'New', email: 'o@t.com' });
  });
});
