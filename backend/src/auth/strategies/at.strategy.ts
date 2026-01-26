import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    return req?.cookies?.access_token;
                },
            ]),
            secretOrKey: config.get<string>('JWT_ACCESS_SECRET') || 'defaultSecret',
        });
    }

    async validate(payload: any) {
        // Fetch user with roles and permissions to enable PermissionsGuard
        return this.userRepository.findOne({
            where: { id: payload.sub },
            relations: ['roles', 'roles.permissions']
        });
    }
}


