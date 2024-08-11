#!/usr/bin/env node
const { default: inquirer } = require("inquirer");
const { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync } = require("fs");
const { resolve } = require("path");

const cwd = process.cwd();
const clientI18nInitializerExample = readFileSync(resolve(__dirname, "../res/client-i18n-initializer.example.ts")).toString();
const i18nInitializerExample = readFileSync(resolve(__dirname, "../res/i18n-initializer.example.tsx")).toString();
const i18nModuleLoaderExample = readFileSync(resolve(__dirname, "../res/i18n-module-loader.example.ts")).toString();
const lexiconExample = readFileSync(resolve(__dirname, "../res/lexicon.example.ts")).toString();
const loaderExample = readFileSync(resolve(__dirname, "../res/loader.example.ts")).toString();
let nextConfig;

async function main(){
  if(!await checkEnvironment()){
    process.exit(1);
  }
  const command = process.argv[2] || await inquirer.prompt([{
    type: "list",
    name: "command",
    message: "Which command would you want to run?",
    choices: [ "init", "add" ]
  }]).then(res => res.command);
  switch(command){
    case "init":
      init();
      break;
    case "add":
      add(process.argv[3]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log("Running without any commands lets you choose available commands.");
      process.exit(1);
  }
}
async function checkEnvironment(){
  const nextConfigPath = readdirSync(cwd).find(v => /^next\.config\..?js$/.test(v));
  if(!nextConfigPath){
    console.warn("Next.js config file not found.");
    return false;
  }
  nextConfig = await import(`file:///${resolve(cwd, nextConfigPath)}`).then(res => res.default);
  if(!nextConfig.i18n?.locales || !nextConfig.i18n?.defaultLocale){
    console.warn("Please set i18n.locales and i18n.defaultLocale of your Next.js config file.");
    return false;
  }
  return true;
}
async function init(){
  const path = existsSync(resolve(cwd, "src")) ? resolve(cwd, "src/i18n") : resolve(cwd, "i18n");

  if(existsSync(path)){
    if(readdirSync(path).length){
      console.error(`The directory '${path}' must be empty.`);
      process.exit(1);
    }
  }else{
    mkdirSync(path);
  }
  mkdirSync(resolve(path, "lib"));
  writeFileSync(resolve(path, "lib/client-i18n-initializer.ts"), clientI18nInitializerExample);
  writeFileSync(resolve(path, "lib/i18n-initializer.tsx"), i18nInitializerExample);
  writeFileSync(resolve(path, "lib/i18n-module-loader.ts"), i18nModuleLoaderExample);
  console.log(`Initialization finished to: ${path}`);
  add("l.example");
}
async function add(prefix){
  const path = existsSync(resolve(cwd, "src")) ? resolve(cwd, "src/i18n") : resolve(cwd, "i18n");
  const defaultLocale = nextConfig.i18n.defaultLocale;

  if(!existsSync(path)){
    console.error(`The directory '${path}' not found.`);
    process.exit(1);
  }
  prefix ||= await inquirer.prompt([
    { type: "input", name: "prefix", message: "Prefix?", default: "l.example" }
  ]).then(res => res.prefix);
  const loaderPath = resolve(path, `${prefix}.ts`);

  if(existsSync(loaderPath)){
    console.error(`The file '${loaderPath}' already exists!`);
    process.exit(1);
  }
  writeFileSync(resolve(path, `${prefix}.ts`), loaderExample
    .replace(/CAPITALIZED_LOCALE/g, defaultLocale[0].toUpperCase() + defaultLocale.slice(1))
    .replace(/LOCALE/g, defaultLocale)
    .replace(/PREFIX/g, prefix)
  )
  for(const v of nextConfig.i18n.locales){
    const lexiconPath = resolve(path, v, `${prefix}.${v}.ts`);
    if(existsSync(lexiconPath)){
      console.error(`The file '${lexiconPath}' already exists!`);
      process.exit(1);
    }
    if(!existsSync(resolve(path, v))){
      mkdirSync(resolve(path, v));
    }
    writeFileSync(resolve(path, v, lexiconPath), lexiconExample);
  }
  console.log(`Added: ${prefix}.ts`);
}
main();