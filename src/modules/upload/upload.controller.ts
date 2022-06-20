import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { UploadTool } from '../../common/tool/upload.tool';
import { UploadMetaInput } from './dtos/upload-meta-input.dto';
import { UploaderService } from './uploader.service';
@Controller('upload')
@ApiTags('Upload')
export class UploadController {
  constructor(private readonly uploaderService: UploaderService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 20, UploadTool.imageUpload))
  uploadMedia(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() meta: UploadMetaInput,
  ): Promise<string[]> {
    return this.uploaderService.uploadMedias(files, meta);
  }
}
