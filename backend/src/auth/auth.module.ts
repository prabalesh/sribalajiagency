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
import { UserAddress } from './entities/user-address.entity';
import { UserAddressesService } from './user-addresses.service';
import { UserAddressesController } from './user-addresses.controller';


@Module({
    imports: [
        TypeOrmModule.forFeature([User, Role, Permission, UserAddress]),
        PassportModule,
        JwtModule.register({}),
    ],
    providers: [AuthService, AtStrategy, RtStrategy, PermissionsGuard, UserAddressesService],
    controllers: [AuthController, RolesController, UsersController, UserAddressesController],
    exports: [AuthService],
})
export class AuthModule { }

