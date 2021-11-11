import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { UploadService } from './upload.service';
import { UploadTool } from '../../common/tool/upload.tool';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiFile } from 'src/common/decorators/apiFile.decorator';
@Controller('upload')
@ApiTags("Upload")
export class UploadController {

    constructor(private readonly uploadService: UploadService) { }

    @Post('/image')
    @UseGuards(MyTokenAuthGuard)
    @ApiConsumes('multipart/form-data')
    @ApiFile("image")
    @UseInterceptors(FileInterceptor('image', UploadTool.imageUpload))
    uploadImage(@UploadedFile() fileUpload: any): Promise<{ url: string }> {
        return this.uploadService.uploadSingleMedia(fileUpload);
    }
}
