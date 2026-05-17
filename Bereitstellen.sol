// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract Bereitstellen {
    address public deployer;
    string public color;

    event ColorChanged(address caller, string newColor);

    modifier onlyDeployer() {
        require(msg.sender == deployer, "Can only be called by deployer");
        _;
    }

    constructor() {
        deployer = msg.sender;
        color = "white";
        emit ColorChanged(msg.sender, "white");
    }

    // Deviasi dari soal asli: parameter pakai `calldata` (bukan `memory`)
    // untuk gas optimization — string tidak di-mutate, jadi tidak butuh copy ke memory.
    function setColor(string calldata newColor) external onlyDeployer {
        color = newColor;
        emit ColorChanged(msg.sender, newColor);
    }
}
