# Microflow call graph generator

Generate images of microflow call graphs. 

## How to use

Create `./work/username` with on a single line the username of your Mendix Account, e.g. `richard.ford@example.com`.
Create `./work/apikey` with on a single line a valid API key for your Mendix Account.

In `createwc.ts`, you can choose the MPK to analyze. Update it, compile and run it to create the online working copy:

    npm run build
    npm run create-wc

You can find the ID of the Online Working Copy in `./work/wcid`. 

Then, run the analysis script either with or without argument to analyze all or only a specific microflow:

    npm run analysis [microflow name]

This will generate `./work/mfs.gv` file with graph definitions in the dot language.
Generate an image from it:

    npm run dot

The resulting image is stored at `./work/mfs.png`.
