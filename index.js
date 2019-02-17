const {spawnSync} = require('child_process');

const levels = ['low', 'moderate', 'high', 'critical'];

module.exports = options => {
  const baseLevel = options.level || 'high';

  if (levels.indexOf(baseLevel) === -1) {
    console.error(`Invalid argument --level: ${baseLevel}`);
    console.error(` --level should be one of ${levels.join(', ')}`);
  }

  console.log(`Scanning for vulnerabilities...`);
  try {
    const {stdout, stderr} = spawnSync('npm', ['audit', '--json']);
    if (stderr.toString() !== '') {
      console.error(stderr.toString());
      process.exit(1);
    }
    const response = JSON.parse(stdout.toString());
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
  } catch (e) {
    console.error(e);
    process.exit(e.code || 1);
  }
};
