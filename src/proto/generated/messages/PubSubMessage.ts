// @ts-nocheck
import {
  Type as CircularRegion,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./CircularRegion.js";
import {
  Type as PolygonRegion,
  encodeJson as encodeJson_2,
  decodeJson as decodeJson_2,
  encodeBinary as encodeBinary_2,
  decodeBinary as decodeBinary_2,
} from "./PolygonRegion.js";
import {
  tsValueToJsonValueFns,
  jsonValueToTsValueFns,
} from "../runtime/json/scalar.js";
import {
  WireMessage,
  WireType,
  Field,
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
  export type PubSubMessage = {
    payload: Uint8Array;
    channel?: string;
    aoi?: (
      | { field: "circular", value: CircularRegion }
      | { field: "polygon", value: PolygonRegion }
  );
  }
}

export type Type = $.PubSubMessage;

export function getDefaultValue(): $.PubSubMessage {
  return {
    payload: new Uint8Array(),
    channel: undefined,
    aoi: undefined,
  };
}

export function createValue(partialValue: Partial<$.PubSubMessage>): $.PubSubMessage {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.PubSubMessage): unknown {
  const result: any = {};
  if (value.payload !== undefined) result.payload = tsValueToJsonValueFns.bytes(value.payload);
  if (value.channel !== undefined) result.channel = tsValueToJsonValueFns.string(value.channel);
  switch (value.aoi?.field) {
    case "circular": {
      result.circular = encodeJson_1(value.aoi.value);
      break;
    }
    case "polygon": {
      result.polygon = encodeJson_2(value.aoi.value);
      break;
    }
  }
  return result;
}

export function decodeJson(value: any): $.PubSubMessage {
  const result = getDefaultValue();
  if (value.payload !== undefined) result.payload = jsonValueToTsValueFns.bytes(value.payload);
  if (value.channel !== undefined) result.channel = jsonValueToTsValueFns.string(value.channel);
  if (value.circular !== undefined) result.aoi = {field: "circular", value: decodeJson_1(value.circular)};
  if (value.polygon !== undefined) result.aoi = {field: "polygon", value: decodeJson_2(value.polygon)};
  return result;
}

export function encodeBinary(value: $.PubSubMessage): Uint8Array {
  const result: WireMessage = [];
  if (value.payload !== undefined) {
    const tsValue = value.payload;
    result.push(
      [2, tsValueToWireValueFns.bytes(tsValue)],
    );
  }
  if (value.channel !== undefined) {
    const tsValue = value.channel;
    result.push(
      [3, tsValueToWireValueFns.string(tsValue)],
    );
  }
  switch (value.aoi?.field) {
    case "circular": {
      const tsValue = value.aoi.value;
      result.push(
        [4, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
      );
      break;
    }
    case "polygon": {
      const tsValue = value.aoi.value;
      result.push(
        [5, { type: WireType.LengthDelimited as const, value: encodeBinary_2(tsValue) }],
      );
      break;
    }
  }
  return serialize(result);
}

const oneofFieldNumbersMap: { [oneof: string]: Set<number> } = {
  aoi: new Set([4, 5]),
};

const oneofFieldNamesMap = {
  aoi: new Map([
    [4, "circular" as const],
    [5, "polygon" as const],
  ]),
};

export function decodeBinary(binary: Uint8Array): $.PubSubMessage {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  const wireFieldNumbers = Array.from(wireFields.keys()).reverse();
  field: {
    const wireValue = wireFields.get(2);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.bytes(wireValue);
    if (value === undefined) break field;
    result.payload = value;
  }
  field: {
    const wireValue = wireFields.get(3);
    if (wireValue === undefined) break field;
    const value = wireValueToTsValueFns.string(wireValue);
    if (value === undefined) break field;
    result.channel = value;
  }
  oneof: {
    const oneofFieldNumbers = oneofFieldNumbersMap.aoi;
    const oneofFieldNames = oneofFieldNamesMap.aoi;
    const fieldNumber = wireFieldNumbers.find(v => oneofFieldNumbers.has(v));
    if (fieldNumber == null) break oneof;
    const wireValue = wireFields.get(fieldNumber);
    const wireValueToTsValueMap = {
      [4](wireValue: Field) { return wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined; },
      [5](wireValue: Field) { return wireValue.type === WireType.LengthDelimited ? decodeBinary_2(wireValue.value) : undefined; },
    };
    const value = (wireValueToTsValueMap[fieldNumber as keyof typeof wireValueToTsValueMap] as any)?.(wireValue!);
    if (value === undefined) break oneof;
    result.aoi = { field: oneofFieldNames.get(fieldNumber)!, value: value as any };
  }
  return result;
}
