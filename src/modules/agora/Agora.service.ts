import { Injectable } from '@nestjs/common';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';
import { AGORA_APP_CERTIFICATE, AGORA_APP_ID } from 'src/common/config/env';

@Injectable()
export class AgoraService {
    async generateToken(
        channelName: string,
        role = RtcRole.PUBLISHER,
        tokenExpireTime = 3600,
    ) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + tokenExpireTime;

        const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            0,
            role,
            privilegeExpiredTs,
        );

        console.log(`token`, token);

        return token;
    }
}
