import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserAddressesService } from './user-addresses.service';

@Controller('user-addresses')
@UseGuards(AuthGuard('jwt'))
export class UserAddressesController {
  constructor(private readonly addressService: UserAddressesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.addressService.findAll(req.user);
  }

  @Post()
  create(@Req() req: any, @Body() data: any) {
    return this.addressService.create(req.user, data);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.addressService.update(req.user, id, data);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.addressService.remove(req.user, id);
  }

  @Post(':id/set-default')
  setDefault(@Req() req: any, @Param('id') id: string) {
    return this.addressService.setDefault(req.user, id);
  }
}
