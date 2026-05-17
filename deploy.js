'use strict';

const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deployer        :', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Balance         :', ethers.formatEther(balance), 'ETH');

  const Factory = await ethers.getContractFactory('Bereitstellen');

  const deployTx = await Factory.getDeployTransaction();
  const gasEstimate = await ethers.provider.estimateGas(deployTx);
  console.log('Estimated gas   :', gasEstimate.toString());

  const contract = await Factory.deploy();
  const deploymentTx = contract.deploymentTransaction();
  console.log('Deploy tx hash  :', deploymentTx.hash);

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log('Contract address:', address);

  const defaultColor = await contract.color();
  console.log('Default color   :', defaultColor);

  const storedDeployer = await contract.deployer();
  console.log('Stored deployer :', storedDeployer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
