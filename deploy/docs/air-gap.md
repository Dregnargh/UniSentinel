# Air-gapped installs and upgrades

Every release ships an image tarball alongside the bundle:

| Artifact | Contents |
|---|---|
| `unisentinel-bundle-<version>.tar.gz` | Scripts, compose file, docs (this bundle). |
| `unisentinel-images-<version>.tar.gz` | `docker save` of the product image **and** `postgres:16` — no registry access needed on the host. |

## Install

On a machine with internet access, download both artifacts from the
release, transfer them to the air-gapped host, then:

```bash
tar xzf unisentinel-bundle-<version>.tar.gz
cd unisentinel-bundle-<version>
./install.sh --airgap /path/to/unisentinel-images-<version>.tar.gz
```

`install.sh --airgap` runs `docker load` instead of pulling; everything
else (secrets, health checks, next steps) is identical to an online
install.

## Upgrade

```bash
./upgrade.sh --airgap /path/to/unisentinel-images-<new-version>.tar.gz
```

The target version is read from the tarball's image tag; pass
`--version vX.Y.Z` to override. The pre-upgrade backup and rollback story
are the same as online upgrades (`upgrade.md`).

## Notes

- License files are applied through the UI as usual — licensing is fully
  offline (Ed25519 signature verified against `LICENSE_PUBLIC_KEY` in
  `.env`; the product never phones home).
- Keep at least the previous images tarball on the host until you have
  verified the upgrade — combined with the pre-upgrade backup it makes
  rollback possible without any network.
- Integrity: verify the artifact checksums from the release page
  (`sha256sum -c unisentinel-<version>.sha256`) after transfer.
