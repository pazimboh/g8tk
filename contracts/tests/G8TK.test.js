const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken - Group 8 Token", function () {
  let Token, token;
  let owner, addr1, addr2, addr3, addr4;
  let approvers;

  beforeEach(async () => {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    approvers = [addr1.address, addr2.address, addr3.address];

    Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy("Group 8 Token", "G8TK", approvers);
    await token.waitForDeployment();
  });

  it("should assign the total supply correctly after minting", async () => {
    // simulate ETH-to-token conversion
    await owner.sendTransaction({
      to: await token.getAddress(),
      value: ethers.parseEther("0.01"), // should mint 10 tokens
    });

    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseUnits("10", 18));
  });

  it("should allow token transfer and update balances", async () => {
    await owner.sendTransaction({
      to: await token.getAddress(),
      value: ethers.parseEther("0.01"),
    });

    await token.transfer(addr1.address, ethers.parseUnits("5", 18));
    const balance1 = await token.balanceOf(addr1.address);
    expect(balance1).to.equal(ethers.parseUnits("5", 18));
  });

  it("should allow only 3 approvers to approve minting", async () => {
    // addr1, addr2, addr3 are allowed
    await token.connect(addr1).approveMint();
    await token.connect(addr2).approveMint();
    await token.connect(addr3).approveMint();

    const balance = await token.balanceOf(addr3.address);
    expect(balance).to.equal(ethers.parseUnits("1000", 18));
  });

  it("should prevent unauthorized address from approving minting", async () => {
    await expect(token.connect(addr4).approveMint()).to.be.revertedWith("Not authorized");
  });

  it("should prevent withdraw approval from unauthorized address", async () => {
    await expect(token.connect(addr4).approveWithdraw()).to.be.revertedWith("Not authorized");
  });
});
