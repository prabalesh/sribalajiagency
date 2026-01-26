import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { Role, Permission } from './entities/role.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesController } from './roles.controller';
import { UsersController } from './users.controller';
import { AtStrategy } from './strategies/at.strategy';
import { RtStrategy } from './strategies/rt.strategy';
import { PermissionsGuard } from './guards/permissions.guard';


@Module({
    imports: [
        TypeOrmModule.forFeature([User, Role, Permission]),
        PassportModule,
        JwtModule.register({}),
    ],
    providers: [AuthService, AtStrategy, RtStrategy, PermissionsGuard],
    controllers: [AuthController, RolesController, UsersController],
    exports: [AuthService],
})
export class AuthModule { }

