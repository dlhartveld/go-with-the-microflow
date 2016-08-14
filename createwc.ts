/// <reference path="typings/index.d.ts" />

import {Model} from "mendixmodelsdk";

import fs = require('fs');

//const templateFileName = 'mpks/CompanyExpenses-5.6.0.mpk';
const templateFileName = 'mpks/EmptyApp-6.7.1.mpk';
//const templateFileName = 'mpks/sprintr-r8849.mpk';

console.log('Reading credentials from ./work/{username,apikey} ...');
const username = fs.readFileSync('./work/username').toString();
const apikey = fs.readFileSync('./work/apikey').toString();

const client = Model.createSdkClient({
    credentials: {
        username: username,
        apikey: apikey
    }
});

console.log(`Uploading MPK to new online working copy: ${templateFileName} ...`);
client.createWorkingCopy(
    {
        name: templateFileName,
        template: templateFileName
    },
    model => {
        console.log(`Created online working copy: ${model.id}`);
        fs.writeFileSync('./work/wcid', model.id);

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
