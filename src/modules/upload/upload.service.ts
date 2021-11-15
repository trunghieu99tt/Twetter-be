import { Injectable } from '@nestjs/common';
import { UploadTool } from '../../common/tool/upload.tool';

@Injectable()
export class UploadService {
    async uploadSingleMedia(file: any): Promise<{ url: string }> {
        let url = '';
        if (file) {
            if (file?.mimetype === 'video/mp4') {
                console.log('file: ', file);
                url = await UploadTool.uploadVideo(file) as string;
                console.log(`url`, url)
            } else {
                url = await UploadTool.resizeAndUploadSingle(file);
            }
        }
        return { url };
    }

    async uploadMultiMedia(files: any): Promise<string[]> {
        let urls = [];
        if (files) {
            urls = await UploadTool.resizeAndUploadMulti(files);
        }
        return urls;
    }
}
