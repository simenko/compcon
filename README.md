# Why another configuration management library?

There are plenty of configuration management libraries, from simple tools for managing environment vars like dotenv to sophisticated ones like nconf or node-config. I have tried many of them and not a single one made me completely happy. What do I want from a perfect config management tool? 
- It should have a first-class support for asynchronous loading of config values from remote sources like Hashicorp Vault. This requirement also means that it should allow referencing configuration values from other parts of configuration during load to avoid situations when you need another one, smaller configuration and supporting code to bootstrap the main configuration.
- It should be able to update configuration at runtime, without app restart. At the same time, it must guarantee configuration consistency and validity during the update process, and it should be able to notify all parts of the application about configuration changes.
- It should provide a flexible and explicit way of composing parts of configuration depending on the deployment environment. Three basic `process.env.NODE_ENV='development'|'test'|'production'` values are not enough. The real enterprise-level Node.js app may need separate configuration scenarios for local development, remote development server, local testing, testing on a remote CI server, a couple of production-like remote environments (a staging server, sandboxes for integration with the other teams) and production itself. It may take configuration values from the environment, command line arguments, static config files, injected to the app directory by some configuration or orchestration tools, external sources like database or secret management services.
- It should provide reasonable defaults, but be completely customizable. It also would be nice not having a "configuration for configuration" in the form of reserved environment variable, command line argument or configuration parameter names.
- It should support type safety and validation.
The best way to show how all these requirements are met in the Compcon is to provide a series of examples, from 
  trivial ones to complex.
  
## Usage examples
### Ridiculously trivial example
```javascript
// index.js
const { UntypedConfig }  = require('compcon')

const config = await new UntypedConfig().create([{
  hello: {
    world: 'true'
  }
}])

console.log(config.get()) // { hello: { world: true } }
```
This configuration is not very useful, but even here Compcon does some work under the hood. 

First, by default it parses every string value found in your config (you can disable this default behaviour if you want). 'true' string becomes `true` boolean value. 

Second, if you try to change the value of 'hello' in runtime, you won't be able to do this. Compcon makes the configuration immutable. The only way to change it is to use `update()` method. This limitation is needed to guarantee configuration consistency, validity, and type safety. 
### Configuration files
In the real life application configuration usually consists of one or many files with tree-like structure. Out of the box, Compcon supports `.json`, `.js`, and `.ts` files. Let's try to put some part of the configuration into a json file:
```json
// /src/config/base.json
{
  "appName": "example",
  "hello": "hi!"
}
```
```javascript
// /src/index.js
const { path } = require('path')
const { UntypedConfig }  = require('compcon')

const config = await new UntypedConfig().create([
    'base', 
    {
        hello: {
            world: 'true'
        }
    }
], path.resolve(__dirname, 'config'))

console.log(config.get()) // { appName: 'example', hello: { world: true } }
```
The first argument of a `create()` method is an array with configuration **layers**. Each layer is a string or an object literal. In case of a string, the layer's content is in a separate file. Compcon scans the config directory (the second argument) and loads configuration files with the base names matching layer names in the order they appear in `create()` call. Configuration files may be of any supported type. If there are more than one file with the same base name, only one of them will be loaded (`.json`, then `.js`, then `.ts`, you may change the order if needed). Layers may be missing, but if there are layers in an unsupported format, Compcon will throw an error. 

Layers are composed like image layers in a Photoshop file - overlapping values from earlier layer are "shadowed" by the ones from the layer loaded later. In a more realistic example layer stack may look like this:
```javascript
const config = await new UntypedConfig().create([
    'base', 
    process.env.NODE_ENV || 'development',
    'override',
], path.resolve(__dirname, 'config'))
```
There are no default or conventional layer names, or default configuration directory. It is a deliberate decision - couple of keystrokes saved due to an implicit naming conventions are not worth the readability and unambiguity of an explicit solution.

###  normal, complex examples
TBD

## Basic concepts
The configuration is composed of several *layers* which are stacked upon each other just like image layers in Photoshop or video layers in a compositing software - top layers "shadow" overlapping parts of lower layers. Physically, each layer is a js, ts, json, any other file or even plain object literal, describing some logical part of the configuration.

Typical application has at least three layers:
1. Base layer, where reside all values that do not depend on deployment environment.
2. Deployment-specific layer (test, staging, prod, development etc.)
3. Override layer - local machine-specific settings, which are not committed to the application repository.

Layers are loaded one by one and composed into a configuration *scenario*. Any non-trivial application requires the ability to dynamically load some configuration values and may have some values, dependent of other configuration values. It is achieved with the help of *readers*. Readers are async functions that retrieve actual values after configuration scenario is loaded. During the compilation phase, all readers are called and replaced with the actual values in the configuration tree. Then the tree is frozen and is ready to use.

## Type safety and validation
Compcon is built with type safety and validation in mind. Though both validation and type safety are optional, it is strongly recommended using them. The choice of validation library and the way you transform raw, untyped config to a class of a predefined shape is up to you, you just need to provide two simple functions - validator and classTransformer. The example, built on top of class-transformer and class-validator, can be found at `test/testConfig/schema.ts` file.

## Comparison with competitors
TBD

##Internals and customization
TBD
