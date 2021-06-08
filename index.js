const { spawn } = require('child_process');

const levels = ['low', 'moderate', 'high', 'critical'];

const audit = options => {

  options.retryCount = options.retryCount || 1;
  options.retries = options.retries || 1;
  options.wait = options.wait || 1000;

  const baseLevel = options.level || 'high';

  if (levels.indexOf(baseLevel) === -1) {
    console.error(`Invalid argument --level: ${baseLevel}`);
    console.error(` --level should be one of ${levels.join(', ')}`);
  }

  const restart = e => {
    if (options.retries === 1) {
      throw e;
    }
    if (options.retryCount < options.retries) {
      console.log(`Retrying... attempt ${options.retryCount + 1} of ${options.retries}`);
      return setTimeout(() => audit({
        ...options,
        retryCount: options.retryCount + 1
      }), options.wait);
    }
    throw new Error('Retry count exceeded. Exiting...');
  };

  const exec = () => {
    const result = new Promise((resolve, reject) => {
      let response = '';
      const opts = ['audit', '--json'];

      if (options.production) {
        opts.push('--production');
      }

      const proc = spawn('npm', opts);

      proc.stdout.on('data', chunk => {
        response += chunk;
      });

      proc.on('error', reject);
      proc.on('close', () => resolve(response));
    });

    return result
      .then(response => {
        try {
          return JSON.parse(response);
        } catch (e) {
          return restart(e);
        }
      });
  };

  const parse = json => {

    if (json.error && json.error.code === 'ENOAUDIT') {
      console.log('Received ENOAUDIT error.');
      return restart();
    }

    const vulns = json.metadata.vulnerabilities;
    const failed = levels.reduce((count, level, i) => {
      console.log(`${level}: ${' '.repeat(10 - level.length)}${vulns[level]}`);
      if (i >= levels.indexOf(baseLevel)) {
        return count + vulns[level];
      }
      return count;
    }, 0);
    console.log();
    if (failed) {
      console.error(`${failed} vulnerabilitie(s) of level "${baseLevel}" or above detected.`);
      process.exit(1);
    }

  };

  console.log(`Scanning for vulnerabilities...`);

  return Promise.resolve()
    .then(() => exec())
    .then(json => parse(json))
    .then(() => console.log(`No vulnerabilities of level "${baseLevel}" or above detected.`))
    .catch(e => {
      console.error(e.message);
      process.exit(1);
    });

};

module.exports = audit;
