import { BadRequestException, Injectable } from '@nestjs/common';
import sharp, { FormatEnum } from 'sharp';
import { UploadMetaInput } from './dtos/upload-meta-input.dto';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import jpeg from 'jpeg-js';
import * as tf from '@tensorflow/tfjs';
import * as nsfw from 'nsfwjs';

interface IImageFormat {
  width?: number;
  height?: number;
  quality?: number;
  format?: keyof FormatEnum;
}

interface IResizeImageInput extends IImageFormat {
  file: Express.Multer.File;
  filePath: string;
}

const PORN_ClASSES = ['Porn', 'Hentai'];

@Injectable()
export class UploaderService {
  private model: nsfw.NSFWJS;
  private imagePath = '';

  constructor(private readonly configService: ConfigService) {
    this.loadNsfwModel();
    this.imagePath = this.configService.get<string>('imagePath');
  }

  private async loadNsfwModel(): Promise<void> {
    if (!this.model) {
      this.model = await nsfw?.load();
    }
  }

  private async bulkUpload(
    files: Express.Multer.File[],
    cb: Function,
    ...otherArgs: any[]
  ): Promise<string[]> {
    const bulkSize = 10;
    const res: string[] = [];
    for (let i = 0; i < files.length; i += bulkSize) {
      const bulk = files.slice(i, i + bulkSize);
      const urls = await Promise.all(
        bulk.map((file) => cb(file, ...otherArgs)),
      );
      res.push(...urls);
    }

    return res;
  }

  private getFilePath(
    type: 'video' | 'image',
    format: keyof FormatEnum = 'jpeg',
  ): string {
    return `${this.imagePath}/${
      type === 'video' ? `${uuid()}.mp4` : `${uuid()}.${format}`
    }`;
  }

  private getImageFormat(meta: UploadMetaInput): IImageFormat {
    switch (meta.type) {
      case 'avatar':
        return {
          format: 'jpeg',
          height: 200,
          quality: 100,
          width: 200,
        };
      case 'background': {
        return {
          format: 'jpeg',
          height: 1080,
          quality: 100,
          width: 1920,
        };
      }
      case 'tweet':
        return {
          format: 'jpeg',
          height: 500,
          quality: 100,
          width: 500,
        };
      default:
        return {
          format: 'jpeg',
          height: 500,
          quality: 100,
          width: 500,
        };
    }
  }

  private getFileType = (file: Express.Multer.File) =>
    file.originalname?.split('.')[1];

  private async uploadToCloudinary(
    file: string,
    format: string,
  ): Promise<string> {
    try {
      const response = await cloudinary.uploader.upload(file, {
        folder: this.configService.get<string>('cloudinary.path'),
        resource_type: format,
      });
      return response?.secure_url ?? '';
    } catch (error) {
      console.error('Error uploading to cloudinary', error);
      return '';
    }
  }

  private async resizeImage({
    file,
    format = 'jpeg',
    height = 1333,
    quality = 100,
    width = 2000,
    filePath,
  }: IResizeImageInput): Promise<void> {
    try {
      await sharp(file.buffer)
        .resize(width, height, { fit: 'inside' })
        .toFormat(format)
        .jpeg({ quality })
        .toFile(filePath);
    } catch (error) {
      console.error(`${this.resizeImage.name} error`, error);
      throw error;
    }
  }

  private convertToTensor3D(img: jpeg.BufferLike): tf.Tensor3D {
    const image = jpeg.decode(img);
    const numChannels = 3;
    const numPixels = image.width * image.height;
    const values = new Int32Array(numPixels * numChannels);
    for (let i = 0; i < numPixels; i++)
      for (let c = 0; c < numChannels; ++c)
        values[i * numChannels + c] = image.data[i * 4 + c];

    return tf.tensor3d(
      values,
      [image.height, image.width, numChannels],
      'int32',
    );
  }

  private async isNsfw(filePath: string): Promise<boolean> {
    try {
      const img = fs.readFileSync(filePath);
      const tensor = this.convertToTensor3D(img);
      const predictions = await this.model.classify(tensor);
      return predictions.some((prediction) => {
        const { className, probability } = prediction;
        return PORN_ClASSES.includes(className) && probability >= 0.5;
      });
    } catch (error) {
      console.error(`${this.isNsfw.name} error`, error);
      throw error;
    }
  }

  private async uploadImage(
    file: Express.Multer.File,
    imageFormat: IImageFormat,
  ): Promise<string> {
    const filePath = this.getFilePath('image');
    console.log('filePath', filePath);

    await this.resizeImage({
      file,
      filePath,
      ...imageFormat,
    });
    const isNsfw = await this.isNsfw(filePath);
    if (isNsfw) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`${this.uploadImage.name} unlink error`, err);
        }
      });
      throw new BadRequestException('nsfw');
    }
    await this.resizeImage({
      file,
      filePath,
      ...imageFormat,
    });
    const url = await this.uploadToCloudinary(filePath, 'image');
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`${this.uploadImage.name} unlink error`, err);
      }
    });
    return url;
  }

  private async uploadVideo(file: Express.Multer.File): Promise<string> {
    const filePath = this.getFilePath('video');
    fs.writeFileSync(filePath, file.buffer);
    console.log('file', file);
    const url = await this.uploadToCloudinary(filePath, 'video');
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`${this.uploadImage.name} unlink error`, err);
      }
    });
    return url;
  }

  async uploadMedias(
    files: Express.Multer.File[],
    meta: UploadMetaInput,
  ): Promise<string[]> {
    const imageFiles = files.filter((file) =>
      file.mimetype.startsWith('image/'),
    );
    const videoFiles = files.filter((file) =>
      file.mimetype.startsWith('video/'),
    );

    console.log('videoFiles', videoFiles);

    const imageFormat = this.getImageFormat(meta);
    const uploadImageFunc = this.uploadImage.bind(this);
    const uploadVideoFunc = this.uploadVideo.bind(this);
    const [imageUrls, videoUrls] = await Promise.all([
      this.bulkUpload(imageFiles, uploadImageFunc, imageFormat),
      this.bulkUpload(videoFiles, uploadVideoFunc),
    ]);

    return [...imageUrls, ...videoUrls];
  }
}
