import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Role, Permission } from './entities/role.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let userRepo: Repository<User>;
    let roleRepo: Repository<Role>;
    let permissionRepo: Repository<Permission>;
    let jwtService: JwtService;
    let configService: ConfigService;

    const mockUserRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        findOneBy: jest.fn(),
        findAndCount: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockRoleRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };

    const mockPermissionRepo = {
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockJwtService = {
        signAsync: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };
    const mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue({
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                save: jest.fn(),
            },
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
                { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
                { provide: getRepositoryToken(Permission), useValue: mockPermissionRepo },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepo = module.get<Repository<User>>(getRepositoryToken(User));
        roleRepo = module.get<Repository<Role>>(getRepositoryToken(Role));
        permissionRepo = module.get<Repository<Permission>>(getRepositoryToken(Permission));
        jwtService = module.get<JwtService>(JwtService);
        configService = module.get<ConfigService>(ConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('signup', () => {
        it('should successfully sign up a user', async () => {
            const signupDto = { name: 'Test', email: 'test@example.com', password: 'password' };
            const hashedPwd = 'hashedPassword';
            const user = { id: '1', ...signupDto, password: hashedPwd };
            const tokens = { access_token: 'at', refresh_token: 'rt' };

            (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPwd);
            mockUserRepo.create.mockReturnValue(user);
            mockUserRepo.save.mockResolvedValue(user);
            mockJwtService.signAsync.mockResolvedValueOnce('at').mockResolvedValueOnce('rt');
            jest.spyOn(service, 'updateRefreshTokenHash').mockResolvedValue(undefined);

            const result = await service.signup(signupDto);

            expect(result.user).toEqual(user);
            expect(result.access_token).toBe('at');
            expect(mockUserRepo.save).toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should return tokens on valid login', async () => {
            const loginDto = { email: 'test@example.com', password: 'password' };
            const user = { id: '1', email: 'test@example.com', password: 'hashedPassword', name: 'Test' };

            mockUserRepo.findOne.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.signAsync.mockResolvedValueOnce('at').mockResolvedValueOnce('rt');
            jest.spyOn(service, 'updateRefreshTokenHash').mockResolvedValue(undefined);

            const result = await service.login(loginDto);

            expect(result.user.id).toBe('1');
            expect(result.access_token).toBe('at');
        });

        it('should throw ForbiddenException on invalid user', async () => {
            mockUserRepo.findOne.mockResolvedValue(null);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login({ email: 'wrong@example.com', password: 'any' }))
                .rejects.toThrow(ForbiddenException);
        });
    });

    describe('refreshTokens', () => {
        it('should return new tokens', async () => {
            const userId = '1';
            const rt = 'rt';
            const user = { id: '1', email: 'test@example.com', refreshToken: 'hashedRt' };

            mockUserRepo.findOne.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.signAsync.mockResolvedValueOnce('at2').mockResolvedValueOnce('rt2');
            jest.spyOn(service, 'updateRefreshTokenHash').mockResolvedValue(undefined);

            const result = await service.refreshTokens(userId, rt);

            expect(result.access_token).toBe('at2');
            expect(result.refresh_token).toBe('rt2');
        });
    });

    describe('User Management', () => {
        it('should return paginated users', async () => {
            mockUserRepo.findAndCount.mockResolvedValue([[], 0]);
            const result = await service.findAllUsers(1, 10);
            expect(result.items).toBeDefined();
            expect(result.total).toBe(0);
        });

        it('should update user rolls', async () => {
            const user = { id: '1', roles: [] };
            const roles = [{ id: 'r1' }];
            mockUserRepo.findOne.mockResolvedValue(user);
            mockRoleRepo.find.mockResolvedValue(roles);
            mockUserRepo.save.mockImplementation(u => u);

            const result = await service.updateUser('1', { roleIds: ['r1'] });
            expect(result.roles).toEqual(roles);
        });
    });

    describe('Role and Permission Management', () => {
        it('should find all roles', async () => {
            mockRoleRepo.find.mockResolvedValue([]);
            const result = await service.findAllRoles();
            expect(result).toEqual([]);
        });

        it('should create role with permissions', async () => {
            const roleData = { name: 'Admin', permissionIds: ['p1'] };
            const role = { name: 'Admin', permissions: [] };
            const permissions = [{ id: 'p1' }];

            mockRoleRepo.create.mockReturnValue(role);
            mockPermissionRepo.find.mockResolvedValue(permissions);
            mockRoleRepo.save.mockImplementation(r => r);

            const result = await service.createRole(roleData);
            expect(result.permissions).toEqual(permissions);
        });
    });
});
