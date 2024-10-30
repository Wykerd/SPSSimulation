// @ts-nocheck
import {
  Type as Vec2d,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./Vec2d.js";
import {
  jsonValueToTsValueFns,
} from "../runtime/json/scalar.js";
import {
  WireMessage,
  WireType,
} from "../runtime/wire/index.js";
import {
  default as serialize,
} from "../runtime/wire/serialize.js";
import {
  default as deserialize,
} from "../runtime/wire/deserialize.js";

export declare namespace $ {
  export type PolygonRegion = {
    points: Vec2d[];
  }
}

export type Type = $.PolygonRegion;

export function getDefaultValue(): $.PolygonRegion {
  return {
    points: [],
  };
}

export function createValue(partialValue: Partial<$.PolygonRegion>): $.PolygonRegion {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.PolygonRegion): unknown {
  const result: any = {};
  result.points = value.points.map(value => encodeJson_1(value));
  return result;
}

export function decodeJson(value: any): $.PolygonRegion {
  const result = getDefaultValue();
  result.points = value.points?.map((value: any) => decodeJson_1(value)) ?? [];
  return result;
}

export function encodeBinary(value: $.PolygonRegion): Uint8Array {
  const result: WireMessage = [];
  for (const tsValue of value.points) {
    result.push(
      [1, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.PolygonRegion {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  collection: {
    const wireValues = wireMessage.filter(([fieldNumber]) => fieldNumber === 1).map(([, wireValue]) => wireValue);
    const value = wireValues.map((wireValue) => wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined).filter(x => x !== undefined);
    if (!value.length) break collection;
    result.points = value as any;
  }
  return result;
}
