import { Ajv } from "ajv";
import type { ErrorObject } from "ajv";

const ajv = new Ajv({ allErrors: true, strict: true });

export function compileSchema<T>(schema: object): (input: unknown) => T {
  const validate = ajv.compile<T>(schema);
  return (input: unknown) => {
    const ok = validate(input);
    if (!ok) {
      const details = (validate.errors ?? []).map((err: ErrorObject) => `${err.instancePath || "/"} ${err.message}`).join("; ");
      throw new Error(`Schema validation failed: ${details}`);
    }
    return input as T;
  };
}
