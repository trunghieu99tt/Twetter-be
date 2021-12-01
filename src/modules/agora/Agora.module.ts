import { Module } from '@nestjs/common';
import { AgoraController } from './Agora.controller';
import { AgoraService } from './Agora.service';

@Module({
    imports: [],
    controllers: [AgoraController],
    providers: [AgoraService],
})
export class AgoraModule {}
