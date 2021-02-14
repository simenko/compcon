# Why another Javascript configuration management library?

There are plenty of config libs now, from simple tools for managing environment vars like dotenv to sophisticated libs like nconf or node-config. But I was not completely happy with any of them. What should a perfect config management tool look like? 
- It should have a first-class support for asynchronous loading of config values from remote sources like Hashicorp 
  Vault. This requirement also means that it should allow referencing configuration values from other parts of 
  configuration during load to avoid situations when you need another one, smaller configuration and supporting code to 
  bootstrap the main configuration.
- It should be able to update configuration at runtime, without app restart. At the same time, it must guarantee configuration consistency and validity during the update process, and it should be able to notify all parts of the application about configuration changes.
- It should provide a flexible and explicit way of composing parts of configuration depending on the deployment 
  environment. Three basic `process.env.NODE_ENV='development'|'test'|'production'` values are not enough. The real enterprise-level Node.js app may need separate configuration scenarios for local development, remote 
  development server, local testing, testing on a remote CI server, a couple of production-like remote environments (a 
  staging server, sandboxes for integration with the other teams) and production itself. It may take configuration 
  values from the environment, command line arguments, static config files, injected to the app directory by some configuration or orchestration tools, external sources like database or secret management services.
- It should provide reasonable defaults, but be completely customizable. It also would be nice not having a "configuration for configuration" in the form of reserved environment variable, command line argument or configuration parameter names.


## Basic concepts
The configuration is composed of several *layers* which are stacked upon each other just like image layers in Photoshop or video layers in a compositing software - top layers "shadow" overlapping parts of lower layers. Physically, each layer is a js, ts, json, any other file or even plain object literal, describing some logical part of the configuration. 

Typical application has at least three layers:
1. Base layer, where reside all values that do not depend on deployment environment.
2. Deployment-specific layer (test, staging, prod, development etc.)
3. Override layer - local machine-specific settings, which are not committed to the application repository. 
   
Layers are loaded one by one and composed into a configuration *scenario*. Any non-trivial application requires the ability to dynamically load some configuration values and may have some values, dependent of other configuration values. It is achieved with the help of *readers*. Readers are async functions that retrieve actual values after configuration scenario is loaded. During the compilation phase, all readers are called and replaced with the actual values in the configuration tree. Then the tree is frozen and is ready to use. 

## Type safety and validation
Compcon is built with type safety and validation in mind. Though both validation and type safety are optional, it is 
strongly recommended using them. The choice of validation library and the way you transform raw, untyped config to a 
class of a predefined shape is up to you, you just need to provide two simple functions - validator and classTransformer. The example, built on top of class-transformer and class-validator, can be found at `test/testConfig/schema.ts` file.
   
## Usage examples - from trivial to sophisticated
### Ridiculously trivial example
```javascript
// index.js
import { UntypedConfig } from 'compcon'

const config = await new UntypedConfig().create([{
  hello: 'world'
}])

console.log(config.get()) // { hello: 'world' }
```
This configuration is not very useful, but Compcon actually does some work under the hood here. 

First, by default it applies so called 'conventional' reader to every plain value found in your config. The 
conventional reader uses a commonly adopted pattern - it tries to read the value from "--hello" command line argument first, then from "HELLO" environment variable, and, if both are undefined, takes the default "world" value you have passed to `create()` method. You can see how it works by running the index.js like this:
```shell
node index.js --hello="another world"
```
or like this:
```shell
HELLO="some other world" node index.js
```
Second, if you try to change the value of 'hello' in runtime, you won't be able to do this. Compcon makes the configuration immutable. The only way to change it is to use `update()` method. This limitation is needed to guarantee configuration consistency, validity, and type safety.
### Trivial, normal, complex examples
TBD

## Comparison with competitors
TBD

##Internals and customization
TBD
