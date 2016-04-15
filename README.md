ProtonMail Web Client
=======

Official AngularJS web client for the [ProtonMail secure email service](https://protonmail.com). ProtonMail also makes use of [OpenPGPjs](https://github.com/openpgpjs/openpgpjs) as our message crytography is PGP compliant.

### Translations

To assist with the ProtonMail Translation Project, please visit our dedicated translation repository: [translations repository](https://github.com/ProtonMail/translations).

### Basic Installation

#### If you have node `0.12` installed locally

1. `sudo npm install` (requires nodejs)
2. `sudo npm start` to start the app locally at `localhost:8080`

#### If you have docker, and prefer to not install node (or anything else) locally

- `make start` to start the app on a container (use `make localurl` to find the url where it's running)
- `make test` to build the app (actual tests are still to come)

There is a very good chance you won't be able to use the app locally because of various security headers and such. But you should be able to get the code running enough to poke around and inspect it.

We are still in Beta and will have a more refined build process, installation instructions, unit tests, and all that good stuff once we exit Beta.

### Development

We are very open to bug reports via Issues as well as Pull Requests.

### End to end testing for AngularJS

Installation:

```
npm install -g protractor
webdriver-manager update
```

Start up a Selenium Server:

```
webdriver-manager start
```

Run tests:

```
protractor protractor_conf.js
```

Run a scenario:

```
protractor protractor_conf.js --suite=login
```

### License

Copyright (c) 2013-2016

Proton Technologies A.G. (Switzerland)

Email: contact@protonmail.ch

License: https://github.com/ProtonMail/WebClient/blob/master/license.md
