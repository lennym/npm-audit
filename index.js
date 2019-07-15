const { exec } = require('child_process');

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

  const restart = () => {
    if (options.retryCount < options.retries) {
      console.log(`Retrying... attempt ${options.retryCount + 1} of ${options.retries}`);
      setTimeout(() => audit({
        ...options,
        retryCount: options.retryCount + 1
      }), options.wait);
    }
    console.log('Retry count exceeded. Exiting...');
    process.exit(1);
  };

  console.log(`Scanning for vulnerabilities...`);
  exec('npm audit --json', (err, stdout, stderr) => {
    let response;
    try {
      response = JSON.parse(stdout);
    } catch (e) {
      console.log('Could not parse JSON output.');
      return restart();
    }

    if (response.error && response.error.code === 'ENOAUDIT') {
      console.log('Received ENOAUDIT error.');
      return restart();
    }

    const vulns = response.metadata.vulnerabilities;
    const failed = levels.reduce((count, level, i) => {
      console.log(`${level}: ${' '.repeat(10 - level.length)}${vulns[level]}`);
      if (i >= levels.indexOf(baseLevel)) {
        return count + vulns[level];
      }
      return count;
    }, 0);
    console.log();
    if (failed) {
      console.log(`${failed} vulnerabilitie(s) of level "${baseLevel}" or above detected.`);
      process.exit(1);
    }
    console.log(`No vulnerabilities of level "${baseLevel}" or above detected.`);
  });

};

module.exports = audit;
