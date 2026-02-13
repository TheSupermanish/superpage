// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ValidationRegistry (ERC-8004 compatible)
 * @notice Simplified non-upgradeable version for SKALE deployment.
 * Provides third-party validation request/response tracking for AI agents.
 * ABI-compatible with ValidationRegistryUpgradeable from erc-8004-contracts.
 */
contract ValidationRegistry {
    address private _identityRegistry;

    struct ValidationData {
        address validatorAddress;
        uint256 agentId;
        uint8 response;        // 0 = pending, 1-100 = score
        bytes32 responseHash;
        string responseURI;
        string tag;
        uint256 lastUpdate;
        bool exists;
    }

    // requestHash => ValidationData
    mapping(bytes32 => ValidationData) private _validations;
    // agentId => list of requestHashes
    mapping(uint256 => bytes32[]) private _agentValidations;
    // validatorAddress => list of requestHashes
    mapping(address => bytes32[]) private _validatorRequests;

    // --- Events ---
    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed agentId,
        string requestURI,
        bytes32 indexed requestHash
    );

    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed agentId,
        bytes32 indexed requestHash,
        uint8 response,
        string responseURI,
        bytes32 responseHash,
        string tag
    );

    constructor(address identityRegistry_) {
        _identityRegistry = identityRegistry_;
    }

    // --- Write functions ---

    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external {
        require(!_validations[requestHash].exists, "Request already exists");

        _validations[requestHash] = ValidationData({
            validatorAddress: validatorAddress,
            agentId: agentId,
            response: 0,
            responseHash: bytes32(0),
            responseURI: "",
            tag: "",
            lastUpdate: block.timestamp,
            exists: true
        });

        _agentValidations[agentId].push(requestHash);
        _validatorRequests[validatorAddress].push(requestHash);

        emit ValidationRequest(validatorAddress, agentId, requestURI, requestHash);
    }

    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external {
        ValidationData storage v = _validations[requestHash];
        require(v.exists, "Request does not exist");
        require(v.validatorAddress == msg.sender, "Only assigned validator");

        v.response = response;
        v.responseURI = responseURI;
        v.responseHash = responseHash;
        v.tag = tag;
        v.lastUpdate = block.timestamp;

        emit ValidationResponse(
            msg.sender, v.agentId, requestHash,
            response, responseURI, responseHash, tag
        );
    }

    // --- Read functions ---

    function getValidationStatus(bytes32 requestHash)
        external
        view
        returns (
            address validatorAddress,
            uint256 agentId,
            uint8 response,
            bytes32 responseHash,
            string memory tag,
            uint256 lastUpdate
        )
    {
        ValidationData storage v = _validations[requestHash];
        return (
            v.validatorAddress,
            v.agentId,
            v.response,
            v.responseHash,
            v.tag,
            v.lastUpdate
        );
    }

    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string calldata tag
    ) external view returns (uint64 count, uint8 avgResponse) {
        bytes32[] storage hashes = _agentValidations[agentId];
        uint256 total = 0;
        uint256 n = 0;

        for (uint256 i = 0; i < hashes.length; i++) {
            ValidationData storage v = _validations[hashes[i]];
            if (v.response == 0) continue; // skip pending

            // Filter by validators if specified
            if (validatorAddresses.length > 0) {
                bool found = false;
                for (uint256 j = 0; j < validatorAddresses.length; j++) {
                    if (v.validatorAddress == validatorAddresses[j]) {
                        found = true;
                        break;
                    }
                }
                if (!found) continue;
            }

            // Filter by tag if specified
            if (bytes(tag).length > 0 && keccak256(bytes(v.tag)) != keccak256(bytes(tag))) continue;

            total += uint256(v.response);
            n++;
        }

        count = uint64(n);
        if (n > 0) {
            avgResponse = uint8(total / n);
        }
    }

    function getAgentValidations(uint256 agentId) external view returns (bytes32[] memory) {
        return _agentValidations[agentId];
    }

    function getValidatorRequests(address validatorAddress) external view returns (bytes32[] memory) {
        return _validatorRequests[validatorAddress];
    }

    function getIdentityRegistry() external view returns (address) {
        return _identityRegistry;
    }
}
