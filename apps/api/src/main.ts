import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { formatValidationErrors } from './common/validation';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.setGlobalPrefix('api');
  app.enableCors();
  // Rejeita propriedades fora do contrato e centraliza a experiência de
  // validação em pt-BR, sem repetir mensagens em todos os DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) =>
        new BadRequestException({
          error: 'Requisição inválida',
          message: formatValidationErrors(errors),
          statusCode: 400,
        }),
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
      whitelist: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API BaaS da LeraPay')
    .setDescription('API de Banking as a Service (BaaS) integrada ao gateway simulado Lera Box')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    // Vercel cannot reliably trace Swagger's runtime asset lookup through pnpm.
    customSwaggerUiPath: join(__dirname, 'swagger-ui'),
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
