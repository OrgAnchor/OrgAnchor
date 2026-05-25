# NPM Trusted Publishing

Status: Setup guide for publishing OrgAnchor through GitHub Actions OIDC instead of local npm login.

## Purpose

OrgAnchor should not depend on repeated local npm sessions or long-lived npm publish tokens.

The preferred path is npm Trusted Publishing:

```text
GitHub Actions workflow
short-lived OIDC identity
npm accepts that workflow as a trusted publisher
no stored npm publish token
no repeated local npm login for every release
```

This follows npm's official trusted publishing model. npm requires Node 22.14.0 or higher and npm CLI 11.5.1 or higher for trusted publishing, and the workflow must have `id-token: write`.

Reference:

```text
https://docs.npmjs.com/trusted-publishers/
```

## Repository Workflow

The workflow file is:

```text
.github/workflows/publish-npm.yml
```

It does:

- runs on `workflow_dispatch` for controlled manual release runs;
- runs on future pushed tags matching `v*`;
- checks that the expected version matches `package.json`;
- runs `npm ci`;
- runs `npm run release:check`;
- runs `npm pack --dry-run`;
- publishes with `npm publish --tag alpha`.

For the current `0.1.0-alpha.2` release, use manual dispatch because `v0.1.0-alpha.2` was created before the workflow existed.

## NPM Website Configuration

In the npm website, configure the package's trusted publisher:

```text
Package: organchor
Provider: GitHub Actions
Organization or user: OrgAnchor
Repository: OrgAnchor
Workflow filename: publish-npm.yml
Environment name: leave blank
Allowed action: npm publish
```

Important details:

- Enter only `publish-npm.yml`, not `.github/workflows/publish-npm.yml`.
- The fields are case-sensitive.
- The workflow must exist in `.github/workflows/` on GitHub before the npm configuration is saved.
- Use GitHub-hosted runners; npm trusted publishing does not support self-hosted runners for this path.

## Alpha.2 Publish Command

After npm Trusted Publishing is configured, trigger:

```bash
gh workflow run publish-npm.yml \
  --repo OrgAnchor/OrgAnchor \
  --ref main \
  -f expected_version=0.1.0-alpha.2 \
  -f publish_tag=alpha
```

Then watch:

```bash
gh run list --repo OrgAnchor/OrgAnchor --workflow publish-npm.yml --limit 5
```

## Post-Publish Verification

After the workflow succeeds:

```bash
npm view organchor version dist-tags --json
npm install -g organchor@alpha
organchor --help
organchor doctor https://organchor.org
```

## Security Policy

Preferred:

- Trusted Publishing with OIDC.
- No long-lived npm publish token.
- No npm token in GitHub Secrets.
- Keep package publishing under the `alpha` dist-tag until stable v1.

After Trusted Publishing works, package settings should prefer:

```text
Require two-factor authentication and disallow tokens
```

That restriction applies to traditional tokens, not trusted publishers.
