// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, Ownable {
    address[] public mintApprovers;
    mapping(address => bool) public isApprover;

    mapping(address => bool) public mintApproval;
    uint256 public approvalCount;
    uint256 public constant MIN_APPROVALS = 3;

    mapping(address => bool) public withdrawApproval;
    uint256 public withdrawApprovalCount;

    address public fundReceiver;

    uint256 public tokenPrice = 0.001 ether;

    constructor(
    string memory name,
    string memory symbol,
    address[] memory _approvers
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(_approvers.length == 3, "Exactly 3 approvers required");

        for (uint i = 0; i < 3; i++) {
            mintApprovers.push(_approvers[i]);
            isApprover[_approvers[i]] = true;
        }

        fundReceiver = msg.sender;
    }

    


    // Fallback to receive ETH and convert to tokens
    receive() external payable {
        buyTokens();
    }

    function buyTokens() public payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        uint256 amount = msg.value / tokenPrice;
        _mint(msg.sender, amount * 10 ** decimals());
    }

    function approveMint() external {
        require(isApprover[msg.sender], "Not authorized");
        require(!mintApproval[msg.sender], "Already approved");
        mintApproval[msg.sender] = true;
        approvalCount++;

        if (approvalCount >= MIN_APPROVALS) {
            _mint(msg.sender, 1000 * 10 ** decimals());
            resetMintApprovals();
        }
    }

    function resetMintApprovals() internal {
        for (uint256 i = 0; i < mintApprovers.length; i++) {
            mintApproval[mintApprovers[i]] = false;
        }
        approvalCount = 0;
    }

    function approveWithdraw() external {
        require(isApprover[msg.sender], "Not authorized");
        require(!withdrawApproval[msg.sender], "Already approved");

        withdrawApproval[msg.sender] = true;
        withdrawApprovalCount++;

        if (withdrawApprovalCount >= 2) {
            payable(fundReceiver).transfer(address(this).balance);
            resetWithdrawApprovals();
        }
    }

    function resetWithdrawApprovals() internal {
        for (uint256 i = 0; i < mintApprovers.length; i++) {
            withdrawApproval[mintApprovers[i]] = false;
        }
        withdrawApprovalCount = 0;
    }

    function setFundReceiver(address _newReceiver) external onlyOwner {
        fundReceiver = _newReceiver;
    }

    function setTokenPrice(uint256 newPrice) external onlyOwner {
        tokenPrice = newPrice;
    }
}
