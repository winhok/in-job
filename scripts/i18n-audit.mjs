import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const webRoot = join(root, "apps/web");
const localeDir = join(webRoot, "i18n/locales");
const appRoot = join(webRoot, "app");
const ignoredVueFiles = new Set(["pages/test-speech-optimizer.vue"]);

const flatten = (value, prefix = "", output = new Map()) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${prefix}.${index}`, output));
    return output;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, output);
    }
    return output;
  }
  output.set(prefix, value);
  return output;
};

const loadMessages = async (name) => {
  const module = await import(
    `${pathToFileURL(join(localeDir, name)).href}?audit=${Date.now()}`
  );
  return flatten(module.default);
};

const [zh, en] = await Promise.all([
  loadMessages("zh-CN.ts"),
  loadMessages("en-US.ts"),
]);
const missingInEnglish = [...zh.keys()].filter((key) => !en.has(key));
const missingInChinese = [...en.keys()].filter((key) => !zh.has(key));
const untranslatedEnglish = [...en.entries()]
  .filter(
    ([key, value]) =>
      key !== "language.zh" &&
      typeof value === "string" &&
      /[\u4e00-\u9fff]/.test(value),
  )
  .map(([key]) => key);

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else files.push(path);
  }
  return files;
};

const hardcodedTemplates = [];
for (const file of await listFiles(appRoot)) {
  if (extname(file) !== ".vue") continue;
  const relativePath = relative(appRoot, file);
  if (ignoredVueFiles.has(relativePath)) continue;
  const source = await readFile(file, "utf8");
  const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1] || "";
  const visibleTemplate = template.replace(/<!--[\s\S]*?-->/g, "");
  const matches = visibleTemplate.match(/[\u4e00-\u9fff]+/g);
  if (matches?.length)
    hardcodedTemplates.push(
      `${relativePath}: ${[...new Set(matches)].join(", ")}`,
    );
}

const problems = [
  ...missingInEnglish.map((key) => `missing en-US key: ${key}`),
  ...missingInChinese.map((key) => `missing zh-CN key: ${key}`),
  ...untranslatedEnglish.map((key) => `Chinese text remains in en-US: ${key}`),
  ...hardcodedTemplates.map((message) => `hardcoded template text: ${message}`),
];

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log(
  `i18n audit passed: ${zh.size} synchronized message leaves; no production Vue template contains hardcoded Chinese text`,
);
