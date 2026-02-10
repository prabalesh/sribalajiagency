import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, Res, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthSignupDto, AuthLoginDto } from './dto/auth.dto';


@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private configService: ConfigService
    ) { }

    private setCookies(res: Response, tokens: { access_token: string, refresh_token: string }) {
        const isProd = this.configService.get('NODE_ENV') === 'production';

        res.cookie('access_token', tokens.access_token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000, // 15 mins
        });

        res.cookie('refresh_token', tokens.refresh_token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    @Post('local/signup')
    @HttpCode(HttpStatus.CREATED)
    async signup(@Body() dto: AuthSignupDto, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.signup(dto);
        this.setCookies(res, data);
        return { user: data.user };
    }

    @Post('local/signin')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: AuthLoginDto, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.login(dto);
        this.setCookies(res, data);
        return { user: data.user };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        return { message: 'Logged out' };
    }

    @Post('refresh')
    @UseGuards(AuthGuard('jwt-refresh'))
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Req() req: any, @Res({ passthrough: true }) res: Response) {
        const user = req.user;
        const data = await this.authService.refreshTokens(user.sub, user.refreshToken);
        this.setCookies(res, data);
        return { user: data.user };
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    async getCurrentUser(@Req() req: any) {
        // Return current user from JWT with fresh data from database
        const userId = req.user.sub;
        const user = await this.authService.getUserById(userId);
        return { user };
    }
}

