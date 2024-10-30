import CanvasKitInit, { CanvasKit, CanvasKitInitOptions } from "canvaskit-wasm";
import { SPSSimulation } from "./spatial/sps.js";
import { MapViewport, renderMapElement, renderSPSSimulationEnvironment, renderSPSSimulationEnvironment2 } from "./map/map.js";
import fs from 'fs/promises';
import path from 'path';

async function main() {
    const width = 800;
    const nodes = 30;
    const renderDistance = 10;

    const options: CanvasKitInitOptions = {
        locateFile: (file) => `./node_modules/canvaskit-wasm/bin/${file}`
    };

    // @ts-ignore
    const canvasKit: CanvasKit = await CanvasKitInit(options);

    const canvas = canvasKit.MakeCanvas(Math.ceil(width + 200), Math.ceil(width + 200));

    const ctx = canvas.getContext('2d')!;

    const sps = new SPSSimulation(nodes, [0, 0, width, width]);

    for (let i = 0; i < sps.nodes; i++) {
        const polygon = sps.getPolygonForNode(i);

        sps.subscribe({
            channel: 'overlay-sps',
            type: 'polygon',
            node: i,
            geometry: polygon
        })
    }

    const vp: MapViewport = {
        center: {
            x: width / 2,
            y: width / 2
        },
        physical: {
            width: width + 200,
            height: width + 200
        },
        scale: 1
    };

    renderSPSSimulationEnvironment2(ctx, vp, sps);
    renderMapElement(ctx, {
        elementType: 'region',
        region: {
            isPolygon: false,
            center: { x: width / 2, y: width / 2 },
            radius: 16 * renderDistance
        },
        regionType: 'publication'
    }, vp, false);

    const dataUrl = canvas.toDataURL();

    await fs.writeFile(path.resolve('environment.png'), dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
}

main();