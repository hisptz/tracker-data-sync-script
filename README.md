# Tracker Data Sync Script

## Introduction

This script simplifies transferring of DHIS2 tracker data from one instance to another. It utilizes queuing to ensure
the download and upload processes are independent of each other.

## Requirements

To run this script you must have

- Node v18 or above

## Installation

To install the script run:

```bash
npm -g install @hisptz/dhis2-tracker-data-sync
```

or with yarn

```bash
 yarn global add @hisptz/dhis2-tracker-data-sync
```

## Setting up

To use the script you first need to setup the configuration. There are 2 ways to configure the script;

### Environment variables

You can have an `.env` file on the working directory (Directory in which you will run the script). Then environment file
should contain the following variables;

```dotenv
# Source DHIS2 connection
SOURCE_DHIS2_BASE_URL=""
SOURCE_DHIS2_USERNAME=""
SOURCE_DHIS2_PASSWORD=""

# Destination DHIS2 connection
DESTINATION_DHIS2_BASE_URL=""
DESTINATION_DHIS2_USERNAME=""
DESTINATION_DHIS2_PASSWORD=""

# How long should the script wait before timing out the download request
DOWNLOAD_TIMEOUT=10000
# How long should the script wait before timing out the upload request
UPLOAD_TIMEOUT=10000

# Program of the data you want to sync (It should be the same for source and destination)
PROGRAM_ID=""
# Parent organisation unit of all orgunits you want to sync (Shoud be the same for source and destination)
ORGANISATION_UNIT_ID=""

# Allow sending of notifications when the script is done
ENABLE_NOTIFICATIONS=
# Subject of the summary email
EMAIL_SUBJECT=
# Recipient of the emails (Should be a JSON serializable email)
EMAIL_RECIPIENTS=["example@org.com"]
# SendGrid key to use when sending email
SENDGRID_API_KEY=
# Email from which the summary should look like it originates from
EMAIL_FROM_EMAIL=
# Name of the sender 
EMAIL_FROM_NAME=
```

### JSON config file (Recommended)

You can also have a `config.json` file with the configuration. You will have to provide its absolute value when you're
running the script.

```json
{
  "source": {
    "username": "<username>",
    "password": "<password>",
    "baseURL": "http://baseurl"
  },
  "destination": {
    "username": "<username>",
    "password": "<password>",
    "baseURL": "http://baseurl"
  },
  "flowConfig": {
    "downloadTimeout": 10000,
    "uploadTimeout": 10000
  },
  "dataConfig": {
    "program": "<programID>",
    "organisationUnit": "<parent-org-unit-id>"
  },
  "notificationConfig": {
    "enabled": true,
    "emailSubject": "Data Sync Summary",
    "recipients": [
      "admin@example.com"
    ],
    "sendGridKey": "SG.VXXXXXXXX",
    "from": {
      "name": "Tracker Data Sync Script",
      "email": "admin@example.org"
    }
  }
}

```

## Running

To run the script, run;

```Bash
tracker-data-sync sync 
```

If you are using a JSON config file then run;

```Bash
tracker-data-sync sync --config /absolute/path/of/json/config
```

You can also run;

```Bash
tracker-data-sync sync --help
```

For a list of further configurations. 

