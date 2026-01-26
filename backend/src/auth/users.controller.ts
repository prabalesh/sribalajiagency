import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UsersController {
    constructor(private authService: AuthService) { }

    @Get()
    @Permissions('MANAGE_USERS')
    findAll() {
        return this.authService.findAllUsers();
    }

    @Put(':id')
    @Permissions('MANAGE_USERS')
    update(@Param('id') id: string, @Body() data: any) {
        return this.authService.updateUser(id, data);
    }

    @Delete(':id')
    @Permissions('MANAGE_USERS')
    delete(@Param('id') id: string) {
        return this.authService.deleteUser(id);
    }
}
