/// <reference path="typings/index.d.ts" />

import {Model, IModel, microflows} from 'mendixmodelsdk';

import * as fs from 'fs';
import * as when from 'when';

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

        console.log(`Preloading microflows ...`);
        when.all(model.allMicroflows().map(loadAsPromise))
            .then(_ => {
                const mfs = analyze(model);
                printRecursively(mfs, 0);
                generateDotFile(mfs);

                console.log(`Closing connection to model server ...`);
                model.closeConnection(
                    () => {
                        console.log(`Closed connection.`);
                    },
                    handleError
                )
            })
            .catch(handleError)
            .done(() => {
                console.log(`Done.`);
            });
    },
    handleError
);

function handleError(error) {
    console.log(`Something went wrong:`);
    console.dir(error);
}

/*
 * ANALYSIS
 */

interface MicroflowCall {
    name: string;
    calls: MicroflowCall[];
}

function analyze(model: IModel): MicroflowCall[] {
    console.log(`Starting analysis ...`);

    console.log(process.argv[2]);

    return model.allMicroflows()
        .filter(mf =>
            (process.argv[2])
                ? (mf.qualifiedName === process.argv[2])
                : true)
        .map(mf => mf.load())
        .map(mf => {
            console.log(`ANALYSIS: ${mf.qualifiedName}`);
            return recurseIntoMicroflow(mf);
        })
        .map(mfs => {
            return mfs[0];
        });
}

function recurseIntoMicroflow(mf: microflows.Microflow): MicroflowCall[] {
    console.log(`Recursing into microflow: ${mf.qualifiedName} ...`)
    const calls = mf.objectCollection.objects.map(recurseIntoMicroflowObject);

    let result: MicroflowCall[] = [];

    calls.forEach(mfs => {
        result = result.concat(mfs);
    });

    return [{
        name: mf.qualifiedName,
        calls: result
    }];
}

function recurseIntoMicroflowObject(o: microflows.MicroflowObject): MicroflowCall[] {
    //console.log(`Looking into object ...`);

    if (o instanceof microflows.LoopedActivity) {
        //console.log(`Actually, it's a loop ...`);
        return recurseIntoMicroflowLoop(o);
    } else if (o instanceof microflows.ActionActivity) {
        //console.log(`Actually, it's an activity ...`);
        const action = o.action;
        if (action instanceof microflows.MicroflowCallAction) {
            console.log(`It's a microflow call!`);
            const mf = action.model.allMicroflows().filter(mf => mf.qualifiedName === action.microflowCall.microflowQualifiedName)[0];
            return recurseIntoMicroflow(mf.load());
        } else {
            //console.log(`Uninteresting activity.`);
            return [];
        }
    } else {
        //console.log(`Nothing interesting here.`);
        return [];
    }
}

function recurseIntoMicroflowLoop(loop: microflows.LoopedActivity): MicroflowCall[] {
    //console.log(`Looping through loop ...`);

    const calls = loop.objectCollection.objects.map(recurseIntoMicroflowObject);

    let result: MicroflowCall[] = [];

    calls.forEach(mfs => {
        result = result.concat(mfs);
    });

    return result;
}

/*
 * PRINTING
 */

function printRecursively(mfs: MicroflowCall[], level: number) {
    mfs.forEach(mf => {
        if (level === 0) {
            console.log(`MICROFLOW: ${mf.name}`);
        } else {
            console.log(`${new Array(level + 1).join('   ')}++++> ${mf.name}`);
        }
        printRecursively(mf.calls, level + 1);
    });
}

/*
 * DOT FILE
 */

const dotfile = './work/mfs.gv';

function generateDotFile(mfs: MicroflowCall[]) {
    if (fs.existsSync(dotfile)) {
        fs.unlinkSync(dotfile)
    }

    fs.writeFileSync(dotfile, 'digraph Microflows {\n');

    mfs.forEach(mf => {
        generateDotFileRecursively(mf);
    });

    fs.appendFileSync(dotfile, '}\n');
}

function generateDotFileRecursively(mf: MicroflowCall) {
    mf.calls.forEach(call => {
        fs.appendFileSync(dotfile, `\t${mf.name.replace('.', '_')} -> ${call.name.replace('.', '_')};\n`);
    });

    mf.calls.forEach(call => {
        generateDotFileRecursively(call);
    });
}

/*
 * UTILITIES
 */

interface Loadable<T> {
    load(callback: (result: T) => void): void;
}

function loadAsPromise<T>(loadable: Loadable<T>): when.Promise<T> {
    return when.promise<T>((resolve, reject) => loadable.load(resolve));
}
