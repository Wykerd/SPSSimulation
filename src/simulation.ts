import CanvasKitInit, { CanvasKit, CanvasKitInitOptions } from "canvaskit-wasm";
import { PublicationSimulationResult, SPSSimulation } from "./spatial/sps.js";
import SAT from 'sat';
import { MapViewport, renderMapElement, renderSPSSimulationEnvironment } from "./map/map.js";
import fs from 'fs/promises';
import path from 'path';

const worldUUID = crypto.getRandomValues(new Uint8Array(16));

const startTime = Date.now() / 1000;

let sequence = 0, lastDeltaTime = 0;

const renderDistance = 10;

const nodeHandleLength = 43;

const directPacketSize = 36 + nodeHandleLength;

function blockBreakPayload(x: number, y: number) {
    const payload = new Uint8Array(32);

    const view = new DataView(payload.buffer);

    let cursor = 0;

    view.setUint8(cursor, 6);

    cursor += 1;

    const currentTime = Date.now() / 1000;

    const deltaTime = currentTime - startTime;

    if (lastDeltaTime != deltaTime) {
        sequence = 0;
        lastDeltaTime = deltaTime;
    }

    view.setUint16(cursor, deltaTime);

    cursor += 2;

    view.setUint8(cursor, sequence);

    cursor += 1;

    // write the world UUID
    for (let i = 0; i < 16; i++) {
        payload[cursor] = worldUUID[i];
        cursor++;
    }

    view.setUint32(cursor, x);

    cursor += 4;

    view.setUint32(cursor, 3);

    cursor += 4;

    view.setUint32(cursor, y);

    return payload;
}

function blockBreak(sps: SPSSimulation, x: number, y: number) {
    const node = sps.getNodeForPoint(x, y);

    if (node === -1)
        throw new Error('Out of bounds');

    return sps.publish(
        node,
        'overlay-sps',
        {
            type: 'circle',
            geometry: new SAT.Circle(new SAT.Vector(x, y), 16 * renderDistance)
        },
        blockBreakPayload(x, y)
    )
}

export async function simulate(nodes: number, canvasKit: CanvasKit, resultsBasePath: string, width = 800) {
    // const canvas = canvasKit.MakeCanvas(Math.ceil(width + 200), Math.ceil(width + 200));

    // const ctx = canvas.getContext('2d')!;

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

    // const vp: MapViewport = {
    //     center: {
    //         x: width / 2,
    //         y: width / 2
    //     },
    //     physical: {
    //         width: width + 200,
    //         height: width + 200
    //     },
    //     scale: 1
    // };

    // renderSPSSimulationEnvironment(ctx, vp, sps);
    // renderMapElement(ctx, {
    //     elementType: 'region',
    //     region: {
    //         isPolygon: false,
    //         center: { x: width / 2, y: width / 2 },
    //         radius: 16 * renderDistance
    //     },
    //     regionType: 'publication'
    // }, vp, false);

    // const dataUrl = canvas.toDataURL();

    // await fs.writeFile(path.resolve(resultsBasePath, 'environment.png'), dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

    const simulationResults: PublicationSimulationResult[] = [];

    const neighbors: Map<number, number[]> = new Map();

    for (let i = 0; i < sps.nodes; i++) {
        neighbors.set(i, sps.getNodeNeighbors(i));
    }

    await fs.writeFile(path.resolve(resultsBasePath, 'neighbors.json'), JSON.stringify(Array.from(neighbors.entries()), null, 2));
    await fs.writeFile(path.resolve(resultsBasePath, 'sites.json'), JSON.stringify(sps.getNodeSites(), null, 2));

    const started = Date.now();

    for (let x = 0; x <= 800; x++) {
        for (let y = 0; y <= 800; y++) {
            simulationResults.push(blockBreak(sps, x, y));
        }
    }

    console.log(`Completed simulation of ${nodes} nodes in ${((Date.now() - started) / 1000).toFixed(2)}s`);

    await fs.writeFile(path.resolve(resultsBasePath, 'simulation.json'), JSON.stringify(simulationResults));

    const averageNetworkOut = simulationResults.reduce((acc, result) => acc + result.totalTraffic.out, 0) / simulationResults.length;
    const averageNetworkIn = simulationResults.reduce((acc, result) => acc + result.totalTraffic.in, 0) / simulationResults.length;
    const averageNetworkTotal = simulationResults.reduce((acc, result) => acc + result.totalTraffic.in + result.totalTraffic.out, 0) / simulationResults.length;

    const averageDirectNetwork = simulationResults.reduce((acc, result) => {
        const n = neighbors.get(result.sender) ?? [];
        const count = n.length;

        return acc + (count * directPacketSize);
    }, 0) / simulationResults.length;

    const averageMessagesDispatched = simulationResults.reduce((acc, result) => acc + result.messagesDispatched, 0) / simulationResults.length;
    const averageDirectMessages = simulationResults.reduce((acc, result) => acc + (neighbors.get(result.sender)?.length ?? 0), 0) / simulationResults.length;

    const stats = {
        net: {
            sps: {
                avgIn: averageNetworkIn,
                avgOut: averageNetworkOut,
                avgTotal: averageNetworkTotal
            },
            direct: {
                avgIn: averageDirectNetwork,
                avgOut: averageDirectNetwork,
                avgTotal: averageDirectNetwork
            }
        },
        messages: {
            sps: averageMessagesDispatched,
            direct: averageDirectMessages
        }
    }

    await fs.writeFile(path.resolve(resultsBasePath, 'results.json'), JSON.stringify(stats, null, 2));

    return stats;
}
