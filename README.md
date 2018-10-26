# npm-audit
Wrapper for npm audit to allow configurable vuln levels

## Usage

To run an `npm audit` with a default `high` threshold for vulnerabilities:

```
npx @lennym/ciaudit
```

To set a custom threshold:

```
npx @lennym/ciaudit --level moderate
```
