import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';


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
    async signup(@Body() dto: any, @Res({ passthrough: true }) res: Response) {
        const data = await this.authService.signup(dto);
        this.setCookies(res, data);
        return { user: data.user };
    }

    @Post('local/signin')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: any, @Res({ passthrough: true }) res: Response) {
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
}

