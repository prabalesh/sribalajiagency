import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { AuthGuard } from '@nestjs/passport';
import {
  UpdateCartDto,
  ValidateCartDto,
  MergeCartDto,
  CartItemDto,
} from './dto/cart.dto';

@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  // Get user's cart
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getCart(@Request() req) {
    const cart = await this.cartsService.getUserCart(req.user.id);
    return this.cartsService.cartToDto(cart);
  }

  // Update entire cart
  @Put()
  @UseGuards(AuthGuard('jwt'))
  async updateCart(@Request() req, @Body() updateCartDto: UpdateCartDto) {
    const cart = await this.cartsService.updateUserCart(
      req.user.id,
      updateCartDto.items,
    );
    return this.cartsService.cartToDto(cart);
  }

  // Validate cart items (no auth required for guests)
  @Post('validate')
  async validateCart(@Body() validateCartDto: ValidateCartDto) {
    return this.cartsService.validateCartItems(validateCartDto.items);
  }

  // Merge guest cart with user cart
  @Post('merge')
  @UseGuards(AuthGuard('jwt'))
  async mergeCart(@Request() req, @Body() mergeCartDto: MergeCartDto) {
    const cart = await this.cartsService.mergeGuestCart(
      req.user.id,
      mergeCartDto.guestCart,
    );
    return this.cartsService.cartToDto(cart);
  }

  // Clear user's cart
  @Delete()
  @UseGuards(AuthGuard('jwt'))
  async clearCart(@Request() req) {
    await this.cartsService.clearUserCart(req.user.id);
    return { message: 'Cart cleared successfully' };
  }
}
