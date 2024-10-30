// @ts-nocheck
import {
  tsValueToJsonValueFns,
  jsonValueToTsValueFns,
} from "../runtime/json/scalar.js";
import {
  WireMessage,
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
  export type Vec2d = {
    x: number;
    y: number;
  }
}

export type Type = $.Vec2d;

export function getDefaultValue(): $.Vec2d {
  return {
    x: 0,
    y: 0,
  };
}

export function createValue(partialValue: Partial<$.Vec2d>): $.Vec2d {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.Vec2d): unknown {
  const result: any = {};
  if (value.x !== undefined) result.x = tsValueToJsonValueFns.double(value.x);
  if (value.y !== undefined) result.y = tsValueToJsonValueFns.double(value.y);
  return result;
}

export function decodeJson(value: any): $.Vec2d {
  const result = getDefaultValue();
  if (value.x !== undefined) result.x = jsonValueToTsValueFns.double(value.x);
  if (value.y !== undefined) result.y = jsonValueToTsValueFns.double(value.y);
  return result;
}

export function encodeBinary(value: $.Vec2d): Uint8Array {
  const result: WireMessage = [];
  if (value.x !== undefined) {
    const tsValue = value.x;
    result.push(
      [1, tsValueToWireValueFns.double(tsValue)],
    );
  }
  if (value.y !== undefined) {
    const tsValue = value.y;
    result.push(
      [2, tsValueToWireValueFns.double(tsValue)],
    );
  }
  return serialize(result);
}

export function decodeBinary(binary: Uint8Array): $.Vec2d {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  field: {
    const wireValue = wireFields.get(1);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.double(wireValue);
    if (value === undefined) break field;
    result.x = value;
  }
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.double(wireValue);
    if (value === undefined) break field;
    result.y = value;
  }
  return result;
}
