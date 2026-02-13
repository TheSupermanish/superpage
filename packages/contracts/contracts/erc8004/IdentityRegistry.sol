// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IdentityRegistry (ERC-8004 compatible)
 * @notice Simplified non-upgradeable version for SKALE deployment.
 * Provides ERC-721-based agent identity with metadata and wallet binding.
 * ABI-compatible with IdentityRegistryUpgradeable from erc-8004-contracts.
 */
contract IdentityRegistry {
    // --- Minimal ERC-721 state ---
    uint256 private _nextTokenId;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => string) private _tokenURIs;

    // --- ERC-8004 Identity state ---
    mapping(uint256 => address) private _agentWallets;
    mapping(uint256 => mapping(string => bytes)) private _metadata;

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    // --- Events ---
    event Registered(
        uint256 indexed agentId,
        string agentURI,
        address indexed owner
    );

    event MetadataSet(
        uint256 indexed agentId,
        string indexed indexedMetadataKey,
        string metadataKey,
        bytes metadataValue
    );

    event URIUpdated(
        uint256 indexed agentId,
        string newURI,
        address indexed updatedBy
    );

    // --- Modifiers ---
    modifier onlyAgentOwner(uint256 agentId) {
        require(_owners[agentId] == msg.sender, "Not agent owner");
        _;
    }

    modifier agentExists(uint256 agentId) {
        require(_owners[agentId] != address(0), "Agent does not exist");
        _;
    }

    // --- Register overloads ---

    /// @notice Register a new agent (no URI)
    function register() external returns (uint256 agentId) {
        return _register(msg.sender, "");
    }

    /// @notice Register a new agent with a URI
    function register(string calldata agentURI) external returns (uint256 agentId) {
        return _register(msg.sender, agentURI);
    }

    /// @notice Register a new agent with URI and initial metadata
    function register(
        string calldata agentURI,
        MetadataEntry[] calldata metadata
    ) external returns (uint256 agentId) {
        agentId = _register(msg.sender, agentURI);
        for (uint256 i = 0; i < metadata.length; i++) {
            _metadata[agentId][metadata[i].metadataKey] = metadata[i].metadataValue;
            emit MetadataSet(
                agentId,
                metadata[i].metadataKey,
                metadata[i].metadataKey,
                metadata[i].metadataValue
            );
        }
    }

    function _register(address owner, string memory agentURI) internal returns (uint256 agentId) {
        agentId = _nextTokenId++;
        _owners[agentId] = owner;
        _balances[owner]++;
        _tokenURIs[agentId] = agentURI;
        emit Registered(agentId, agentURI, owner);
    }

    // --- URI ---

    function setAgentURI(uint256 agentId, string calldata newURI)
        external
        onlyAgentOwner(agentId)
    {
        _tokenURIs[agentId] = newURI;
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    function tokenURI(uint256 tokenId)
        external
        view
        agentExists(tokenId)
        returns (string memory)
    {
        return _tokenURIs[tokenId];
    }

    // --- Agent Wallet ---
    // Simplified: accepts signature params for ABI compat but skips EIP-712 on testnet

    function setAgentWallet(
        uint256 agentId,
        address newWallet,
        uint256 /* deadline */,
        bytes calldata /* signature */
    ) external onlyAgentOwner(agentId) {
        _agentWallets[agentId] = newWallet;
    }

    function unsetAgentWallet(uint256 agentId) external onlyAgentOwner(agentId) {
        delete _agentWallets[agentId];
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallets[agentId];
    }

    // --- Metadata ---

    function getMetadata(uint256 agentId, string calldata metadataKey)
        external
        view
        returns (bytes memory)
    {
        return _metadata[agentId][metadataKey];
    }

    function setMetadata(
        uint256 agentId,
        string calldata metadataKey,
        bytes calldata metadataValue
    ) external onlyAgentOwner(agentId) {
        _metadata[agentId][metadataKey] = metadataValue;
        emit MetadataSet(agentId, metadataKey, metadataKey, metadataValue);
    }

    // --- ERC-721 reads ---

    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function balanceOf(address owner) external view returns (uint256) {
        require(owner != address(0), "Zero address");
        return _balances[owner];
    }
}
