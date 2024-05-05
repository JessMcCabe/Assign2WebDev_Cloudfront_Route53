Note, before deploying this app, you must create the file env.ts in the base folder and initialize it as follows:

~~~je
export const Region = 'eu-west-1';
export const Account = 'your account no.';
export const HostedZone = "your hosted zone id";  // If required
export const Domain = "your custom domain name";  // If required
~~~