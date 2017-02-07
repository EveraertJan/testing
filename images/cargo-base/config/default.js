'use strict';

const config = {

  // -----------------------------------------------------------------------------------------------
  // wijzeStad configurations:

  wijzeStad: {
    hosts: {
      admin: `${process.env.FE_PROTOCOL}://${process.env.SOYL_HOST}`,
      api: `${process.env.FE_PROTOCOL}://api.${process.env.SOYL_HOST}`,
      rewards: `${process.env.FE_PROTOCOL}://reward.${process.env.SOYL_HOST}`,
      pg: `${process.env.FE_PROTOCOL}://pg.${process.env.SOYL_HOST}`
    },
    logStreamPort: 4019,
    logServicePanel: { // The log service panel configuration.
      logItemsList: { // The log items list configuration.
        maxItems: 50
      }
    },
    socketStreamPort: 4020
  },
  
  // -----------------------------------------------------------------------------------------------
  // Soyl configuration:

  soyl: {
    projectName: process.env.PROJECT_NAME,
    version: process.env.SOYL_VERSION,
    auth: {
      api: `${process.env.FE_PROTOCOL}://api.${process.env.SOYL_HOST}/auth`,
      host: 'soyl-auth',
      initialRootPassword: 'secret',
      jwtSecret: 'secret-string-xyz',
      jwtExpiresIn: 60 * 60 * 24,
      //secureServices: [],
      storeHost: 'soyl-auth-store',
      activities: [
        { id: 'duxis/manage_system', description: 'Manage the system set-up.' },
        { id: 'duxis/view_users', description: 'View system users.' },
        { id: 'duxis/manage_users', description: 'Create, edit and delete system users.' },
        { id: 'wijze_stad/view_logs', description: 'View ESM logs.' },
        { id: 'wijze_stad/manage_logs', description: 'Manage ESM logs.' },
        { id: 'wijze_stad/view_rewards', description: 'View rewards.' },
        { id: 'wijze_stad/view_own_rewards', description: 'View own won rewards.' },
        { id: 'wijze_stad/manage_rewards', description: 'Create, edit and delete rewards.' },
        { id: 'wijze_stad/view_rules', description: 'View ESM rules.' },
        { id: 'wijze_stad/manage_rules', description: 'Create, edit and delete ESM rules.' }
      ],
      defaultRoles: [
        {
          id: 'duxis/admin',
          activities: [
            'duxis/manage_system',
            'duxis/view_users',
            'duxis/manage_users'
          ]
        },
        {
          id: 'wijze_stad/admin',
          activities: [
            'duxis/manage_system',
            'duxis/view_users',
            'duxis/manage_users',
            'wijze_stad/view_logs',
            'wijze_stad/manage_logs',
          ]
        },
        {
          id: 'wijze_stad/client',
          activities: [
            'wijze_stad/view_logs',
          ]
        }
      ],
      devUsers: [
        {
          username: 'duxis',
          password: 'admin',
          roles: ['duxis/admin']
        },
        {
          username: 'admin',
          password: 'admin',
          roles: ['wijze_stad/admin', 'duxis/admin']
        },
        {
          username: 'guest',
          password: 'guest',
          roles: ['wijze_stad/client']
        },
        {
          username: 'client.dev',
          password: 'client',
          roles: ['wijze_stad/client']
        }
      ]
    },
    redis: {  // Redis stream broker configuration:
      host: 'soyl-broker'
    },
    traefik: {
      dashboardHost: `${process.env.FE_PROTOCOL}://${process.env.SOYL_HOST}:4080` //fixme
    }
  },


  // The data channels on the broker:
  channels: {
    logs: {
      incoming: 'wijzeStad.logService.reports'  // incoming log reports
    },
    system: {
      asmResponses: 'wijzeStad.logService.asmResponses'  // log ESM responses
    },
    answers: {
      incomming: 'wijzeStad.answerService.reports',
      outgoing: 'wijzeStad.answerService.answer'
    }
  },

  store: {
    base: {
      type: 'Postgres.basic', // The store type.
      database: process.env.POSTGRES_DB, // The name of the database.
      apiPort: 2424, // the internal api port of the PostgreSQL server
      user: process.env.POSTGRES_USER,
      pass: process.env.POSTGRES_PASSWORD,
      host: "wijze-stad-postgres", // the host name of the PostgreSQL server
      webPort: 5432 // the exposed web interface port of the PostgreSQL server
    },
    logs: {
      table: "log_events" // The class as which to store the log events.
    },
    users: {
      table: "users" // The class as which to store the log events.
    },
    questions: {
      table: "questions" // The class as which to store the log events.
    },
    answers: {
      table: "answers" // The class as which to store the log events.
    }
  },

  // -----------------------------------------------------------------------------------------------
  // Service configurations:

  asm: {
    report: {
      defaultPlatform: 'web',
      // The local route on which the service is served.
      localRoute: "/report.json",
      // The public route of the log report service.
      publicRoute: "/log/report.json"
    },
    store: {
      api: {
        port: 4006
      }
    }
  }

};

// -------------------------------------------------------------------------------------------------

/**
 * @property {boolean} True when the production environment is active.
 */
config.prodMode = process.env.NODE_ENV === 'production';

/**
 * @property {boolean} True when the test environment is active.
 */
config.testMode = process.env.NODE_ENV === 'test';

/**
 * @property {boolean} True when the staging environment is active.
 */
config.stageMode = process.env.NODE_ENV === 'staging';

/**
 * @property {boolean} True when the development environment is active.
 */
config.devMode = !config.prodMode && !config.testMode && !config.stageMode;

// -------------------------------------------------------------------------------------------------

module.exports = config;
