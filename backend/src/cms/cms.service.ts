import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema';
import { DRIZZLE_DB } from '../database/drizzle/drizzle.module';
import {
  UpdateHomeCmsDto,
  UpdateHeroDto,
  UpdateAboutDto,
  UpdateSocialLinksDto,
  UpdateVisibilityDto,
  UpdateContactDto,
} from './dto/update-home-cms.dto';
import { FileStorageService } from '../common/services/file-storage.service';

/**
 * Service for managing homepage CMS content using Drizzle ORM.
 */
@Injectable()
export class CMSService {
  private readonly CMS_ID = '00000000-0000-0000-0000-000000000001';
  private readonly logger = new Logger(CMSService.name);

  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase<typeof schema>,
    private fileStorageService: FileStorageService,
  ) {}

  /**
   * Retrieves the homepage CMS content.
   */
  async getCMS() {
    this.logger.log('Fetching CMS content');

    const cms = await this.db.query.homeCms.findFirst({
      where: eq(schema.homeCms.id, this.CMS_ID),
    });

    if (!cms) {
      this.logger.warn('CMS content not found, creating default content');
      const defaultCMS = {
        id: this.CMS_ID,
        heroType: 'classic',
        heroBadge: 'AUTHORIZED DEALER',
        heroTitle: 'Experience the Future of Home Technology',
        heroSubtitle:
          'Premium selection of global brands including Sony, Samsung, and Bosch. Engineered for excellence, delivered with care.',
        heroImage:
          'https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=2000',
        heroLink: '/products',
        heroLinkText: 'Explore Collection',
        heroSlides: [
          {
            title: 'Elite Home Cinema Experience',
            subtitle:
              'Transform your living space with the latest Sony Bravia XR technologies. Cinema-grade visuals, right at home.',
            badge: 'AUTHORIZED SONY PARTNER',
            image:
              'https://images.unsplash.com/photo-1593784991095-a205039470b6?q=80&w=2000',
            link: '/products',
            linkText: 'Explore Collection',
          },
          {
            title: 'The Future of Smart Cooking',
            subtitle:
              'Experience the precision of Bosch German engineering. Smart appliances for a smarter kitchen.',
            badge: 'BOSCH EXCLUSIVE',
            image:
              'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2000',
            link: '/products',
            linkText: 'Discover Bosch',
          },
        ],
        showCategories: true,
        showFeatured: true,
        showBrands: true,
        showTrustMarkers: true,
        aboutTitle: 'About Sri Balaji Agency',
        aboutContent:
          'With over two decades of excellence, Sri Balaji Agency has been at the forefront of providing premium electronic solutions. We pride ourselves on representing global giants and delivering unmatched customer service.',
        address: '123, Main Road, Coimbatore, Tamil Nadu, India',
        email: 'info@sribalajiagency.com',
        phone: '+91 98765 43210',
        socialLinks: [
          { platform: 'Facebook', url: '#', icon: 'fb' },
          { platform: 'Instagram', url: '#', icon: 'ig' },
        ],
      };

      try {
        const [newCMS] = await this.db
          .insert(schema.homeCms)
          .values(defaultCMS as any)
          .onConflictDoNothing()
          .returning();

        if (newCMS) return newCMS;

        return await this.db.query.homeCms.findFirst({
          where: eq(schema.homeCms.id, this.CMS_ID),
        });
      } catch (error) {
        this.logger.error(
          `Failed to create default CMS content: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(
          'Failed to initialize CMS content',
        );
      }
    }

    return cms;
  }

  /**
   * Updates the homepage CMS content.
   */
  async updateCMS(data: UpdateHomeCmsDto) {
    this.logger.log('Updating CMS content');

    try {
      const [updatedCMS] = await this.db
        .update(schema.homeCms)
        .set(data)
        .where(eq(schema.homeCms.id, this.CMS_ID))
        .returning();

      if (!updatedCMS) {
        // If update failed because record doesn't exist, create it via getCMS and then update
        await this.getCMS();
        const [secondTry] = await this.db
          .update(schema.homeCms)
          .set(data)
          .where(eq(schema.homeCms.id, this.CMS_ID))
          .returning();
        return secondTry;
      }

      this.logger.log('CMS content updated successfully');
      return updatedCMS;
    } catch (error) {
      this.logger.error(
        `Failed to update CMS content: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update CMS content');
    }
  }

  async updateHero(data: UpdateHeroDto) {
    return this.updateCMS(data);
  }

  async updateAbout(data: UpdateAboutDto) {
    return this.updateCMS(data);
  }

  async updateSocialLinks(data: UpdateSocialLinksDto) {
    return this.updateCMS(data);
  }

  async updateVisibility(data: UpdateVisibilityDto) {
    return this.updateCMS(data);
  }

  async updateContact(data: UpdateContactDto) {
    return this.updateCMS(data);
  }

  /**
   * Uploads an image for CMS content.
   */
  async uploadImage(file: Express.Multer.File) {
    this.logger.log(`Uploading CMS image: ${file.originalname}`);

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size must not exceed 30MB');
    }

    try {
      const url = await this.fileStorageService.saveFile(file, 'cms', false);
      this.logger.log(`CMS image uploaded successfully: ${url}`);
      return { url };
    } catch (error) {
      this.logger.error(
        `Failed to upload CMS image: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  /**
   * Deletes a file from storage.
   */
  async deleteFile(url: string) {
    this.logger.log(`Deleting file: ${url}`);

    if (!url) {
      throw new BadRequestException('URL is required');
    }

    try {
      await this.fileStorageService.deleteFile(url.replace('/uploads/', ''));
      this.logger.log(`File deleted successfully: ${url}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete file ${url}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}
