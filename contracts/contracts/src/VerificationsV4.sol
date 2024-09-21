// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title VerificationsV4
 * @notice Farcaster Verifications posted on-chain by Neynar.
 * @dev [Docs](https://docs.neynar.com/docs/verifications-contract)
 */
contract VerificationsV4 {
    struct SetVerification {
        address verifier;
        uint256 fid;
    }

    bytes32 public constant WRITER_ROLE = keccak256("WRITER_ROLE");

    // [Be VERY careful when upgrading and changing storage!](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#modifying-your-contracts)
    mapping(address => uint256) private verifications;

    event GetFid(address indexed verifier, uint256 indexed fid);

    error FidMustBeNonZero(uint256 index);
    error InputArraysMustHaveTheSameLength(uint256 verifiers, uint256 fids);

    function getFid(address verifier) public view returns (uint256 fid) {
        fid = verifications[verifier];
    }

    function getFidWithEvent(address verifier) public returns (uint256 fid) {
        fid = verifications[verifier];

        emit GetFid(verifier, fid);
    }

    function getFids(address[] calldata verifiers) public view returns (uint256[] memory fids) {
        uint256 length = verifiers.length;

        fids = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            fids[i] = verifications[verifiers[i]];
        }
    }

    /*
     * WRITER_ROLE-only Setters
     */

    function setVerification(address verifier, uint256 fid) public {
        require(fid > 0, FidMustBeNonZero(0));

        verifications[verifier] = fid;
    }

    function setVerifications(SetVerification[] calldata verifiersToAdd) public {
        uint256 length = verifiersToAdd.length;
        for (uint256 i = 0; i < length; i++) {
            // TODO: gas golf this
            uint256 fid = verifiersToAdd[i].fid;

            require(fid > 0, FidMustBeNonZero(i));

            address a = verifiersToAdd[i].verifier;

            verifications[a] = fid;
        }
    }

    function deleteVerification(address verifier) public {
        delete verifications[verifier];
    }

    function deleteVerifications(address[] calldata verifiersToDelete) public {
        uint256 length = verifiersToDelete.length;
        for (uint256 i = 0; i < length; i++) {
            address a = verifiersToDelete[i];
            delete verifications[a];
        }
    }

    function updateVerificationsInBulk(
        SetVerification[] calldata verifiersToAdd,
        address[] calldata verifiersToDelete
    ) public {
        setVerifications(verifiersToAdd);
        deleteVerifications(verifiersToDelete);
    }

    function _authorizeUpgrade(address newImplementation) internal {}
}