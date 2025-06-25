require("dotenv").config();
const { ethers } = require("hardhat");

// Main deployment function
async function main() {
  // Address of your already deployed ERC20 token on Sepolia
  // Read token address from environment variable
  const tokenAddress = process.env.TOKEN_ADDRESS;
  if (!tokenAddress) {
    throw new Error("TOKEN_ADDRESS not set in .env file");
  }

  // Set the verification fee (1 token, assuming 18 decimals)
  const verificationFee = ethers.parseUnits("1", 18);

  // Get the contract factory for UBaEducationCredentialsStore
  const Store = await ethers.getContractFactory("UBaEducationCredentialsStore");

  // Deploy the contract with the token address and verification fee as constructor arguments
  const store = await Store.deploy(tokenAddress, verificationFee);

  // Wait for the deployment transaction to be mined
  await store.waitForDeployment();

  // Output the deployed contract address
  console.log("UBaEducationCredentialsStore deployed to:", await store.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



