# CI/CD Pipeline Documentation

This document describes the CI/CD pipeline setup for BookVerse mobile app.

## Pipeline Overview

The pipeline consists of the following stages:

1. **Validate**
   - Code formatting check
   - Linting
   - Unit tests
   - Code coverage reporting

2. **Build Android**
   - Builds release APK
   - Signs APK with release keystore
   - Uploads artifact for deployment

3. **Build iOS**
   - Builds release IPA
   - Signs with provisioning profile
   - Uploads artifact for deployment

4. **E2E Tests**
   - Runs Detox E2E tests on iOS simulator
   - Uploads test artifacts

5. **Deploy**
   - Deploys Android app to Google Play Store (internal track)
   - Deploys iOS app to TestFlight
   - Handles versioning and release notes

6. **Notify**
   - Sends Slack notifications
   - Sends email notifications on failure

## Required Secrets

### Android Secrets
- `ANDROID_KEYSTORE_PATH`: Path to release keystore
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
- `ANDROID_KEYSTORE_ALIAS`: Keystore alias
- `ANDROID_KEYSTORE_ALIAS_PASSWORD`: Alias password
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: Google Play Console service account JSON

### iOS Secrets
- `APPLE_TEAM_ID`: Apple Developer Team ID
- `APPLE_PROVISION_PROFILE`: iOS provisioning profile
- `APPSTORE_API_KEY_ID`: App Store Connect API Key ID
- `APPSTORE_API_ISSUER_ID`: App Store Connect API Issuer ID
- `APPSTORE_API_PRIVATE_KEY`: App Store Connect API Private Key

### Notification Secrets
- `SLACK_WEBHOOK_URL`: Slack webhook URL for notifications
- `EMAIL_USERNAME`: Gmail username for email notifications
- `EMAIL_PASSWORD`: Gmail app password
- `NOTIFICATION_EMAIL`: Email address to receive notifications
- `CODECOV_TOKEN`: Codecov.io token for coverage reports

## Setting Up Secrets

1. Go to your GitHub repository settings
2. Navigate to Secrets and Variables > Actions
3. Click "New repository secret"
4. Add each required secret with its corresponding value

## Local Development

To test the pipeline locally:

1. Install Act (https://github.com/nektos/act)
2. Create `.env` file with required secrets
3. Run: `act -j validate` to test specific job
4. Run: `act push` to test entire pipeline

## Pipeline Triggers

The pipeline is triggered on:
- Push to main branch
- Pull request to main branch

Note: Deploy jobs only run on push to main branch.

## Adding New Jobs

To add a new job to the pipeline:

1. Create new job section in `main.yml`
2. Define required steps and dependencies
3. Add necessary secrets to GitHub
4. Update this documentation

## Troubleshooting

Common issues and solutions:

1. **Build Failures**
   - Check build logs for specific errors
   - Verify all secrets are properly set
   - Ensure correct signing configurations

2. **Deploy Failures**
   - Verify API keys and credentials
   - Check app version numbers
   - Review store listing requirements

3. **Test Failures**
   - Check Detox configuration
   - Review test artifacts
   - Verify simulator/emulator setup

## Best Practices

1. Always update version numbers before merging to main
2. Keep secrets secure and rotate regularly
3. Review and update dependencies
4. Monitor pipeline performance
5. Keep documentation updated

## Maintenance

Regular maintenance tasks:

1. Update dependencies monthly
2. Rotate secrets quarterly
3. Review and optimize pipeline performance
4. Clean up old artifacts
5. Update documentation as needed

## Contact

For pipeline issues or questions:
- Create GitHub issue
- Contact DevOps team
- Join #ci-cd Slack channel
