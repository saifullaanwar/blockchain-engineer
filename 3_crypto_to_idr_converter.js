#!/usr/bin/env node
'use strict';

require('dotenv').config();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { convertToIdr, SYMBOL_MAP } = require('./converter');

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('3_crypto_to_idr_converter')
    .option('symbol', {
      alias: 's',
      type: 'string',
      demandOption: true,
      describe: `Crypto symbol (${Object.keys(SYMBOL_MAP).join(', ')})`,
    })
    .option('amount', {
      alias: 'a',
      type: 'number',
      demandOption: true,
      describe: 'Amount of crypto to convert',
    })
    .strict()
    .help()
    .parseSync();

  try {
    const result = await convertToIdr({ symbol: argv.symbol, amount: argv.amount });
    console.log(JSON.stringify(result));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

if (require.main === module) main();
