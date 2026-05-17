'use strict';

require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

const { ALCHEMY_URL, PRIVATE_KEY } = process.env;

const networks = { hardhat: {} };
if (ALCHEMY_URL && PRIVATE_KEY) {
  networks.sepolia = {
    url: ALCHEMY_URL,
    accounts: [PRIVATE_KEY],
  };
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.30',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks,
};
