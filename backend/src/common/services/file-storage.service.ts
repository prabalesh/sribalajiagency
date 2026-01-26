import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';


export interface StorageProvider {
    saveFile(file: Express.Multer.File, folder: string): Promise<string>;
    deleteFile(filePath: string): Promise<void>;
}

@Injectable()
export class FileStorageService implements StorageProvider {
    private readonly uploadPath = 'uploads';

    constructor() {
        this.ensureDirectoryExists(this.uploadPath);
    }

    private ensureDirectoryExists(dir: string) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    async saveFile(file: Express.Multer.File, folder: string = 'images'): Promise<string> {
        const targetDir = path.join(this.uploadPath, folder);
        this.ensureDirectoryExists(targetDir);

        const fileName = `${uuidv4()}.webp`;
        const filePath = path.join(targetDir, fileName);

        // Compress and convert to webp
        await sharp(file.buffer)
            .resize({ width: 1200, withoutEnlargement: true }) // reasonable max width
            .webp({ quality: 80 })
            .toFile(filePath);

        return `/uploads/${folder}/${fileName}`;
    }

    async deleteFile(filePath: string): Promise<void> {
        const fullPath = path.join(this.uploadPath, filePath);
        try {
            if (existsSync(fullPath)) {
                await fs.unlink(fullPath);
            }
        } catch (error) {
            console.error(`Failed to delete file: ${fullPath}`, error);
        }
    }
}
