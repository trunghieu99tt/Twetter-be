import { Injectable } from '@nestjs/common';
import { UploadTool } from '../../common/tool/upload.tool';

@Injectable()
export class UploadService {
    async uploadSingleImage(file: any): Promise<{ url: string }> {
        let url = '';
        if (file) {
            url = await UploadTool.resizeAndUploadSingle(file);
        }
        return { url };
    }

    async uploadMultiImages(files: any): Promise<string[]> {
        let urls = [];
        if (files) {
            urls = await UploadTool.resizeAndUploadMulti(files);
        }
        return urls;
    }
}
