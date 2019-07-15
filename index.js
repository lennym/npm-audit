const {spawnSync} = require('child_process');
const fs = require("fs");

const levels = ['low', 'moderate', 'high', 'critical'];

const tmpDir = "./tmpVul"

const reduceDevVulnerabilities = (level, count, auditResponse) => {
  const numberOfDevVulns = Object.values(auditResponse.advisories)
    .reduce((count, advisory) => {
      if (advisory.severity === level) {
        return count + advisory.findings[0].paths.length;
      }
    }, 0);
  return count - numberOfDevVulns;
};

module.exports = options => {
  const baseLevel = options.level || 'high';
  const prod = options.prod || false;
  if (levels.indexOf(baseLevel) === -1) {
    console.error(`Invalid argument --level: ${baseLevel}`);
    console.error(` --level should be one of ${levels.join(', ')}`);
  }
  console.log(`Scanning for vulnerabilities...`);
  try {
    !fs.existsSync(tmpDir) && fs.mkdirSync(tmpDir)
    let packageJson =  JSON.parse(fs.readFileSync(`./package.json`));
    packageJson.optionalDependencies = {};
    packageJson.devDependencies = {};
    fs.writeFileSync(`${tmpDir}/package.json`,JSON.stringify(packageJson));
    fs.copyFileSync('./package-lock.json', `${tmpDir}/package-lock.json`);
    const {status:npmInstallStatus,stderr:npmInstallErr} = spawnSync('npm', ['install',"--only=prod"],{cwd:tmpDir});
    if (npmInstallStatus) {
        console.error(npmInstallErr);
        process.exit(1);
    }
    const {stdout, stderr} = spawnSync('npm', ['audit', '--json'],{cwd:tmpDir});
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
      if (prod) {
        count = reduceDevVulnerabilities(level, count, response);
      }
      return count;
    }, 0);
    console.log();
    if (failed) {
      console.log(`${failed} vulnerabilitie(s) of level "${baseLevel}" or above detected.`);
      process.exit(1);
    }
    console.log(`No vulnerabilities of level "${baseLevel}" or above detected ` +
      `${prod ? '(filtered out dev dependencies)' : ''}.`);
  } catch (e) {
    console.error(e);
    process.exit(e.code || 1);
  }
};
