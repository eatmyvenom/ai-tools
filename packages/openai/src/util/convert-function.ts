import { join } from "node:path";
import { createGenerator } from "ts-json-schema-generator";

export async function getFunctions(file: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schema = createGenerator({
    tsconfig: "tsconfig.json",
    path: `src/${file}.ts`,
    encodeRefs: false,
    jsDoc: "extended",
  }).createSchema("*");

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const functionsModule = await import(
    join(
      process.env.PWD ?? "",
      process.env.OPEN_AI_FUNCTIONS_PATH ?? "functions",
      file + ".js",
    )
  );

  const functions = Object.entries(schema.definitions ?? {}).map(
    ([name, def]) => {
      const realname = name.slice(22, -1).trim();

      return {
        name: realname,
        description: functionsModule[`${realname}_description`]?.trim() ?? "",
        parameters: def,
        fn: functionsModule[realname],
      };
    },
  );

  return functions;
}
