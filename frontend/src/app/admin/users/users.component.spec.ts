import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UsersComponent } from './users.component';
import { AuthService } from '../../core/services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { User } from '../../core/models/auth.model';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUsers: User[] = [
    { id: 'u1', name: 'Admin', email: 'a@t.com', roles: [{ name: 'admin' }] } as User
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', ['getUsers', 'addUser', 'updateUser', 'deleteUser']);

    await TestBed.configureTestingModule({
      imports: [UsersComponent, FormsModule],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    authServiceSpy.getUsers.and.returnValue(Promise.resolve(mockUsers));

    fixture.detectChanges();
  });

  it('should load users on init', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.users.length).toBe(1);
    expect(authServiceSpy.getUsers).toHaveBeenCalled();
  }));

  it('should register a new user', fakeAsync(() => {
    component.newUser = { name: 'New', email: 'n@t.com', role: 'user' };
    component.isEditing = false;

    component.saveUser();
    tick();

    expect(authServiceSpy.addUser).toHaveBeenCalled();
    expect(authServiceSpy.getUsers).toHaveBeenCalledTimes(2); // once for init, once for refresh after save
  }));

  it('should update an existing user', fakeAsync(() => {
    component.newUser = { id: 'u1', name: 'Updated', email: 'u@t.com', role: 'admin' };
    component.isEditing = true;

    component.saveUser();
    tick();

    expect(authServiceSpy.updateUser).toHaveBeenCalled();
  }));

  it('should set editing state correctly', () => {
    component.editUser(mockUsers[0]);
    expect(component.isEditing).toBeTrue();
    expect(component.newUser.name).toBe('Admin');
    expect(component.newUser.role).toBe('admin');
  });

  it('should delete user after confirmation', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteUser('u1');
    tick();
    expect(authServiceSpy.deleteUser).toHaveBeenCalledWith('u1');
  }));
});
