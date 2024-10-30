import CanvasKitInit, { CanvasKitInitOptions } from "canvaskit-wasm";
import { simulate } from "./simulation.js";
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

const totalRuns = 30;
const maxNeighbors = 30;

async function main() {
    const options: CanvasKitInitOptions = {
        locateFile: (file) => `./node_modules/canvaskit-wasm/bin/${file}`
    };

    // @ts-ignore
    const canvasKit: CanvasKit = await CanvasKitInit(options);

    const resultsBasePath = './simulation';

    const resultsAll: Record<number, Array<Awaited<ReturnType<typeof simulate>>>> = JSON.parse(await fs.readFile(path.resolve(resultsBasePath, 'results.json'), 'utf-8'));

    for (let run = resultsAll[2].length; run < totalRuns; run++) {
        console.log(`Starting run ${run + 1} of ${totalRuns}`);
        for (let n = 2; n <= maxNeighbors; n++) {
            const basePath = path.resolve(resultsBasePath, n + '-nodes', nanoid());
            await fs.mkdir(basePath, { recursive: true });
            const results = await simulate(n, canvasKit, basePath);
            resultsAll[n] = resultsAll[n] ?? [];
            resultsAll[n].push(results);
            console.log(`Run #${run + 1} with ${n} nodes: SPS=${results.net.sps.avgTotal.toFixed(2)} bytes, Direct=${results.net.direct.avgTotal.toFixed(2)} bytes; SPS=${results.messages.sps.toFixed(2)} messages, Direct=${results.messages.direct.toFixed(2)} messages`);
        }
        await fs.writeFile(path.resolve(resultsBasePath, 'results.json'), JSON.stringify(resultsAll, null, 2));
    }
}

main();