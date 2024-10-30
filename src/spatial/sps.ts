import { Delaunay, Voronoi } from 'd3-delaunay'
import SAT from 'sat'
import { Type as VASTClientMessage, encodeBinary as encodeClientMessage } from '../proto/generated/messages/VASTClientMessage.js';
import { Type as VASTServerMessage, encodeBinary as encodeServerMessage } from '../proto/generated/messages/VASTServerMessage.js';

const websocketOverhead = 6;

const { 
    Polygon, Vector
} = SAT;

export type Region = {
    type: 'polygon',
    geometry: SAT.Polygon
} | {
    type: 'circle',
    geometry: SAT.Circle
};

type Subscription = {
    node: number,
    channel: string
} & Region;

interface NetworkingResult {
    client: number,
    in: number,
    out: number,
}

export interface PublicationSimulationResult {
    sender: number,
    channel: string,
    networkTraffic: NetworkingResult[],
    totalTraffic: {
        in: number,
        out: number
    },
    messagesDispatched: number,
}

function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function doesOverlap(a: Region, b: Region): boolean {
    if (a.type === 'circle' && b.type === 'circle') {
        return SAT.testCircleCircle(a.geometry, b.geometry);
    }

    if (a.type === 'circle' && b.type === 'polygon') {
        return SAT.testPolygonCircle(b.geometry, a.geometry);
    }

    if (a.type === 'polygon' && b.type === 'circle') {
        return SAT.testCirclePolygon(b.geometry, a.geometry);
    }

    if (a.type === 'polygon' && b.type === 'polygon') {
        return SAT.testPolygonPolygon(a.geometry, b.geometry);
    }

    return false;
}

function createOutboundPacket(payload: Uint8Array, channel: string, region: Region) {
    const message: VASTServerMessage = {
        message: {
            field: 'publication',
            value: {
                aoi: region.type === 'circle' ? { 
                    field: 'circular',
                    value: {
                        radius: region.geometry.r,
                        center: {
                            x: region.geometry.pos.x + 1e6,
                            y: region.geometry.pos.y + 1e6
                        }
                    }
                } : {
                    field: 'polygon',
                    value: {
                        points: region.geometry.points.map(p => ({
                            x: p.x,
                            y: p.y
                        }))
                    }
                },
                channel,
                payload
            }
        }
    }

    return encodeServerMessage(message);
}

function createInboundPacket(payload: Uint8Array, channel?: string, region?: Region) {
    const message: VASTClientMessage = {
        message: {
            field: 'publish',
            value: {
                aoi: region ? region.type === 'circle' ? { 
                    field: 'circular',
                    value: {
                        radius: region.geometry.r,
                        center: {
                            x: region.geometry.pos.x + 1e6,
                            y: region.geometry.pos.y + 1e6
                        }
                    }
                } : {
                    field: 'polygon',
                    value: {
                        points: region.geometry.points.map(p => ({
                            x: p.x,
                            y: p.y
                        }))
                    }
                } : undefined,
                channel,
                payload
            }
        }
    }

    return encodeClientMessage(message);
}

export class SPSSimulation {
    private voronoi: Voronoi<Delaunay.Point>;
    private subscriptions: Subscription[] = [];
    private elements: Delaunay.Point[];

    constructor(public readonly nodes: number, bounds: [number, number, number, number]) {
        const [xmin, ymin, xmax, ymax] = bounds;
        this.elements = Array.from({ length: nodes }, () => [randomBetween(xmin, xmax), randomBetween(ymin, ymax)] satisfies Delaunay.Point);

        const delaunay = Delaunay.from(this.elements);

        this.voronoi = delaunay.voronoi([xmin, ymin, xmax, ymax]);
    }

    getNodeSite(node: number) {
        return this.elements[node];
    }

    getNodeSites() {
        return [...this.elements];
    }

    getNodeNeighbors(node: number) {
        return Array.from(this.voronoi.neighbors(node));
    }

    getPolygonForNode(node: number): SAT.Polygon {
        const poly = this.voronoi.cellPolygon(node);

        // drop the last point, as it is the same as the first, SAT does not expect a closed polygon
        poly.pop();

        return new Polygon(new Vector(0, 0), poly.map(([x, y]) => new Vector(x, y)));
    }

    getNodeForPoint(x: number, y: number): number {
        for (let i = 0; i < this.nodes; i++) {
            if (this.voronoi.contains(i, x, y)) {
                return i;
            }
        }

        return -1;
    }

    getSubscriptions() {
        return this.subscriptions;
    }

    subscribe(subscription: Subscription) {
        this.subscriptions.push(subscription);
    }

    publish(node: number, channel: string, region: Region, payload: Uint8Array): PublicationSimulationResult {
        const subscriptions = this.subscriptions.filter(sub => sub.node !== node && sub.channel === channel);

        const result: PublicationSimulationResult = {
            sender: node,
            channel,
            messagesDispatched: 0,
            networkTraffic: [],
            totalTraffic: {
                in: 0,
                out: 0
            }
        }

        const inboundPacket = createInboundPacket(payload);
        const outboundPacket = createOutboundPacket(payload, channel, region);

        result.networkTraffic.push({
            client: node,
            in: 0,
            out: outboundPacket.byteLength + websocketOverhead
        });

        for (const sub of subscriptions) {
            const willSend = doesOverlap(sub, region);

            if (!willSend) continue;

            result.networkTraffic.push({
                client: sub.node,
                in: inboundPacket.byteLength  + websocketOverhead,
                out: 0
            });

            result.messagesDispatched++;
        }

        result.totalTraffic.in = result.networkTraffic.reduce((acc, curr) => acc + curr.in, 0);
        result.totalTraffic.out = result.networkTraffic.reduce((acc, curr) => acc + curr.out, 0);

        return result;
    }
}
