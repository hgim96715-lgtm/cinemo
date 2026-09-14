import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AppModule } from '../app.module';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const config = new DocumentBuilder()
    .setTitle('CINEMO API')
    .setDescription('Cinema in Motion — 영화관 로비 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  await writeFile(
    join(process.cwd(), '..', '..', 'packages', 'api-contract', 'openapi.json'),
    `${JSON.stringify(document, null, 2)}\n`,
    'utf8',
  );

  await app.close();
}

generateOpenApi().catch((error: unknown) => {
  console.error('OpenAPI schema generation failed:', error);
  process.exitCode = 1;
});
