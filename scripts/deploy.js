const hre = require("hardhat");

async function main() {
  const approvers = [
    "0xBD825F9D06Ff5213c325D7Bcd63CafCCf49294D3",
    "0x05f508f08713F9602ada77D4cCD55E2C91715211",
    "0xc1A6b651f7E0B5dc6A3bd235C05e9b8f3d46C25f"
  ];

  const Token = await hre.ethers.getContractFactory("MyToken");

  // Pass name, symbol, and approvers
  const token = await Token.deploy("Group 8 Token", "G8TK", approvers);

    await token.waitForDeployment();
    console.log("G8TK deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



