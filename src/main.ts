import { NestFactory } from '@nestjs/core';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { PRODUCTION, PROJECT_NAME, PROJECT_VERSION, PORT, SWAGGER_PATH } from './common/config/env';
import { MongoTool } from './tools/mongo.tool';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import peerConnection from 'src/modules/chat/chat.peerjs';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// swagger
	if (!PRODUCTION) {
		const options = new DocumentBuilder()
			.addBearerAuth()
			.setTitle(PROJECT_NAME)
			.setVersion(PROJECT_VERSION)
			.build();

		const document = SwaggerModule.createDocument(app, options);

		SwaggerModule.setup(SWAGGER_PATH, app, document, {
			customSiteTitle: PROJECT_NAME,
			swaggerOptions: {
				defaultModelsExpandDepth: -1,
				displayRequestDuration: true,
				docExpansion: 'none',
				filter: true,
				operationSorter: (a: any, b: any) => {
					const order: { [field: string]: string; } = {
						get: '0',
						post: '1',
						put: '2',
						delete: '3'
					};
					return (
						order[a._root.entries[1][1]].localeCompare(order[b._root.entries[1][1]]) ||
						a._root.entries[0][1].localeCompare(b._root.entries[0][1])
					);
				}
			}
		});
	}

	// Logger
	app.use(morgan(PRODUCTION ? 'combined' : 'dev'));

	MongoTool.initialize();

	app.enableCors();

	await app.listen(PORT);

	// peerConnection(app);

	console.log('Server running on port: ' + PORT);

}
bootstrap();
