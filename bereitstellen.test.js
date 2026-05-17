'use strict';

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

describe('Bereitstellen', () => {
  async function deployFixture() {
    const [deployer, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('Bereitstellen');
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return { contract, deployer, other };
  }

  it('default color is "white"', async () => {
    const { contract } = await loadFixture(deployFixture);
    expect(await contract.color()).to.equal('white');
  });

  it('deployer is stored correctly', async () => {
    const { contract, deployer } = await loadFixture(deployFixture);
    expect(await contract.deployer()).to.equal(deployer.address);
  });

  it('deployer can call setColor and state updates', async () => {
    const { contract } = await loadFixture(deployFixture);
    await contract.setColor('blue');
    expect(await contract.color()).to.equal('blue');
  });

  it('non-deployer cannot call setColor — reverts with exact message', async () => {
    const { contract, other } = await loadFixture(deployFixture);
    await expect(contract.connect(other).setColor('red'))
      .to.be.revertedWith('Can only be called by deployer');
  });

  it('constructor emits ColorChanged(deployer, "white")', async () => {
    const [deployer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('Bereitstellen');
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    await expect(contract.deploymentTransaction())
      .to.emit(contract, 'ColorChanged')
      .withArgs(deployer.address, 'white');
  });

  it('setColor emits ColorChanged with correct args', async () => {
    const { contract, deployer } = await loadFixture(deployFixture);
    await expect(contract.setColor('green'))
      .to.emit(contract, 'ColorChanged')
      .withArgs(deployer.address, 'green');
  });

  // Optional Test #7 — behavior documentation
  it('setColor with empty string is allowed by design (no length check)', async () => {
    const { contract, deployer } = await loadFixture(deployFixture);
    await expect(contract.setColor(''))
      .to.emit(contract, 'ColorChanged')
      .withArgs(deployer.address, '');
    expect(await contract.color()).to.equal('');
  });
});
