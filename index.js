const { exec } = require('child_process');

const levels = ['low', 'moderate', 'high', 'critical'];

module.exports = options => {

  const baseLevel = levels.indexOf(options.level || 'high');

  console.log(`Scanning for vulnerabilities...`);
  exec('npm audit --json', (err, stdout, stderr) => {
    const response = JSON.parse(stdout);
    const vulns = response.metadata.vulnerabilities;
    const failed = levels.reduce((f, level, i) => {
      console.log(`${level}: ${' '.repeat(10 - level.length)}${vulns[level]}`);
      return f || (i >= baseLevel && vulns[level] > 0);
    }, false);

    if (failed) {
      process.exit(1);
    }
  });

};
