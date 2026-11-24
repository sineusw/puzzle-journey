"""Validate the real exported iOS archive before an App Store upload."""
import os
import plistlib
from datetime import datetime, timezone
from pathlib import Path

app = Path(os.environ['RELEASE_APP_PATH'])
profile_path = Path(os.environ['RELEASE_PROFILE_PATH'])
certificate_path = Path(os.environ['RELEASE_CERTIFICATE_PATH'])
with (app / 'Info.plist').open('rb') as f:
    info = plistlib.load(f)
with profile_path.open('rb') as f:
    profile = plistlib.load(f)
bundle = os.environ['BUNDLE_ID']
team = os.environ['TEAM_ID']
assert info['CFBundleIdentifier'] == bundle, 'Exported bundle identifier mismatch'
assert info['CFBundleShortVersionString'] == '1.0', 'Exported version mismatch'
assert info['CFBundleVersion'] == os.environ['GITHUB_RUN_ID'] + os.environ['GITHUB_RUN_ATTEMPT'], 'Build number mismatch'
assert team in profile['TeamIdentifier'], 'Provisioning team mismatch'
assert profile['Entitlements']['application-identifier'] == team + '.' + bundle, 'Profile application identifier mismatch'
assert not profile['Entitlements'].get('get-task-allow', False), 'Development entitlement in distribution export'
assert 'ProvisionedDevices' not in profile, 'Ad hoc/development provisioning profile in store export'
assert not profile.get('ProvisionsAllDevices', False), 'Enterprise profile in store export'
assert profile['ExpirationDate'].replace(tzinfo=timezone.utc) > datetime.now(timezone.utc), 'Expired provisioning profile'
assert certificate_path.read_bytes() in profile['DeveloperCertificates'], 'Signing certificate is not in the provisioning profile'
print('Verified exported bundle, version, build number, store profile, team, expiry, and signing certificate match.')
