import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createReviewDto: CreateReviewDto, @Req() req) {
    return this.reviewsService.create(createReviewDto, req.user.id);
  }

  @Get('product/:productId')
  findAllByProduct(
    @Param('productId') productId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
  ) {
    return this.reviewsService.findAllByProduct(productId, +page, +limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/reply')
  reply(@Param('id') id: string, @Body('reply') reply: string) {
    // In a real app, you'd check for admin role here
    return this.reviewsService.replyToReview(id, reply);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.reviewsService.remove(id, req.user.id);
  }
}
