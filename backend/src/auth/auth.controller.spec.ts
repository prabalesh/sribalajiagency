import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('AuthController', () => {
    let controller: AuthController;
    let service: AuthService;

    const mockAuthService = {
        signup: jest.fn(),
        login: jest.fn(),
        refreshTokens: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockResponse = () => {
        const res: any = {};
        res.cookie = jest.fn().mockReturnValue(res);
        res.clearCookie = jest.fn().mockReturnValue(res);
        return res;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('signup', () => {
        it('should signup and set cookies', async () => {
            const dto = { name: 'Test', email: 'test@example.com', password: 'password' };
            const tokens = { user: { id: '1' }, access_token: 'at', refresh_token: 'rt' };
            const res = mockResponse();

            mockAuthService.signup.mockResolvedValue(tokens);

            const result = await controller.signup(dto, res);

            expect(result).toEqual({ user: tokens.user });
            expect(res.cookie).toHaveBeenCalledTimes(2);
            expect(service.signup).toHaveBeenCalledWith(dto);
        });

        it('should throw ConflictException on duplicate email', async () => {
            mockAuthService.signup.mockRejectedValue(new ConflictException('Email already exists'));
            const res = mockResponse();

            await expect(controller.signup({} as any, res))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should login and set cookies', async () => {
            const dto = { email: 'test@example.com', password: 'password' };
            const tokens = { user: { id: '1' }, access_token: 'at', refresh_token: 'rt' };
            const res = mockResponse();

            mockAuthService.login.mockResolvedValue(tokens);

            const result = await controller.login(dto, res);

            expect(result).toEqual({ user: tokens.user });
            expect(res.cookie).toHaveBeenCalledTimes(2);
        });
    });

    describe('logout', () => {
        it('should clear cookies', () => {
            const res = mockResponse();
            const result = controller.logout(res);

            expect(result.message).toBe('Logged out');
            expect(res.clearCookie).toHaveBeenCalledTimes(2);
        });
    });

    describe('refreshTokens', () => {
        it('should refresh tokens and set cookies', async () => {
            const req = { user: { sub: '1', refreshToken: 'rt' } };
            const tokens = { user: { id: '1' }, access_token: 'at2', refresh_token: 'rt2' };
            const res = mockResponse();

            mockAuthService.refreshTokens.mockResolvedValue(tokens);

            const result = await controller.refreshTokens(req, res);

            expect(result.user).toEqual(tokens.user);
            expect(res.cookie).toHaveBeenCalledTimes(2);
        });
    });
});
