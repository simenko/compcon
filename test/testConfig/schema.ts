import 'reflect-metadata'

import { IsString, ValidateNested, validateSync } from 'class-validator'
import { plainToClass, Type } from 'class-transformer'
import { validator, classTransformer, POJO, ConfigurationError, Codes } from '../../src'

class DbConfiguration {
    @IsString()
    url!: string

    @IsString()
    user!: string

    @IsString()
    password!: string
}

class VaultConfiguration {
    @IsString()
    url!: string
}

class AppConfig {
    @IsString()
    appName!: string

    @Type(() => DbConfiguration)
    @ValidateNested()
    db!: Readonly<DbConfiguration>

    @Type(() => VaultConfiguration)
    @ValidateNested()
    vault!: Readonly<VaultConfiguration>
}

export type ReadonlyAppConfig = Readonly<AppConfig>

export const validate: validator<AppConfig> = (config: AppConfig) => {
    const validationErrors = validateSync(config, {
        validationError: { target: false },
        whitelist: true,
        forbidNonWhitelisted: true,
    })
    if (validationErrors.length) {
        throw new ConfigurationError(
            Codes.VALIDATION_ERROR,
            validationErrors.map((e) => new Error(JSON.stringify(e, null, 2))),
        )
    }
}

export const transform: classTransformer<AppConfig> = (rawConfig: POJO) => plainToClass(AppConfig, rawConfig)
