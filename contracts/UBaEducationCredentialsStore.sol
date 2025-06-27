// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import the ERC20 interface from OpenZeppelin for interacting with the custom token
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Contract for storing and verifying education credentials using a custom ERC20 token
contract UBaEducationCredentialsStore {
    // The ERC20 token used for payments
    IERC20 public token;
    // The owner of the contract (can add credentials, withdraw funds, update fee)
    address public owner;
    // The fee (in tokens) required to verify a credential
    uint256 public verificationFee;

    // Mapping to track which credential hashes have been stored
    mapping(bytes32 => bool) public storedCredentials;

    // Event emitted when a credential is stored
    event CredentialStored(bytes32 indexed hash, address indexed addedBy);
    // Event emitted when a credential is verified
    event CredentialVerified(bytes32 indexed hash, address indexed verifiedBy);

    // Modifier to restrict functions to only the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    // Constructor sets the ERC20 token address, verification fee, and contract owner
    constructor(address _tokenAddress, uint256 _fee) {
        token = IERC20(_tokenAddress);
        verificationFee = _fee;
        owner = msg.sender;
    }

    // Allows the owner to store a credential hash (proof of existence)
    function storeCredential(bytes32 credentialHash) external onlyOwner {
        require(!storedCredentials[credentialHash], "Already stored");
        storedCredentials[credentialHash] = true;
        emit CredentialStored(credentialHash, msg.sender);
    }

    // Allows any user to verify a stored credential by paying the verification fee in tokens
    function verifyCredential(bytes32 credentialHash) external {
        // User must approve this contract to spend tokens before calling
        require(token.transferFrom(msg.sender, address(this), verificationFee), "Token transfer failed");
        require(storedCredentials[credentialHash], "Credential not found");
        emit CredentialVerified(credentialHash, msg.sender);
    }

    // Allows the owner to withdraw collected tokens from the contract
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(token.transfer(owner, amount), "Withdraw failed");
    }

    // Allows the owner to update the verification fee
    function updateFee(uint256 newFee) external onlyOwner {
        verificationFee = newFee;
    }
}