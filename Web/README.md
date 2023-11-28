# Loggedin WebApp

## Hosting

The react and associated static files are hosted in S3 in the `realityengines.ui` bucket. This is the origin for a CloudFront distribution that serves the `static.realityengines.ai` domain. CORS is set on the bucket and the CloudFront distribution is set up to honor this configuration.

When a user visits https://realityengines.ai/app, the request is routed down to the python app. Here, we perform a lookup on the `ui_releases` table in the database to get the latest react js path and using Jinja templating, inject the appropriate path into the HTML which is returned to the browser.

## Deployment

1. In a docker shell, `cd ~/code/react/Web` and run `./comp.sh`. This will build the production version of the app
2. In your browser of choice, navigate to the `realityengines.ui` bucket
    * https://s3.console.aws.amazon.com/s3/buckets/realityengines.ui/app/?region=us-west-1&tab=overview
3. Navigate to the `app` directory
4. Use the upload functionality in the console to upload the contents of `code/react/Web/public/app/*`
    * The folders of interest are `css`, `dist`, `icon`, `imgs`, `js`
5. Copy the value for `main` in `code/react/Web/public/app/dist/assets.json
6. Connect to the database and add a new entry to the `ui_releases` table. The `react_file` should be that which was copied earlier from assets.json
7. Changes should take effect within a few minutes due to light caching in the serving code

## Rollbacks

Change the values in the database in order to perform a rollback. The changes will take effect after the cache in the app service expires.