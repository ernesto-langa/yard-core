/**
 * session-context-loader.js
 * Compatibility layer for SessionContextLoader utility.
 *
 * Re-exports SessionContextLoader from its canonical location in
 * core/session/context-loader.js for backward compatibility with
 * existing code that imports from the deprecated location.
 *
 * @deprecated Import directly from `.yard-core/core/session/context-loader.js`
 */

const SessionContextLoader = require('../core/session/context-loader');

// CLI support when executed directly
if (require.main === module) {
  const [,, command, agentId = 'dev'] = process.argv;

  const loader = new SessionContextLoader();

  switch (command) {
    case 'load': {
      const context = loader.load(agentId);
      console.log(JSON.stringify(context, null, 2));
      break;
    }
    case 'clear': {
      loader.clear(agentId);
      console.log(`Session data cleared for agent: ${agentId}`);
      break;
    }
    case 'update': {
      const [,,, , agentName, lastCommand] = process.argv;
      loader.update(agentId, { agentName, lastCommand });
      console.log(`Session updated for agent: ${agentId}`);
      break;
    }
    default: {
      const context = loader.load(agentId);
      const greeting = loader.formatGreeting(context);
      console.log(greeting);
      break;
    }
  }
}

module.exports = SessionContextLoader;
