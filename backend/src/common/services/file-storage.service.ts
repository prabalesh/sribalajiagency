import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface StorageProvider {
    saveFile(file: Express.Multer.File, folder: string): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
}

@Injectable()
export class FileStorageService implements StorageProvider {
    private readonly logger = new Logger(FileStorageService.name);
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly publicUrl: string;

    constructor(private configService: ConfigService) {
        const accountId = this.configService.getOrThrow<string>('R2_ACCOUNT_ID');
        const accessKeyId = this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.getOrThrow<string>('R2_SECRET_ACCESS_KEY');
        this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
        this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

        this.s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async saveFile(file: Express.Multer.File, folder: string = 'images', optimize: boolean = true): Promise<string> {
        try {
            let buffer: Buffer;
            let contentType: string;
            let extension: string;

            if (optimize) {
                // Optimization: Resize and convert to WebP
                buffer = await sharp(file.buffer)
                    .resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
                    .webp({ quality: 80 }) // 80% quality
                    .toBuffer();
                contentType = 'image/webp';
                extension = 'webp';
            } else {
                // No optimization: Use original buffer
                buffer = file.buffer;
                contentType = file.mimetype;
                // Extract extension from original filename or mimetype
                extension = file.originalname.split('.').pop() || 'bin';
            }

            const fileName = `${uuidv4()}.${extension}`;
            const key = `${folder}/${fileName}`;

            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                    Body: buffer,
                    ContentType: contentType,
                }),
            );

            this.logger.log(`Uploaded file to R2: ${key} (optimized: ${optimize})`);

            // Return full public URL if available, else relative path (which might need prefixing on frontend)
            // Ideally, we return the full CDN URL.
            return this.publicUrl ? `${this.publicUrl}/${key}` : key;
        } catch (error) {
            this.logger.error(`Failed to upload file to R2: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Failed to upload file');
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // Extract Key from URL if necessary
            // Assuming fileUrl is either the full URL or the Key
            let key = fileUrl;
            if (this.publicUrl && fileUrl.startsWith(this.publicUrl)) {
                key = fileUrl.replace(`${this.publicUrl}/`, '');
            } else if (fileUrl.startsWith('http')) {
                // Try to guess key if it's a full URL but not matching publicUrl exactly (e.g. different protocol)
                const urlParts = new URL(fileUrl);
                key = urlParts.pathname.substring(1); // Remove leading slash
            }

            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                }),
            );

            this.logger.log(`Deleted file from R2: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to delete file from R2: ${error.message}`, error.stack);
            // We don't throw here to avoid blocking main operation if cleanup fails
        }
    }
}
