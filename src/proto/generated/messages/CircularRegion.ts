// @ts-nocheck
import {
  Type as Vec2d,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./Vec2d.js";
import {
  tsValueToJsonValueFns,
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
  tsValueToWireValueFns,
  wireValueToTsValueFns,
} from "../runtime/wire/scalar.js";
import {
  default as deserialize,
} from "../runtime/wire/deserialize.js";

export declare namespace $ {
  export type CircularRegion = {
    center?: Vec2d;
    radius: number;
  }
}

export type Type = $.CircularRegion;

export function getDefaultValue(): $.CircularRegion {
  return {
    center: undefined,
    radius: 0,
  };
}

export function createValue(partialValue: Partial<$.CircularRegion>): $.CircularRegion {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.CircularRegion): unknown {
  const result: any = {};
  if (value.center !== undefined) result.center = encodeJson_1(value.center);
  if (value.radius !== undefined) result.radius = tsValueToJsonValueFns.double(value.radius);
  return result;
}

export function decodeJson(value: any): $.CircularRegion {
  const result = getDefaultValue();
  if (value.center !== undefined) result.center = decodeJson_1(value.center);
  if (value.radius !== undefined) result.radius = jsonValueToTsValueFns.double(value.radius);
  return result;
}

export function encodeBinary(value: $.CircularRegion): Uint8Array {
  const result: WireMessage = [];
  if (value.center !== undefined) {
    const tsValue = value.center;
    result.push(
      [1, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
    );
  }
  if (value.radius !== undefined) {
    const tsValue = value.radius;
    result.push(
      [2, tsValueToWireValueFns.double(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.CircularRegion {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined;
    if (value === undefined) break field;
    result.center = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.double(wireValue);
    if (value === undefined) break field;
    result.radius = value;
  }
  return result;
}
