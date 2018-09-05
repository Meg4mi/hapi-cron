/*********************************************************************************
 1. Dependencies
 *********************************************************************************/

const Hoek = require('hoek');
const CronJob = require('cron').CronJob;
const PluginPackage = require('../package.json');
const DbClient = require('./dbclient');


/*********************************************************************************
 2. Internals
 *********************************************************************************/

const internals = {};

internals.trigger = (server, job, options) => {

    return async () => {

        try {
            const isLeader = await server.leader.isLeader();
            
            if(options.debug) {
                console.log([PluginPackage.name], 'IS LEADER ? : ' + isLeader);
                server.log([PluginPackage.name], 'IS LEADER ? : ' + isLeader);
            }
            
            if (isLeader) {

                if(options.debug)
                    server.log([PluginPackage.name], job.name);
                
                if(job.request)
                    await server.inject(job.request);
                else if (job.method)
                    await server.method(job.method);
                else
                    await job.handler()

                if (job.onComplete) {
                    await job.onComplete();
                }
            }
        }
        catch (err) {
            server.log(['error'], err);
        }
    };
};

internals.onPostStart = (server, jobs, options) => {

    return async () => {

        try {
            await DbClient.connect(server, options);

            for (const key of Object.keys(jobs)) {
                await jobs[key].start();
            }

        }
        catch (err) {
            server.log(['error'], err);
            throw err;
        }
    };
};

internals.onPreStop = (jobs) => {

    return async () => {

        for (const key of Object.keys(jobs)) {
            await jobs[key].stop();
        }
    };
};


/*********************************************************************************
 3. Exports
 *********************************************************************************/

const PluginRegistration = (server, options) => {

    Hoek.assert(options.lock, 'No lock object provided');
    Hoek.assert(options.lock.url, 'No lock url provided.');
    Hoek.assert(options.lock.url.startsWith('mongodb') || options.lock.url.startsWith('redis'), 'url should start with "mongodb" or "redis"');
    Hoek.assert(options.lock.key, 'No lock key provided.');
    Hoek.assert(options.lock.ttl, 'No lock ttl provided.');
    Hoek.assert(options.lock.retry, 'No lock retry time provided.');

    const jobs = {};

    if (!options.jobs || !options.jobs.length) {
        server.log([PluginPackage.name], 'No cron jobs provided.');
    }
    else {
        options.jobs.forEach((job) => {

            Hoek.assert(!jobs[job.name], 'Job name has already been defined');
            Hoek.assert(job.name, 'Missing job name');
            Hoek.assert(job.time, 'Missing job time');
            Hoek.assert(job.timezone, 'Missing job time zone');
            Hoek.assert(job.request || job.method || job.handler, 'Job needs one of request, method, or handler');
            if(job.request) {
                Hoek.assert(job.request.url, 'Missing job request url');
            } else if (job.handler) {
                Hoek.assert(typeof job.handler == 'function', 'Job handler must be a function')
            }

            try {
                jobs[job.name] = new CronJob(job.time, internals.trigger(server, job, options), null, false, job.timezone);
            }
            catch (err) {
                if (err.message === 'Invalid timezone.') {
                    Hoek.assert(!err, 'Invalid timezone. See https://momentjs.com/timezone for valid timezones');
                }
                else {
                    Hoek.assert(!err, 'Time is not a cron expression');
                }
            }
        });
    }

    server.expose('jobs', jobs);
    server.ext('onPostStart', internals.onPostStart(server, jobs, options));
    server.ext('onPreStop', internals.onPreStop(jobs));
};

exports.plugin = {
    register: PluginRegistration,
    pkg: PluginPackage
};
