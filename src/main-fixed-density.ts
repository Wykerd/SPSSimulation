import CanvasKitInit, { CanvasKitInitOptions } from "canvaskit-wasm";
import { simulate } from "./simulation.js";
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

const totalRuns = 60;
const minNodes = 2;
const maxNodes = 30;

const density = 0.000009375;

async function main() {
    const options: CanvasKitInitOptions = {
        locateFile: (file) => `./node_modules/canvaskit-wasm/bin/${file}`
    };

    // @ts-ignore
    const canvasKit: CanvasKit = await CanvasKitInit(options);

    const resultsBasePath = './simulation';

    const resultsAll: Record<number, Array<Awaited<ReturnType<typeof simulate>> & { width: number }>> = JSON.parse(await fs.readFile(path.resolve(resultsBasePath, 'results.json'), 'utf-8'));

    for (let run = resultsAll[2].length; run < totalRuns; run++) {
        console.log(`Starting run ${run + 1} of ${totalRuns}`);
        for (let n = minNodes; n <= maxNodes; n++) {
            const basePath = path.resolve(resultsBasePath, n + '-nodes', nanoid());
            await fs.mkdir(basePath, { recursive: true });
            const width = Math.sqrt(n / density);
            const results = await simulate(n, canvasKit, basePath, width);
            resultsAll[n] = resultsAll[n] ?? [];
            resultsAll[n].push({...results, width });
            console.log(`Run #${run + 1} with ${n} nodes @ ${width.toFixed(2)} density: SPS=${results.net.sps.avgTotal.toFixed(2)} bytes, Direct=${results.net.direct.avgTotal.toFixed(2)} bytes; SPS=${results.messages.sps.toFixed(2)} messages, Direct=${results.messages.direct.toFixed(2)} messages`);
        }
        await fs.writeFile(path.resolve(resultsBasePath, 'results.json'), JSON.stringify(resultsAll, null, 2));
    }
}

main();