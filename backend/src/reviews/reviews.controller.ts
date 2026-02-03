import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../auth/entities/user.entity';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createReviewDto: CreateReviewDto, @Req() req) {
        return this.reviewsService.create(createReviewDto, req.user as User);
    }

    @Get('product/:productId')
    findAllByProduct(@Param('productId') productId: string) {
        return this.reviewsService.findAllByProduct(productId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {
        return this.reviewsService.remove(id, req.user as User);
    }
}
