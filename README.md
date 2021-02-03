# Why another Javascript configuration management library?

There are plenty of config libs now. From simple tools for managing environment vars like dotenv to sophisticated 
libs like nconf or node-config. But I was not completely happy with any of them. What should a perfect config 
management tool look like? 
- It should have first-class support for asynchronous loading of config values from remote sources like Hashicorp Vault.
- It should be able to update configuration at runtime, without app restart.
- It should provide a flexible and explicit way of composing parts of configuration depending on the deploy 
  environment. Three basic "development", "test", and "production" envs are not enough and are not compliant with 12 
  factor apps paradigm either. The real enterprise-level Node.js app may need separate configurations for local 
  development, remote development server, local testing, testing during CI, a couple of production-like remote 
  environments (a staging server or sandboxes for integration with the other teams) and production itself.   

## Basic concepts
The configuration is composed of several *layers* which are stacked upon each other just like image layers in 
Photoshop or video layers in a compositing software - top layers "shadow" overlapping parts of lower layers. 
Physically each layer is a js, ts, json, or any other file describing some logical part of the configuration.Typical
application has at least three layers:
1. Base layer, where reside all values that do not depend on deployment environment.
2. Deployment-specific layer (test, staging prod, dev etc.)
3. Override layer - local machine-specific settings. It is recommended not to commit override layer to the
   application repo. 
   
Layers are loaded one by one and composed into a configuration *scenario*. Any non-trivial application requires the 
ability to dynamically load some configuration values and may have some values, dependent of other configuration 
values. It is achieved with the help of *readers*. Readers are async functions that read values after configuration 
scenario is loaded. During the compilation phase, all readers are called and replaced with the actual values in the 
configuration tree. Then the tree is frozen and ready to use. 
   
## Usage examples - from trivial to sophisticated
TBD

## Comparison with competitors
TBD

##Internals and customization
TBD
