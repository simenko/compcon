import setup from './Config'
export default setup
export { iConfigLogger, validate, transform, POJO } from './Config'
export { iFileLoader, ts, js, json } from './fileLoaders'
export { iValueTransformer } from './valueTransformers'
export { iPathTransformer } from './pathTransformers'
export {
    env,
    get,
    firstOf,
    conventional,
    withTransformers,
    iDefaultReaderCreator,
    iReaderCreator,
    iReader,
} from './readers'
export { ConfigurationError, ErrorCodes } from './errors'
