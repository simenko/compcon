# Why another Javascript configuration management library?

There are plenty of config libs now. From simple tools for managing environment vars like dotenv to sophisticated 
libs like nconf or node-config. But no one was the perfect fit. What should a perfect config management tool look like? 
- It should have first-class support for asynchronous loading of config values from remote sources like Hashicorp Vault
- It should be able to update configuration at runtime, without app restart
- It should provide a flexible and explicit way of composing parts of configuration depending on the deploy 
  environment. Three basic "development", "test", and "production" envs are not enough and are not compliant with 12 
  factor apps either. The real enterprise-level Node.js app may need separate configurations for local development, 
  remote development server, local testing, testing during CI process, a couple of production-like remote 
  environments (a staging server or sandboxes for integration with the other teams) and production itself. 
  

## Basic concepts
The configuration consists of configuration *values* placed in a tree structure. Each value is asynchronously read 
from a source using a *reader*. There are a handful of readers out of the box - literal, env, arg, vault, and 
config readers. 

Config values are grouped into *layers*. Layers are purely logical entities - they do not depend on sources. Typical 
application has at least three layers: 
1. Base layer, where reside all values that do not depend on deployment environment.
2. Deployment-specific layer (test, staging prod, dev etc.)
3. Override layer - local machine-specific settings. It is recommended to not commit override layer to the 
   application repo.
   
## Configuration lifecycle

Configuration loading always starts from the base layer and finishes with optional override layer. On each layer 
special COMPCON_NEXT_LAYER key is used to determine the next layer name. If it is undefined, or not changed after 
loading the layer, override layer loads and layer loading finishes. 

Layers loading process is lazy, usually only one value is actually read - the COMPCON_NEXT_LAYER key. 

To actually load all config values, method load() is called. 

After loading, the configuration is validated with Joi and is ready to use.

## API

To get a config value, call get('path.to.the.config.key'). To load all config values again, call load(). 

Config is an instance of EventEmitter, you can subscribe to onChange and onLoad events.

There is also dump() method, which outputs internal representation of config with the full history of changes 



