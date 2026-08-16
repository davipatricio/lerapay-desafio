import { cp, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const apiRoot = resolve(import.meta.dirname, '..');
const outputDirectory = resolve(apiRoot, 'dist/swagger-ui');
const requireFromApi = createRequire(resolve(apiRoot, 'package.json'));
const swaggerPackage = requireFromApi.resolve('@nestjs/swagger/package.json');
const requireFromSwagger = createRequire(swaggerPackage);
const swaggerUiPackage = requireFromSwagger.resolve('swagger-ui-dist/package.json');
const sourceDirectory = dirname(swaggerUiPackage);

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });
await cp(sourceDirectory, outputDirectory, { recursive: true });
