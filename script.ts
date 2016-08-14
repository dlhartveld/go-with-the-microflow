/// <reference path="typings/index.d.ts" />

import {Model, IModel} from 'mendixmodelsdk';

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

console.log(`Opening Online Working Copy: ${wcid} ...`);
client.openWorkingCopy(wcid,
    (model: IModel) => {
        console.log(`Successfully opened model in Online Working Copy: ${wcid}`);

        console.log(`Closing connection to model server ...`);
        model.closeConnection(
            () => {
                console.log(`Closed connection.`);
            },
            handleError
        )
    },
    handleError
);

function handleError(error) {
    console.log(`Something went wrong:`);
    console.dir(error);
}
