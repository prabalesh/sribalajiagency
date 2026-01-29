import { Controller, Post, Body, Get, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuotationsService } from './quotations.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('quotations')
export class QuotationsController {
    constructor(private quotationsService: QuotationsService) { }

    @Post()
    create(@Body() dto: any, @Req() req: any) {
        // Optional JWT check to link quotation to user
        return this.quotationsService.create(dto, req.user?.sub);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('VIEW_QUOTATIONS')
    findAll() {
        return this.quotationsService.findAll();
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('VIEW_QUOTATIONS')
    findOne(@Param('id') id: string) {
        return this.quotationsService.findOne(id);
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_QUOTATION')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.quotationsService.updateStatus(id, status);
    }
}
