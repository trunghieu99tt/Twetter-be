import { INestApplication } from '@nestjs/common';
import { ExpressPeerServer } from 'peer';

const peerConnection = (app: INestApplication): void => {
  console.log(app.getHttpAdapter().getHttpServer());
  const peerServer = ExpressPeerServer(
    app.getHttpAdapter().getHttpServer(),
    {},
  );
  app.use('/peerjs', peerServer);
  peerServer.on('connection', (client) => {
    console.log('peer connected', client.getId());
  });
  peerServer.on('disconnect', (client) => {
    console.log('peer disconnected', client.getId());
  });
};

export default peerConnection;
