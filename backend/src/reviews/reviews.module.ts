import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './entities/review.entity';
import { Product } from '../products/entities/product.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Review, Product]),
        AuthModule
    ],
    controllers: [ReviewsController],
    providers: [ReviewsService],
    exports: [ReviewsService]
})
export class ReviewsModule { }
