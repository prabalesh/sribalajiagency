import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesController } from './roles.controller';
import { UsersController } from './users.controller';
import { AtStrategy } from './strategies/at.strategy';
import { RtStrategy } from './strategies/rt.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { UserAddressesService } from './user-addresses.service';
import { UserAddressesController } from './user-addresses.controller';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  providers: [
    AuthService,
    AtStrategy,
    RtStrategy,
    PermissionsGuard,
    UserAddressesService,
  ],
  controllers: [
    AuthController,
    RolesController,
    UsersController,
    UserAddressesController,
  ],
  exports: [AuthService],
})
export class AuthModule {}
