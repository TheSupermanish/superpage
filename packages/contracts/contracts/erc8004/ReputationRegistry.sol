// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReputationRegistry (ERC-8004 compatible)
 * @notice Simplified non-upgradeable version for SKALE deployment.
 * Provides on-chain reputation feedback for AI agents with WAD-normalized summaries.
 * ABI-compatible with ReputationRegistryUpgradeable from erc-8004-contracts.
 */
contract ReputationRegistry {
    address private _identityRegistry;

    struct Feedback {
        int128 value;
        uint8 valueDecimals;
        string tag1;
        string tag2;
        string endpoint;
        string feedbackURI;
        bytes32 feedbackHash;
        bool isRevoked;
    }

    struct ResponseEntry {
        address responder;
        string responseURI;
        bytes32 responseHash;
    }

    // agentId => clientAddress => feedbackIndex => Feedback
    mapping(uint256 => mapping(address => mapping(uint64 => Feedback))) private _feedback;
    // agentId => clientAddress => lastIndex (next feedbackIndex to use)
    mapping(uint256 => mapping(address => uint64)) private _lastIndex;
    // agentId => list of client addresses
    mapping(uint256 => address[]) private _clients;
    // agentId => clientAddress => hasLeft (to avoid duplicates in _clients)
    mapping(uint256 => mapping(address => bool)) private _hasClient;
    // agentId => clientAddress => feedbackIndex => responses
    mapping(uint256 => mapping(address => mapping(uint64 => ResponseEntry[]))) private _responses;

    // WAD = 10^18 for normalization
    int256 private constant WAD = 1e18;

    // --- Events ---
    event NewFeedback(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string indexed indexedTag1,
        string tag1,
        string tag2,
        string endpoint,
        string feedbackURI,
        bytes32 feedbackHash
    );

    event FeedbackRevoked(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );

    event ResponseAppended(
        uint256 indexed agentId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        address indexed responder,
        string responseURI,
        bytes32 responseHash
    );

    constructor(address identityRegistry_) {
        _identityRegistry = identityRegistry_;
    }

    // --- Write functions ---

    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external {
        // Anti-Sybil: caller must not be the agent owner
        (bool success, bytes memory data) = _identityRegistry.staticcall(
            abi.encodeWithSignature("ownerOf(uint256)", agentId)
        );
        if (success && data.length >= 32) {
            address owner = abi.decode(data, (address));
            require(owner != msg.sender, "Agent owner cannot self-feedback");
        }

        // Track client
        if (!_hasClient[agentId][msg.sender]) {
            _clients[agentId].push(msg.sender);
            _hasClient[agentId][msg.sender] = true;
        }

        uint64 idx = _lastIndex[agentId][msg.sender];
        _feedback[agentId][msg.sender][idx] = Feedback({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            endpoint: endpoint,
            feedbackURI: feedbackURI,
            feedbackHash: feedbackHash,
            isRevoked: false
        });
        _lastIndex[agentId][msg.sender] = idx + 1;

        emit NewFeedback(
            agentId, msg.sender, idx, value, valueDecimals,
            tag1, tag1, tag2, endpoint, feedbackURI, feedbackHash
        );
    }

    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        Feedback storage fb = _feedback[agentId][msg.sender][feedbackIndex];
        require(fb.valueDecimals > 0 || fb.value != 0 || bytes(fb.tag1).length > 0 || bytes(fb.feedbackURI).length > 0,
            "Feedback does not exist");
        require(!fb.isRevoked, "Already revoked");
        fb.isRevoked = true;
        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external {
        _responses[agentId][clientAddress][feedbackIndex].push(
            ResponseEntry({
                responder: msg.sender,
                responseURI: responseURI,
                responseHash: responseHash
            })
        );
        emit ResponseAppended(agentId, clientAddress, feedbackIndex, msg.sender, responseURI, responseHash);
    }

    // --- Read functions ---

    function readFeedback(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex
    ) external view returns (
        int128 value,
        uint8 valueDecimals,
        string memory tag1,
        string memory tag2,
        bool isRevoked
    ) {
        Feedback storage fb = _feedback[agentId][clientAddress][feedbackIndex];
        return (fb.value, fb.valueDecimals, fb.tag1, fb.tag2, fb.isRevoked);
    }

    function readAllFeedback(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2,
        bool includeRevoked
    ) external view returns (
        address[] memory clients,
        uint64[] memory feedbackIndexes,
        int128[] memory values,
        uint8[] memory valueDecimals,
        string[] memory tag1s,
        string[] memory tag2s,
        bool[] memory revokedStatuses
    ) {
        // Determine which clients to iterate
        address[] memory addrs;
        if (clientAddresses.length > 0) {
            addrs = clientAddresses;
        } else {
            addrs = _clients[agentId];
        }

        // First pass: count matching entries
        uint256 total = 0;
        for (uint256 i = 0; i < addrs.length; i++) {
            uint64 count = _lastIndex[agentId][addrs[i]];
            for (uint64 j = 0; j < count; j++) {
                Feedback storage fb = _feedback[agentId][addrs[i]][j];
                if (!includeRevoked && fb.isRevoked) continue;
                if (bytes(tag1).length > 0 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (bytes(tag2).length > 0 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;
                total++;
            }
        }

        // Allocate arrays
        clients = new address[](total);
        feedbackIndexes = new uint64[](total);
        values = new int128[](total);
        valueDecimals = new uint8[](total);
        tag1s = new string[](total);
        tag2s = new string[](total);
        revokedStatuses = new bool[](total);

        // Second pass: populate
        uint256 idx = 0;
        for (uint256 i = 0; i < addrs.length; i++) {
            uint64 count = _lastIndex[agentId][addrs[i]];
            for (uint64 j = 0; j < count; j++) {
                Feedback storage fb = _feedback[agentId][addrs[i]][j];
                if (!includeRevoked && fb.isRevoked) continue;
                if (bytes(tag1).length > 0 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (bytes(tag2).length > 0 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;
                clients[idx] = addrs[i];
                feedbackIndexes[idx] = j;
                values[idx] = fb.value;
                valueDecimals[idx] = fb.valueDecimals;
                tag1s[idx] = fb.tag1;
                tag2s[idx] = fb.tag2;
                revokedStatuses[idx] = fb.isRevoked;
                idx++;
            }
        }
    }

    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string calldata tag1,
        string calldata tag2
    ) external view returns (
        uint64 count,
        int128 summaryValue,
        uint8 summaryValueDecimals
    ) {
        address[] memory addrs;
        if (clientAddresses.length > 0) {
            addrs = clientAddresses;
        } else {
            addrs = _clients[agentId];
        }
        int256 wadSum = 0;
        uint64 n = 0;

        for (uint256 i = 0; i < addrs.length; i++) {
            uint64 fbCount = _lastIndex[agentId][addrs[i]];
            for (uint64 j = 0; j < fbCount; j++) {
                Feedback storage fb = _feedback[agentId][addrs[i]][j];
                if (fb.isRevoked) continue;
                if (bytes(tag1).length > 0 && keccak256(bytes(fb.tag1)) != keccak256(bytes(tag1))) continue;
                if (bytes(tag2).length > 0 && keccak256(bytes(fb.tag2)) != keccak256(bytes(tag2))) continue;

                // Normalize to WAD (18 decimals)
                int256 wadValue = int256(fb.value) * int256(10 ** (18 - uint256(fb.valueDecimals)));
                wadSum += wadValue;
                n++;
            }
        }

        count = n;
        if (n > 0) {
            summaryValue = int128(wadSum / int256(uint256(n)));
        }
        summaryValueDecimals = 18; // WAD
    }

    function getClients(uint256 agentId) external view returns (address[] memory) {
        return _clients[agentId];
    }

    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64) {
        return _lastIndex[agentId][clientAddress];
    }

    function getResponseCount(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        address[] calldata /* responders */
    ) external view returns (uint64 count) {
        return uint64(_responses[agentId][clientAddress][feedbackIndex].length);
    }

    function getIdentityRegistry() external view returns (address) {
        return _identityRegistry;
    }
}
