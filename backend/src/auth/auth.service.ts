import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role, Permission } from './entities/role.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async hashData(data: string) {
        return bcrypt.hash(data, 10);
    }

    async getTokens(userId: string, email: string) {
        const [at, rt] = await Promise.all([
            this.jwtService.signAsync(
                { sub: userId, email },
                {
                    secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                    expiresIn: '15m',
                },
            ),
            this.jwtService.signAsync(
                { sub: userId, email },
                {
                    secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                    expiresIn: '7d',
                },
            ),
        ]);

        return { access_token: at, refresh_token: rt };
    }

    async signup(dto: any) {
        const password = await this.hashData(dto.password);
        const newUser = this.userRepository.create({
            name: dto.name,
            email: dto.email,
            password,
        });
        const [user, tokens] = await Promise.all([
            this.userRepository.save(newUser),
            this.getTokens(newUser.id, newUser.email),
        ]);
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token);
        return { user, ...tokens };
    }

    async login(dto: any) {
        const user = await this.userRepository.findOne({
            where: { email: dto.email },
            relations: ['roles', 'roles.permissions'],
            select: ['id', 'email', 'password', 'name'],
        } as any);

        if (!user) throw new ForbiddenException('Access Denied');

        const passwordMatches = await bcrypt.compare(dto.password, user.password);
        if (!passwordMatches) throw new ForbiddenException('Access Denied');

        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

        const { password: _, ...userWithoutPassword } = user as any;
        return { user: userWithoutPassword, ...tokens };
    }

    async updateRefreshTokenHash(userId: string, refreshToken: string) {
        const hash = await this.hashData(refreshToken);
        await this.userRepository.update(userId, { refreshToken: hash });
    }

    async refreshTokens(userId: string, rt: string) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles', 'roles.permissions'],
            select: ['id', 'email', 'refreshToken'],
        } as any);

        if (!user || !user.refreshToken) throw new ForbiddenException('Access Denied');

        const rtMatches = await bcrypt.compare(rt, user.refreshToken);
        if (!rtMatches) throw new ForbiddenException('Access Denied');

        const tokens = await this.getTokens(user.id, user.email);
        await this.updateRefreshTokenHash(user.id, tokens.refresh_token);
        return { user, ...tokens };
    }

    // User Management
    findAllUsers() {
        return this.userRepository.find({ relations: ['roles', 'roles.permissions'] });
    }

    async updateUser(id: string, data: any) {
        if (data.password) {
            data.password = await this.hashData(data.password);
        }
        await this.userRepository.update(id, data);
        return this.userRepository.findOne({ where: { id }, relations: ['roles'] });
    }

    deleteUser(id: string) {
        return this.userRepository.delete(id);
    }

    // Role Management
    findAllRoles() {
        return this.roleRepository.find({ relations: ['permissions'] });
    }

    async createRole(data: any) {
        const { permissionIds, ...roleData } = data;
        const role = this.roleRepository.create(roleData as object) as Role;
        if (permissionIds && permissionIds.length > 0) {
            role.permissions = await this.permissionRepository.find({
                where: { id: In(permissionIds) }
            });
        }
        return this.roleRepository.save(role);
    }

    async updateRole(id: string, data: any) {
        const { permissionIds, ...roleData } = data;
        const role = await this.roleRepository.findOne({ where: { id }, relations: ['permissions'] });
        if (!role) throw new UnauthorizedException('Role not found');

        Object.assign(role, roleData);

        if (permissionIds) {
            role.permissions = await this.permissionRepository.find({
                where: { id: In(permissionIds) }
            });
        }

        return this.roleRepository.save(role);
    }

    deleteRole(id: string) {
        return this.roleRepository.delete(id);
    }

    // Permission Management
    findAllPermissions() {
        return this.permissionRepository.find();
    }
}

