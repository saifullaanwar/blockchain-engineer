# 4 — Bereitstellen Smart Contract Deployment

Deploy + interact smart contract `Bereitstellen` (Solidity 0.8.30) ke Sepolia testnet sebagai bagian dari technical test Junior Blockchain Engineer. Mencakup compile, unit tests (Hardhat + chai matchers), deploy script, dan interaction script dengan dua skenario (success + revert via `staticCall`).

## Wallet & Deployment Info

| Field | Value |
|---|---|
| **Public Wallet** | `0xfAc1A1e027ADAcEAfDbB7dE745045C04Edc63FEE` |
| **Network** | Sepolia Testnet (Chain ID `11155111`) |
| **Contract Address** | [`0x1e2b21C2b91aBa82E54EA1094CAa31DAB4a30D81`](https://sepolia.etherscan.io/address/0x1e2b21C2b91aBa82E54EA1094CAa31DAB4a30D81) |
| **Deploy Tx** | [`0xded9c6bc...c302ffd607`](https://sepolia.etherscan.io/tx/0xded9c6bc9d629ead8ddd523c4db727d886680456393e5b8bc5ee84c302ffd607) |
| **setColor("blue") Tx** | [`0x350b5242...994732b9`](https://sepolia.etherscan.io/tx/0x350b5242d0303c6c6de83b415176924c75ed8326e30465a5f858e538994732b9) |

Snapshot deployment terstruktur di [`deployment.json`](deployment.json).

## Network Choice — Why Sepolia

| Network | Status (per 2026) | Verdict |
|---|---|---|
| **Sepolia** | ✅ Active, official Ethereum testnet, semua major faucet support (Google Cloud Web3, Alchemy, PoW faucet) | **CHOSEN** |
| Goerli | ❌ Deprecated end of 2023, faucet & validator support discontinued | Skip |
| Holesky | ⚠️ Active (launched 2024), tapi ecosystem tooling masih maturing dibanding Sepolia | Skip |
| Mumbai | ❌ Polygon testnet (bukan Ethereum L1), deprecated mid-2024, diganti Amoy | Skip |

**Conclusion:** Sepolia = current industry standard untuk Ethereum L1 testnet. Cocok untuk demo contract Solidity yang spek-nya Ethereum-native.

## Gas Estimation & Optimization

| Operation | Estimated | Actual | Notes |
|---|---|---|---|
| Deploy | 357,724 | ~353,757 | Within estimate (actual fee 0.000000353757843725 ETH @ gas price ~0.001 gwei) |
| `setColor("blue")` | ~33,000 (with `string memory`) | **31,428** (with `string calldata`) | ~5% savings dari calldata optimization |

**Engineering note:** `string calldata` (bukan `string memory`) di parameter `setColor` menghemat ~1,600 gas per call. Tidak butuh copy ke memory karena string langsung di-assign ke storage (`color = newColor`) dan emit ke event log. Trade-off: parameter tidak bisa di-mutate di dalam function — tapi memang tidak diperlukan di sini.

## Design Decisions

1. **`string calldata` di `setColor`** — deviasi dari soal asli (yang pakai `memory`). Hemat ~5% gas. Komentar di [contracts/Bereitstellen.sol](contracts/Bereitstellen.sol) menjelaskan deviasi ini eksplisit supaya reviewer paham reasoning-nya.
2. **Conditional Sepolia network config** — di [hardhat.config.js](hardhat.config.js), network `sepolia` hanya di-register kalau `ALCHEMY_URL` & `PRIVATE_KEY` keduanya ada. Tanpa `.env`, `compile`/`test` tetap jalan (pakai in-memory hardhat network). Mencegah `compile` gagal di CI atau dev yang baru clone.
3. **`staticCall` untuk simulasi revert di interact.js** — `ethers.Wallet.createRandom()` connect ke provider, lalu `contract.setColor.staticCall(...)`. Karena `staticCall` = `eth_call` read-only, **wallet random tidak butuh ETH**, no broadcast, no on-chain footprint. Lebih elegan dari alternatif (fund random wallet → real revert tx → 2 extra roundtrips + gas wasted).
4. **`loadFixture` di unit tests** — snapshot Hardhat state setelah deploy, revert ke snapshot antar test. ~5x lebih cepat dari re-deploy per test, dan setiap test fully isolated.
5. **`.to.emit().withArgs()` matcher** untuk event verification — pakai `@nomicfoundation/hardhat-chai-matchers`. Lebih readable dari parse `receipt.logs` manual via `contract.interface.parseLog`.
6. **Typed network ID di config** — `chainId` Sepolia (11155111) ada di `deployment.json` supaya tools downstream (verify, indexer) bisa lookup tanpa hardcode.

## Project Structure

```
4_bereitstellen/
├── contracts/
│   └── Bereitstellen.sol
├── scripts/
│   ├── deploy.js
│   └── interact.js
├── test/
│   └── bereitstellen.test.js
├── hardhat.config.js
├── .env.example
├── deployment.json           # snapshot dari latest deployment + interact
├── package.json
└── README.md
```

## Setup

**Prerequisites:**
- Node.js 18+
- MetaMask wallet (test only, **NOT** akun yang punya mainnet ETH)
- Alchemy account dengan Sepolia app ([dashboard.alchemy.com](https://dashboard.alchemy.com))
- Sepolia ETH balance ≥ 0.01 ETH ([Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia))

**Steps:**

```sh
cd 4_bereitstellen
npm install
cp .env.example .env
# Edit .env, isi:
#   ALCHEMY_URL  = https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
#   PRIVATE_KEY  = 0x + 64 hex chars dari MetaMask → Account details → Show private key
```

**⚠️ Verifikasi sebelum lanjut:** PRIVATE_KEY harus tepat **66 chars** (`0x` + 64 hex). Address wallet hanya 42 chars — sering tertukar.

## Running Tests

```sh
npm test                       # alias: npx hardhat test
```

**Expected:** 7/7 PASS dalam ~750ms (warm).

| # | Test | Verifies |
|---|---|---|
| 1 | `default color is "white"` | Constructor sets correct default |
| 2 | `deployer is stored correctly` | State `deployer` = msg.sender constructor |
| 3 | `deployer can call setColor and state updates` | Happy path setColor + state mutation |
| 4 | `non-deployer cannot call setColor — reverts with exact message` | `onlyDeployer` modifier + revert string match |
| 5 | `constructor emits ColorChanged(deployer, "white")` | Constructor event + correct args |
| 6 | `setColor emits ColorChanged with correct args` | setColor event + correct args |
| 7 | `setColor with empty string is allowed by design (no length check)` | Behavior documentation: empty string accepted |

## Deployment Guide

```sh
npm run deploy:sepolia         # alias: npx hardhat run scripts/deploy.js --network sepolia
```

**Expected output format:**

```
Deployer        : 0xfAc1A1e027ADAcEAfDbB7dE745045C04Edc63FEE
Balance         : 0.05 ETH
Estimated gas   : 357724
Deploy tx hash  : 0xded9c6bc9d629ead8ddd523c4db727d886680456393e5b8bc5ee84c302ffd607
Contract address: 0x1e2b21C2b91aBa82E54EA1094CAa31DAB4a30D81
Default color   : white
Stored deployer : 0xfAc1A1e027ADAcEAfDbB7dE745045C04Edc63FEE
```

**Cost:** ~0.0000004 ETH (Sepolia gas price typically ~0.001–0.01 gwei). Setelah deploy, **copy contract address** untuk dipakai di interact step.

## Interaction Guide

```sh
$env:CONTRACT_ADDRESS="0x..."  # PowerShell — atau export di bash
npm run interact:sepolia       # alias: npx hardhat run scripts/interact.js --network sepolia
```

**Expected output format:**

```
Deployer        : 0xfAc1A1e027ADAcEAfDbB7dE745045C04Edc63FEE
Contract        : 0x1e2b21C2b91aBa82E54EA1094CAa31DAB4a30D81
Current color   : white

--- 1) setColor("blue") from deployer (expect success) ---
Tx hash         : 0x350b5242d0303c6c6de83b415176924c75ed8326e30465a5f858e538994732b9
Gas used        : 31428
Block number    : 10862658
New color       : blue

--- 2) setColor("red") from random wallet (expect revert) ---
Random wallet   : 0x9D79faF4055f7AC4051e857Dbcae8509b350E4A7
Reverted as expected: execution reverted: Can only be called by deployer
```

**Two scenarios:**
- **Scenario 1** (real tx): deployer wallet call `setColor("blue")` → success, gas ~31,428, state mutate.
- **Scenario 2** (staticCall, read-only): random wallet attempt `setColor("red")` → revert dengan reason persis `"Can only be called by deployer"`. **Tidak ada tx di Etherscan** karena `eth_call` tidak broadcast.

## Issues Encountered & Resolutions

### Issue 1 — PRIVATE_KEY paste mistake

**Symptom:** `npx hardhat run scripts/deploy.js --network sepolia` gagal dengan `Invalid account: #0 for network: sepolia - private key too short, expected 32 bytes`.

**Diagnosis:** Diagnostic script (tanpa expose value) menunjukkan `PRIVATE_KEY` length = 42 chars (= `0x` + 40 hex), bukan 66 (= `0x` + 64 hex). 40 hex chars = 20 bytes = panjang **address**, bukan **private key**.

**Root cause:** Dua-duanya berbentuk `0x...` jadi mudah tertukar saat copy-paste dari MetaMask.

**Resolution:** Re-export private key via MetaMask → 3-dot menu → Account details → Show private key (butuh password). Replace value di `.env`. Re-run deploy sukses.

**Lesson:** Selalu cek panjang private key (66 chars dengan `0x`, atau 64 tanpa) sebelum first deploy. Diagnostic via script lebih aman dari `cat .env` karena tidak expose value.

### Issue 2 — Hardhat 3 auto-install

**Symptom:** `npm install hardhat @nomicfoundation/hardhat-toolbox` (latest) menarik **Hardhat 3.4.5** + toolbox 7.0.0 — keduanya untuk Hardhat 3 release line yang ESM-first dengan API rewrite. Bundled deps berbeda (no chai/ethers in toolbox 7).

**Root cause:** Hardhat 3 baru release sebagai stable. `npm install hardhat` (tanpa version pin) defaultnya ke latest.

**Resolution:** Pin explicit versi `hardhat@^2.28.0` + `@nomicfoundation/hardhat-toolbox@^5.0.0`. Hardhat 2.28 minimum untuk satisfy peer dep `hardhat-ethers@3.1.3`.

**Lesson:** Untuk technical test atau production codebase, pin version range hardhat di `devDependencies`. Hardhat 2.x masih industry standard di 2026 — tutorials, docs, dan ecosystem plugins mayoritas asumsikan Hardhat 2.

## Security Considerations

- `.env` di-gitignore di root project (verified via `git status` — tidak muncul di staging).
- Test wallet **terpisah** dari akun MetaMask utama. Tidak memegang mainnet ETH apa pun.
- Private key di-handle local-only:
  - Di-paste hanya ke `.env` (gitignored)
  - Tidak pernah di-paste ke chat, terminal log, atau commit message
  - Tidak ada `console.log(process.env.PRIVATE_KEY)` di kode mana pun
- Seed phrase MetaMask di-backup offline (paper backup), tidak di file/cloud.
- Public wallet address dan tx hash boleh di-share — itu memang public di Etherscan.

## Dependencies

| Package | Version | Role |
|---|---|---|
| `hardhat` | 2.28.0 | Smart contract framework |
| `@nomicfoundation/hardhat-toolbox` | 5.0.0 | Meta-package: bundle ethers v6, hardhat-ethers, chai 4, chai-matchers, network-helpers |
| `dotenv` | 17.4.2 | Load `.env` di hardhat.config.js |

Bundled via toolbox: `ethers@6.16.0`, `chai@4.5.0`, `mocha@10.8.2`, `@nomicfoundation/hardhat-ethers@3.1.3`, `@nomicfoundation/hardhat-chai-matchers@2.1.2`, `@nomicfoundation/hardhat-network-helpers`.

## Compliance Verification

| Spec Requirement (dari soal asli) | Implementation | Status |
|---|---|---|
| Pragma Solidity `0.8.30` | `pragma solidity 0.8.30;` | ✅ |
| `address public deployer` state | `address public deployer;` | ✅ |
| `string public color` state | `string public color;` | ✅ |
| Constructor: `deployer = msg.sender` | line 16 | ✅ |
| Constructor: `color = "white"` default | line 17 | ✅ |
| Constructor emit `ColorChanged(msg.sender, "white")` | line 18 | ✅ |
| Modifier `onlyDeployer` | line 9–12 | ✅ |
| Modifier revert message persis `"Can only be called by deployer"` | exact string match | ✅ |
| `setColor` pakai modifier `onlyDeployer` | line 23 | ✅ |
| Event `ColorChanged(address caller, string newColor)` — param names persis | line 7 | ✅ |
| `setColor` emit event dengan `(msg.sender, newColor)` | line 25 | ✅ |

**Deviasi terdokumentasi:**
- `string calldata` (bukan `memory`) di parameter `setColor` — gas optimization, di-document di komentar source + section "Gas Estimation" di atas.
