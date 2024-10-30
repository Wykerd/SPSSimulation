// @ts-nocheck
import {
  Type as PubSubMessage,
  encodeJson as encodeJson_1,
  decodeJson as decodeJson_1,
  encodeBinary as encodeBinary_1,
  decodeBinary as decodeBinary_1,
} from "./PubSubMessage.js";
import {
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
  default as deserialize,
} from "../runtime/wire/deserialize.js";

export declare namespace $ {
  export type VASTClientMessage = {
    message?: (
      | { field: "publish", value: PubSubMessage }
  );
  }
}

export type Type = $.VASTClientMessage;

export function getDefaultValue(): $.VASTClientMessage {
  return {
    message: undefined,
  };
}

export function createValue(partialValue: Partial<$.VASTClientMessage>): $.VASTClientMessage {
  return {
    ...getDefaultValue(),
    ...partialValue,
  };
}

export function encodeJson(value: $.VASTClientMessage): unknown {
  const result: any = {};
  switch (value.message?.field) {
    case "publish": {
      result.publish = encodeJson_1(value.message.value);
      break;
    }
  }
  return result;
}

export function decodeJson(value: any): $.VASTClientMessage {
  const result = getDefaultValue();
  if (value.publish !== undefined) result.message = {field: "publish", value: decodeJson_1(value.publish)};
  return result;
}

export function encodeBinary(value: $.VASTClientMessage): Uint8Array {
  const result: WireMessage = [];
  switch (value.message?.field) {
    case "publish": {
      const tsValue = value.message.value;
      result.push(
        [1, { type: WireType.LengthDelimited as const, value: encodeBinary_1(tsValue) }],
      );
      break;
    }
  }
  return serialize(result);
}

const oneofFieldNumbersMap: { [oneof: string]: Set<number> } = {
  message: new Set([1]),
};

const oneofFieldNamesMap = {
  message: new Map([
    [1, "publish" as const],
  ]),
};

export function decodeBinary(binary: Uint8Array): $.VASTClientMessage {
  const result = getDefaultValue();
  const wireMessage = deserialize(binary);
  const wireFields = new Map(wireMessage);
  const wireFieldNumbers = Array.from(wireFields.keys()).reverse();
  oneof: {
    const oneofFieldNumbers = oneofFieldNumbersMap.message;
    const oneofFieldNames = oneofFieldNamesMap.message;
    const fieldNumber = wireFieldNumbers.find(v => oneofFieldNumbers.has(v));
    if (fieldNumber == null) break oneof;
    const wireValue = wireFields.get(fieldNumber);
    const wireValueToTsValueMap = {
      [1](wireValue: Field) { return wireValue.type === WireType.LengthDelimited ? decodeBinary_1(wireValue.value) : undefined; },
    };
    const value = (wireValueToTsValueMap[fieldNumber as keyof typeof wireValueToTsValueMap] as any)?.(wireValue!);
    if (value === undefined) break oneof;
    result.message = { field: oneofFieldNames.get(fieldNumber)!, value: value as any };
  }
  return result;
}
