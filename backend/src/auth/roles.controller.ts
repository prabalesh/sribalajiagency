import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';

@Controller('roles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Permissions('MANAGE_USERS')
export class RolesController {
  constructor(private authService: AuthService) {}

  @Get()
  findAll() {
    return this.authService.findAllRoles();
  }

  @Post()
  create(@Body() data: any) {
    return this.authService.createRole(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.authService.updateRole(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.authService.deleteRole(id);
  }

  @Get('permissions')
  findAllPermissions() {
    return this.authService.findAllPermissions();
  }
}
