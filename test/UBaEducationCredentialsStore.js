const { expect } = require("chai");
const { ethers } = require("hardhat");

// Test suite for the UBaEducationCredentialsStore smart contract
describe("UBaEducationCredentialsStore", function () {
  // Declare variables to be used in the tests
  let Token, token, Store, store, owner, user, approver3, verificationFee;

  // Deploy fresh contracts and set up state before each test
  beforeEach(async function () {
    // Get three accounts to act as owner, user, and a third approver
    [owner, user, approver3] = await ethers.getSigners();

    // Set the verification fee to 1 token (in wei)
    verificationFee = ethers.parseEther("1");

    // Deploy the custom ERC20 token contract with three approvers
    Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy("MyToken", "MTK", [owner.address, user.address, approver3.address]);
    await token.waitForDeployment();

    // Mint 2 tokens to the owner for testing purposes
    await token.connect(owner).mint(owner.address, ethers.parseEther("2"));

    // Transfer 1 token from owner to user so the user can pay verification fees
    await token.connect(owner).transfer(user.address, ethers.parseEther("1"));

    // Deploy the credentials store contract, passing the token address and verification fee
    Store = await ethers.getContractFactory("UBaEducationCredentialsStore");
    store = await Store.deploy(await token.getAddress(), verificationFee);
    await store.waitForDeployment();
  });

  // Test: Only the owner can store a credential hash
  it("should allow owner to store credential hash", async function () {
    // Hash a sample document string
    const hash = ethers.keccak256(ethers.toUtf8Bytes("testdoc"));
    // Expect storing the credential to emit the correct event and update the mapping
    await expect(store.connect(owner).storeCredential(hash))
      .to.emit(store, "CredentialStored")
      .withArgs(hash, owner.address);
    expect(await store.storedCredentials(hash)).to.be.true;
  });

  // Test: Non-owners cannot store credentials
  it("should not allow non-owner to store credential", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("testdoc"));
    // Expect the transaction to revert with the correct error message
    await expect(store.connect(user).storeCredential(hash)).to.be.revertedWith("Not contract owner");
  });

  // Test: User can verify a credential by paying the fee
  it("should allow user to verify credential by paying fee", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("testdoc"));
    // Owner stores the credential first
    await store.connect(owner).storeCredential(hash);

    // User approves the store contract to spend their tokens for the verification fee
    await token.connect(user).approve(await store.getAddress(), verificationFee);

    // Expect verifying the credential to emit the correct event
    await expect(store.connect(user).verifyCredential(hash))
      .to.emit(store, "CredentialVerified")
      .withArgs(hash, user.address);
  });

  // Test: Only the owner can withdraw tokens collected as fees
  it("should allow only owner to withdraw tokens", async function () {
    const hash = ethers.keccak256(ethers.toUtf8Bytes("testdoc"));
    // Owner stores the credential
    await store.connect(owner).storeCredential(hash);
    // User approves and pays the verification fee
    await token.connect(user).approve(await store.getAddress(), verificationFee);
    await store.connect(user).verifyCredential(hash);

    // Record owner's balance before withdrawal
    const balanceBefore = await token.balanceOf(owner.address);
    // Owner withdraws the verification fee
    await expect(store.connect(owner).withdrawTokens(verificationFee))
      .to.not.be.reverted;
    // Record owner's balance after withdrawal
    const balanceAfter = await token.balanceOf(owner.address);
    // Check that the withdrawn amount matches the verification fee
    expect(balanceAfter - balanceBefore).to.equal(verificationFee);
  });
});