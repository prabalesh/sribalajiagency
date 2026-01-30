import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions } from './decorators/permissions.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class UsersController {
    constructor(private authService: AuthService) { }

    @Get()
    @Permissions('VIEW_USERS')
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20'
    ) {
        return this.authService.findAllUsers(+page, +limit);
    }

    @Put(':id')
    @Permissions('UPDATE_USER')
    update(@Param('id') id: string, @Body() data: any) {
        return this.authService.updateUser(id, data);
    }

    @Delete(':id')
    @Permissions('DELETE_USER')
    delete(@Param('id') id: string) {
        return this.authService.deleteUser(id);
    }
}
