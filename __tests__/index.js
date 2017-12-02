'use strict';


/*********************************************************************************
 1. Dependencies
 *********************************************************************************/

const CronPlugin = require('../lib');
const Hapi = require('hapi');
const Hoek = require('hoek');


/*********************************************************************************
 2. Exports
 *********************************************************************************/

describe('registration assertions', () => {

    it('should register plugin without errors', () => {

        const server = new Hapi.Server();

        server.register({
            register: CronPlugin,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                }
            }
        }, (err) => {

            expect(err).toBeUndefined();
        });
    });

    it('should throw error when a job is defined with an existing name', () => {

        const server = new Hapi.Server();

        expect(() => {

            server.register({
                register: CronPlugin,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testname',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }, {
                        name: 'testname',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            }, Hoek.ignore);
        }).toThrowError('Job name has already been defined');
    });

    it('should throw error when a job is defined without a name', () => {

        const server = new Hapi.Server();

        expect(() => {

            server.register({
                register: CronPlugin,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            }, Hoek.ignore);
        }).toThrowError('Missing job name');
    });

    it('should throw error when a job is defined without a time', () => {

        const server = new Hapi.Server();

        expect(() => {

            server.register({
                register: CronPlugin,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            }, Hoek.ignore);
        }).toThrowError('Missing job time');
    });

    it('should throw error when a job is defined with an invalid time', () => {

        const server = new Hapi.Server();

        expect(() => {

            server.register({
                register: CronPlugin,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: 'invalid cron',
                        timezone: 'Europe/London',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            }, Hoek.ignore);
        }).toThrowError('Time is not a cron expression');
    });

    it('should throw error when a job is defined with an invalid timezone', () => {

        const server = new Hapi.Server();

        expect(() => {

            server.register({
                register: CronPlugin,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'invalid',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            }, Hoek.ignore);
        }).toThrowError('Invalid timezone. See https://momentjs.com/timezone for valid timezones');
    });

    it('should throw error when a job is defined without a timezone', () => {

        const server = new Hapi.Server();

        expect(() => {

            server.register({
                register: CronPlugin,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        request: {
                            url: '/test-url'
                        }
                    }]
                }
            }, Hoek.ignore);
        }).toThrowError('Missing job time zone');
    });

    it('should throw error when a job is defined without a request object', () => {

        const server = new Hapi.Server();

        expect(() => {

            server.register({
                register: CronPlugin,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London'
                    }]
                }
            }, Hoek.ignore);
        }).toThrowError('Missing job request options');
    });

    it('should throw error when a job is defined without a request object', () => {

        const server = new Hapi.Server();

        expect(() => {

            server.register({
                register: CronPlugin,
                options: {
                    lock: {
                        url: 'mongodb://localhost/test',
                        key: 'lockTest',
                        ttl: 5000,
                        retry: 1000
                    },
                    jobs: [{
                        name: 'testcron',
                        time: '*/10 * * * * *',
                        timezone: 'Europe/London',
                        request: {
                            method: 'GET'
                        }
                    }]
                }
            }, Hoek.ignore);
        }).toThrowError('Missing job request url');
    });
});

describe('plugin functionality', () => {

    it('should expose access to registered cron jobs vie server.plugins', () => {

        const server = new Hapi.Server();

        server.register({
            register: CronPlugin,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        }, (err) => {

            expect(err).toBeUndefined();
            expect(server.plugins['hapi-cron-cluster']).toBeDefined();
            expect(server.plugins['hapi-cron-cluster'].jobs.testcron).toBeDefined();
        });
    });

    it('should ensure server.inject is called with the plugin options', (done) => {

        const callback = jest.fn();
        const server = new Hapi.Server();

        server.connection();

        server.register({
            register: CronPlugin,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/3 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    },
                    callback
                }]
            }
        }, (err) => {

            expect(err).toBeUndefined();

            server.connections[0].inject = jest.fn();

            expect(server.connections[0].inject).not.toHaveBeenCalled();

            server.start((err) => {

                expect(err).toBeUndefined();
                const p = new Promise((resolve, reject) => {

                    setTimeout(() => {

                        resolve();
                    }, 4000);
                });
                p.then(() => {

                    expect(server.connections[0].inject).toHaveBeenCalledWith({
                        method: 'GET',
                        url: '/test-url'
                    }, callback);
                    server.stop();
                    done();
                });

            });
        });
    });


    it('should ensure server.inject is called with the plugin options REDIS engine', (done) => {

        const callback = jest.fn();
        const server = new Hapi.Server();

        server.connection();

        server.register({
            register: CronPlugin,
            options: {
                lock: {
                    url: 'redis://localhost:6379',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/3 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    },
                    callback
                }]
            }
        }, (err) => {

            expect(err).toBeUndefined();

            server.connections[0].inject = jest.fn();

            expect(server.connections[0].inject).not.toHaveBeenCalled();

            server.start((err) => {

                expect(err).toBeUndefined();
                const p = new Promise((resolve, reject) => {

                    setTimeout(() => {

                        resolve();
                    }, 4000);
                });
                p.then(() => {

                    expect(server.connections[0].inject).toHaveBeenCalledWith({
                        method: 'GET',
                        url: '/test-url'
                    }, callback);
                    server.stop();
                    done();
                });

            });
        });
    });

    it('should not start the jobs until the server starts', (done) => {

        const server = new Hapi.Server();

        server.connection();

        server.register({
            register: CronPlugin,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        }, (err) => {

            expect(err).toBeUndefined();

            expect(server.plugins['hapi-cron-cluster'].jobs.testcron.running).toBeUndefined();

            server.start((err) => {

                expect(err).toBeUndefined();

                expect(server.plugins['hapi-cron-cluster'].jobs.testcron.running).toBe(true);

                server.stop();

                done();
            });
        });
    });

    it('should stop cron jobs when the server stops', (done) => {

        const server = new Hapi.Server();

        server.connection();

        server.register({
            register: CronPlugin,
            options: {
                lock: {
                    url: 'mongodb://localhost/test',
                    key: 'lockTest',
                    ttl: 5000,
                    retry: 1000
                },
                jobs: [{
                    name: 'testcron',
                    time: '*/10 * * * * *',
                    timezone: 'Europe/London',
                    request: {
                        method: 'GET',
                        url: '/test-url'
                    }
                }]
            }
        }, (err) => {

            expect(err).toBeUndefined();

            server.start((err) => {

                expect(err).toBeUndefined();

                expect(server.plugins['hapi-cron-cluster'].jobs.testcron.running).toBe(true);

                server.stop();

                expect(server.plugins['hapi-cron-cluster'].jobs.testcron.running).toBe(false);

                done();
            });
        });
    });
});
