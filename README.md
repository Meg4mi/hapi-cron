# hapi-cron-cluster
A Hapi plugin to setup cron jobs that will call predefined server routes at specified times with leader election (cluster mode)

# Based and fork from (credits)
https://github.com/antonsamper/hapi-cron

## Requirements
This plugin is compatible with **hapi** v17+ and requires Node v8+.
If you need a version compatible with **hapi** v16 please install version [1.1.1](https://github.com/meg4mi/hapi-cron-cluster/releases/tag/v1.1.1).
The plugin need to connect to mongo or redis (for leader election)
`hapi-cron-cluster@1.1.1`

## Installation
Add `hapi-cron-cluster` as a dependency to your project:

```bash
$ npm install --save hapi-cron-cluster
or
$ npm install --save hapi-cron-cluster@1.1.1  (for hapi v16)
```


## Usage
```javascript
const Hapi = require('hapi');
const HapiCron = require('hapi-cron-cluster');

const server = new Hapi.Server();

async function allSystemsGo() {

    try {
        await server.register({
            plugin: HapiCron,
            options: {
                lock: {
                    url: 'mongodb://localhost/test', // 'redis://localhost'
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: { // method: (hapi.js server method) or handler:
                        method: 'GET',
                        url: '/test-url'
                    },
                    onComplete: (res) => {
                        console.info('hapi cron has run');
                    }
                }]
            }
        });

        server.route({
            method: 'GET',
            path: '/test-url',
            handler: function (request, h) {
                return 'hello world'
            }
        });

        await server.start();
    }
    catch (err) {
        console.info('there was an error');
    }
}

allSystemsGo();
```

## Options
* `lock` - object that contains params for cluster leader election
* `lock.url` - mongodb or redis url
* `lock.key` - group key for leader election
* `lock.ttl` - time to live when lock acquire
* `lock.retry` - wait time brefore retrying to get the lock
* `jobs.name` - A unique name for the cron job
* `jobs.time` - A valid cron value. [See cron configuration](#cron-configuration)
* `jobs.timezone` - A valid [timezone](https://momentjs.com/timezone/)
* `jobs.request` - The request object containing the route url path. Other [options](https://hapijs.com/api#serverinjectoptions-callback) can also be passed into the request object 
    * `url` - Route path to request
    * `method` - Request method (defaults to `GET`) - `optional`
* `onComplete` - Function to run after the route has been requested. The function will contain the response from the request - `optional`


## Cron configuration
This plugin uses the [node-cron](https://github.com/kelektiv/node-cron) module to setup the cron job. 


### Available cron patterns:
```
Asterisk. E.g. *
Ranges. E.g. 1-3,5
Steps. E.g. */2
```
    

[Read up on cron patterns here](http://crontab.org). Note the examples in the link have five fields, and 1 minute as the finest granularity, but the node cron module allows six fields, with 1 second as the finest granularity.

### Cron Ranges
When specifying your cron values you'll need to make sure that your values fall within the ranges. For instance, some cron's use a 0-7 range for the day of week where both 0 and 7 represent Sunday. We do not.

 * Seconds: 0-59
 * Minutes: 0-59
 * Hours: 0-23
 * Day of Month: 1-31
 * Months: 0-11
 * Day of Week: 0-6
