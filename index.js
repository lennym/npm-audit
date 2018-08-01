const { exec } = require('child_process');

const levels = ['low', 'moderate', 'high', 'critical'];

module.exports = options => {

  const baseLevel = options.level || 'high';

  if (levels.indexOf(baseLevel) === -1) {
    console.error(`Invalid argument --level: ${baseLevel}`);
    console.error(` --level should be one of ${levels.join(', ')}`);
  }

  console.log(`Scanning for vulnerabilities...`);
  exec('npm audit --json', (err, stdout, stderr) => {
    const response = JSON.parse(stdout);
    const vulns = response.metadata.vulnerabilities;
    const failed = levels.reduce((count, level, i) => {
      console.log(`${level}: ${' '.repeat(10 - level.length)}${vulns[level]}`);
      if (i >= levels.indexOf(baseLevel)) {
        return count + vulns[level]);
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
