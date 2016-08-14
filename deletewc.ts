/// <reference path="typings/index.d.ts" />

import {Model} from "mendixmodelsdk";

import fs = require('fs');

console.log('Reading credentials from ./work/{username,apikey} ...');
const username = fs.readFileSync('./work/username').toString();
const apikey = fs.readFileSync('./work/apikey').toString();

console.log('Reading Online Working Copy ID from ./work/wcid ...');
const wcid = fs.readFileSync('./work/wcid').toString();

const client = Model.createSdkClient({
    credentials: {
        username: username,
        apikey: apikey
    }
});

console.log(`Deleting Online Working Copy: ${wcid} ...`);
client.deleteWorkingCopy(wcid,
    () => {
        console.log(`Successfully deleted Online Working Copy: ${wcid}`)
        fs.unlinkSync('./work/wcid');
    },
    handleError
);

function handleError(error) {
    console.log(`Something went wrong:`);
    console.dir(error);
}
