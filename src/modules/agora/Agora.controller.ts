import { Body, Controller, Inject, Post } from '@nestjs/common';
import { AgoraService } from './Agora.service';
import { GenerateTokenDTO } from './dto/generateToken.dto';

@Controller('agora')
export class AgoraController {
  @Inject()
  private readonly agoraService: AgoraService;

  @Post('generate-token')
  async generateToken(@Body() body: GenerateTokenDTO): Promise<string> {
    const { channelName } = body;
    const token = await this.agoraService.generateToken(channelName);
    return token;
  }
}
