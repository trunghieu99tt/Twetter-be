import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { UploadService } from './upload.service';
import { UploadTool } from './upload.tool';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post('/image')
    @UseGuards(MyTokenAuthGuard)
    @UseInterceptors(FileInterceptor('image', UploadTool.imageUpload))
    uploadSingleImage(@UploadedFile() file: any): Promise<string> {
        return this.uploadService.uploadSingleImage(file);
    }

    @Post('/images')
    @UseGuards(MyTokenAuthGuard)
    @UseInterceptors(FileInterceptor('images', UploadTool.imageUpload))
    uploadMultiImage(@UploadedFile() files: any): Promise<string[]> {
        return this.uploadService.uploadMultiImages(files);
    }
}
