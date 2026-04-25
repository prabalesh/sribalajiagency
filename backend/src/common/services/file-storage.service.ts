import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface StorageProvider {
  saveFile(file: Express.Multer.File, folder: string): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
}

// Operation counters for monitoring
let r2OperationCounters = {
  putObjectSuccess: 0,
  putObjectFailed: 0,
  deleteObjectSuccess: 0,
  deleteObjectFailed: 0,
  totalRetries: 0,
};

@Injectable()
export class FileStorageService implements StorageProvider {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('R2_ACCOUNT_ID');
    const accessKeyId =
      this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Limit retries to reduce unnecessary Class A operations
      maxAttempts: 2, // Reduced from default 3
      requestHandler: {
        metadata: { handlerProtocol: 'https/1.1' },
      },
    });

    // Log R2 client initialization
    this.logger.log('R2 Client initialized with retry limit: 2 attempts');
  }

  // Method to get operation statistics
  getOperationStats() {
    return { ...r2OperationCounters };
  }

  // Method to reset operation statistics
  resetOperationStats() {
    r2OperationCounters = {
      putObjectSuccess: 0,
      putObjectFailed: 0,
      deleteObjectSuccess: 0,
      deleteObjectFailed: 0,
      totalRetries: 0,
    };
    this.logger.log('R2 operation counters reset');
  }

  async saveFile(
    file: Express.Multer.File,
    folder: string = 'images',
    optimize: boolean = true,
  ): Promise<string> {
    const startTime = Date.now();
    const operationId = uuidv4().substring(0, 8);

    try {
      let buffer: Buffer;
      let contentType: string;
      let extension: string;

      // Log operation start
      this.logger.log(
        `[R2-${operationId}] Starting file upload - Original: ${file.originalname}, Size: ${file.size} bytes, Optimize: ${optimize}`,
      );

      if (optimize) {
        // Optimization: Resize and convert to WebP
        const sharpStart = Date.now();
        buffer = await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true }) // Max width 1200px
          .webp({ quality: 80 }) // 80% quality
          .toBuffer();
        contentType = 'image/webp';
        extension = 'webp';
        this.logger.log(
          `[R2-${operationId}] Sharp processing completed in ${Date.now() - sharpStart}ms, New size: ${buffer.length} bytes`,
        );
      } else {
        // No optimization: Use original buffer
        buffer = file.buffer;
        contentType = file.mimetype;
        // Extract extension from original filename or mimetype
        extension = file.originalname.split('.').pop() || 'bin';
        this.logger.log(
          `[R2-${operationId}] Skipping optimization, using original buffer`,
        );
      }

      const fileName = `${uuidv4()}.${extension}`;
      const key = `${folder}/${fileName}`;

      // Log PutObject operation details
      this.logger.log(
        `[R2-${operationId}] CLASS A OPERATION: PutObject - Bucket: ${this.bucketName}, Key: ${key}, ContentType: ${contentType}, Size: ${buffer.length} bytes`,
      );

      const uploadStart = Date.now();
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
        }),
      );
      const uploadDuration = Date.now() - uploadStart;

      // Increment success counter
      r2OperationCounters.putObjectSuccess++;

      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `[R2-${operationId}] ✓ Upload SUCCESS - Key: ${key}, Upload time: ${uploadDuration}ms, Total time: ${totalDuration}ms, Total PutObject ops: ${r2OperationCounters.putObjectSuccess}`,
      );

      // Return full public URL if available, else relative path (which might need prefixing on frontend)
      // Ideally, we return the full CDN URL.
      return this.publicUrl ? `${this.publicUrl}/${key}` : key;
    } catch (error) {
      // Increment failure counter
      r2OperationCounters.putObjectFailed++;

      const totalDuration = Date.now() - startTime;
      this.logger.error(
        `[R2-${operationId}] ✗ Upload FAILED - File: ${file.originalname}, Duration: ${totalDuration}ms, Error: ${error.message}, Total failures: ${r2OperationCounters.putObjectFailed}`,
        error.stack,
      );

      // Check if error is due to retries
      if (error.$metadata?.attempts) {
        const retryCount = error.$metadata.attempts - 1;
        r2OperationCounters.totalRetries += retryCount;
        this.logger.warn(
          `[R2-${operationId}] Operation retried ${retryCount} times. Total retries: ${r2OperationCounters.totalRetries}`,
        );
      }

      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const startTime = Date.now();
    const operationId = uuidv4().substring(0, 8);

    try {
      // Extract Key from URL if necessary
      // Assuming fileUrl is either the full URL or the Key
      let key = fileUrl;

      this.logger.log(
        `[R2-${operationId}] Starting file deletion - URL: ${fileUrl}`,
      );

      if (this.publicUrl && fileUrl.startsWith(this.publicUrl)) {
        key = fileUrl.replace(`${this.publicUrl}/`, '');
        this.logger.log(
          `[R2-${operationId}] Extracted key from public URL: ${key}`,
        );
      } else if (fileUrl.startsWith('http')) {
        // Try to guess key if it's a full URL but not matching publicUrl exactly (e.g. different protocol)
        const urlParts = new URL(fileUrl);
        key = urlParts.pathname.substring(1); // Remove leading slash
        this.logger.log(
          `[R2-${operationId}] Extracted key from HTTP URL: ${key}`,
        );
      }

      // Log DeleteObject operation details
      this.logger.log(
        `[R2-${operationId}] CLASS A OPERATION: DeleteObject - Bucket: ${this.bucketName}, Key: ${key}`,
      );

      const deleteStart = Date.now();
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      const deleteDuration = Date.now() - deleteStart;

      // Increment success counter
      r2OperationCounters.deleteObjectSuccess++;

      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `[R2-${operationId}] ✓ Delete SUCCESS - Key: ${key}, Delete time: ${deleteDuration}ms, Total time: ${totalDuration}ms, Total DeleteObject ops: ${r2OperationCounters.deleteObjectSuccess}`,
      );
    } catch (error) {
      // Increment failure counter
      r2OperationCounters.deleteObjectFailed++;

      const totalDuration = Date.now() - startTime;
      this.logger.error(
        `[R2-${operationId}] ✗ Delete FAILED - URL: ${fileUrl}, Duration: ${totalDuration}ms, Error: ${error.message}, Total failures: ${r2OperationCounters.deleteObjectFailed}`,
        error.stack,
      );

      // Check if error is due to retries
      if (error.$metadata?.attempts) {
        const retryCount = error.$metadata.attempts - 1;
        r2OperationCounters.totalRetries += retryCount;
        this.logger.warn(
          `[R2-${operationId}] Operation retried ${retryCount} times. Total retries: ${r2OperationCounters.totalRetries}`,
        );
      }

      // We don't throw here to avoid blocking main operation if cleanup fails
    }
  }
}
