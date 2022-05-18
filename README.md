# Tracker Data Sync Script


## Introduction
A script to copy tracker data from one DHIS2 instance to another.


## Installation

To install the script download the latest release from [release page](https://github.com/hisptz/tracker-data-sync-script/releases)
Create an `.env` file with the contents of `.env.example` and fill in the required values


```dotenv
SOURCE_DHIS2_BASE_URL="" //The instance to copy data from 
SOURCE_DHIS2_USERNAME="" 
SOURCE_DHIS2_PASSWORD="" 

DESTINATION_DHIS2_BASE_URL="" //The instance to copy data to 
DESTINATION_DHIS2_USERNAME=""
DESTINATION_DHIS2_PASSWORD=""

DOWNLOAD_TIMEOUT=5000 //Data download timeout per each page
UPLOAD_TIMEOUT=5000 //Data upload timeout per each page

PROGRAM_ID="" //Targeted program id 
ORGANISATION_UNIT_ID="" //Targeted organisation unit id

```

## Usage

To run the script use the command: 

```bash
 node index.js sync
```

To get help for available sync flags use:

```bash
 node index.js sync -h
```

Available flags are as shown below: 

```

Usage: node index.js sync [options]

Options:
  -d --duration <duration>                          Duration of the extraction in days (default: "30")
  -p --page-size <page-size>                        Page size of the extraction (default: "50")
  -u --upload-concurrency <upload-concurrency>      Concurrency of the upload (default: "1")
  -d --download-concurrency <download-concurrency>  Concurrency of the download (default: "1")
  -h, --help                                        display help for command


```

