'use strict';

const { ethers } = require('hardhat');

async function main() {
  const address = process.env.CONTRACT_ADDRESS || process.argv[2];
  if (!address) {
    throw new Error(
      'Missing contract address. Set CONTRACT_ADDRESS env or pass as argv[2].',
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log('Deployer        :', deployer.address);
  console.log('Contract        :', address);

  const contract = await ethers.getContractAt('Bereitstellen', address);

  const initialColor = await contract.color();
  console.log('Current color   :', initialColor);

  console.log('\n--- 1) setColor("blue") from deployer (expect success) ---');
  const tx = await contract.setColor('blue');
  console.log('Tx hash         :', tx.hash);
  const receipt = await tx.wait();
  console.log('Gas used        :', receipt.gasUsed.toString());
  console.log('Block number    :', receipt.blockNumber);
  console.log('New color       :', await contract.color());

  console.log('\n--- 2) setColor("red") from random wallet (expect revert) ---');
  const randomWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log('Random wallet   :', randomWallet.address);
  try {
    // staticCall = eth_call read-only, no gas spent, no funds needed.
    // Propagates the require() revert reason without producing an on-chain tx.
    await contract.connect(randomWallet).setColor.staticCall('red');
    console.log('UNEXPECTED: did not revert');
    process.exit(1);
  } catch (err) {
    const reason = err.reason || err.shortMessage || err.message;
    console.log('Reverted as expected:', reason);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
