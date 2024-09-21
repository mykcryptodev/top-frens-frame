// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IVerificationsV4Reader {
    function getFid(address verifier) external view returns (uint256 fid);
    function getFidWithEvent(address verifier) external returns (uint256 fid);
    function getFids(address[] calldata verifiers) external view returns (uint256[] memory fid);
}

contract TopFrens is Ownable {
    IVerificationsV4Reader public verificationsV4Reader;
    uint256 public maxTopFrens = 8;

    mapping(uint256 fid => uint256[] topFrenFids) public topFrens;

    mapping(uint256 topFrenFid => uint256[] userFids) private reverseLookup;

    event TopFrenAdded(uint256 indexed userFid, uint256 indexed topFrenFid);
    event TopFrenRemoved(uint256 indexed userFid, uint256 indexed topFrenFid);
    event AllTopFrensRemoved(uint256 indexed userFid);
    event MaxTopFrensUpdated(uint256 newMaxTopFrens);

    error NotAuthorized();
    error MaxTopFrensReached();

    constructor(address _verificationsV4Reader) Ownable(msg.sender) {
        verificationsV4Reader = IVerificationsV4Reader(_verificationsV4Reader);
    }

    function addTopFrenByAddress(address user, address topFren) public {
        uint256 userFid = verificationsV4Reader.getFid(user);
        uint256 topFrenFid = verificationsV4Reader.getFid(topFren);
        _addTopFren(userFid, topFrenFid);
    }

    function addTopFrenByFid(uint256 userFid, uint256 topFrenFid) public {
        _addTopFren(userFid, topFrenFid);
    }

    function addTopFrenByAddressAndFid(address user, uint256 topFrenFid) public {
        uint256 userFid = verificationsV4Reader.getFid(user);
        _addTopFren(userFid, topFrenFid);
    }

    function addTopFrenByFidAndAddress(uint256 userFid, address topFren) public {
        uint256 topFrenFid = verificationsV4Reader.getFid(topFren);
        _addTopFren(userFid, topFrenFid);
    }

    function _addTopFren(uint256 userFid, uint256 topFrenFid) internal {
        if (msg.sender != owner() && verificationsV4Reader.getFid(msg.sender) != userFid) {
            revert NotAuthorized();
        }
        if (topFrens[userFid].length >= maxTopFrens) {
            revert MaxTopFrensReached();
        }
        topFrens[userFid].push(topFrenFid);
        reverseLookup[topFrenFid].push(userFid);
        emit TopFrenAdded(userFid, topFrenFid);
    }

    function addTopFrensByAddress(address user, address[] calldata topFrensToAdd) public {
        uint256 userFid = verificationsV4Reader.getFid(user);
        uint256[] memory topFrenFids = new uint256[](topFrensToAdd.length);
        for (uint256 i = 0; i < topFrensToAdd.length; i++) {
            topFrenFids[i] = verificationsV4Reader.getFid(topFrensToAdd[i]);
        }
        _addTopFrens(userFid, topFrenFids);
    }

    function addTopFrensByFid(uint256 userFid, uint256[] calldata topFrenFids) public {
        _addTopFrens(userFid, topFrenFids);
    }

    function _addTopFrens(uint256 userFid, uint256[] memory topFrenFids) internal {
        if (msg.sender != owner() && verificationsV4Reader.getFid(msg.sender) != userFid) {
            revert NotAuthorized();
        }
        if (topFrens[userFid].length + topFrenFids.length > maxTopFrens) {
            revert MaxTopFrensReached();
        }
        for (uint256 i = 0; i < topFrenFids.length; i++) {
            topFrens[userFid].push(topFrenFids[i]);
            emit TopFrenAdded(userFid, topFrenFids[i]);
        }
    }

    function removeTopFrenByAddress(address user, address topFren) public {
        uint256 userFid = verificationsV4Reader.getFid(user);
        uint256 topFrenFid = verificationsV4Reader.getFid(topFren);
        _removeTopFren(userFid, topFrenFid);
    }

    function removeTopFrenByFid(uint256 userFid, uint256 topFrenFid) public {
        _removeTopFren(userFid, topFrenFid);
    }

    function removeTopFrenByAddressAndFid(address user, uint256 topFrenFid) public {
        uint256 userFid = verificationsV4Reader.getFid(user);
        _removeTopFren(userFid, topFrenFid);
    }

    function removeTopFrenByFidAndAddress(uint256 userFid, address topFren) public {
        uint256 topFrenFid = verificationsV4Reader.getFid(topFren);
        _removeTopFren(userFid, topFrenFid);
    }

    function _removeTopFren(uint256 userFid, uint256 topFrenFid) internal {
        if (msg.sender != owner() && verificationsV4Reader.getFid(msg.sender) != userFid) {
            revert NotAuthorized();
        }
        uint256[] storage userTopFrens = topFrens[userFid];
        for (uint256 i = 0; i < userTopFrens.length; i++) {
            if (userTopFrens[i] == topFrenFid) {
                userTopFrens[i] = userTopFrens[userTopFrens.length - 1];
                userTopFrens.pop();
                _removeFromReverseLookup(userFid, topFrenFid);
                emit TopFrenRemoved(userFid, topFrenFid);
                return;
            }
        }
    }

    function _removeFromReverseLookup(uint256 userFid, uint256 topFrenFid) private {
        uint256[] storage users = reverseLookup[topFrenFid];
        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] == userFid) {
                users[i] = users[users.length - 1];
                users.pop();
                break;
            }
        }
    }

    function removeTopFrensByAddress(address user, address[] calldata topFrensToRemove) public {
        uint256 userFid = verificationsV4Reader.getFid(user);
        uint256[] memory topFrenFids = new uint256[](topFrensToRemove.length);
        for (uint256 i = 0; i < topFrensToRemove.length; i++) {
            topFrenFids[i] = verificationsV4Reader.getFid(topFrensToRemove[i]);
        }
        _removeTopFrens(userFid, topFrenFids);
    }

    function removeTopFrensByFid(uint256 userFid, uint256[] calldata topFrenFids) public {
        _removeTopFrens(userFid, topFrenFids);
    }

    function removeTopFrensByAddressAndFids(address user, uint256[] calldata topFrenFids) public {
        uint256 userFid = verificationsV4Reader.getFid(user);
        _removeTopFrens(userFid, topFrenFids);
    }

    function _removeTopFrens(uint256 userFid, uint256[] memory topFrenFids) internal {
        if (msg.sender != owner() && verificationsV4Reader.getFid(msg.sender) != userFid) {
            revert NotAuthorized();
        }
        uint256[] storage userTopFrens = topFrens[userFid];
        for (uint256 i = 0; i < topFrenFids.length; i++) {
            for (uint256 j = 0; j < userTopFrens.length; j++) {
                if (userTopFrens[j] == topFrenFids[i]) {
                    userTopFrens[j] = userTopFrens[userTopFrens.length - 1];
                    userTopFrens.pop();
                    emit TopFrenRemoved(userFid, topFrenFids[i]);
                    break;
                }
            }
        }
    }

    function removeAllTopFrensByAddress(address user) public {
        uint256 userFid = verificationsV4Reader.getFid(user);
        _removeAllTopFrens(userFid);
    }

    function removeAllTopFrensByFid(uint256 userFid) public {
        _removeAllTopFrens(userFid);
    }

    function _removeAllTopFrens(uint256 userFid) internal {
        if (msg.sender != owner() && verificationsV4Reader.getFid(msg.sender) != userFid) {
            revert NotAuthorized();
        }
        uint256[] memory userTopFrens = topFrens[userFid];
        for (uint256 i = 0; i < userTopFrens.length; i++) {
            _removeFromReverseLookup(userFid, userTopFrens[i]);
        }
        delete topFrens[userFid];
        emit AllTopFrensRemoved(userFid);
    }

    function getTopFrensFidsByFid(uint256 fid) public view returns (uint256[] memory) {
        return topFrens[fid];
    }

    function getTopFrensFidsByAddress(address user) public view returns (uint256[] memory) {
        uint256 userFid = verificationsV4Reader.getFid(user);
        return topFrens[userFid];
    }

    function setMaxTopFrens(uint256 _maxTopFrens) public onlyOwner {
        maxTopFrens = _maxTopFrens;
        emit MaxTopFrensUpdated(_maxTopFrens);
    }

    function getFid(address verifier) public view returns (uint256 fid) {
        return verificationsV4Reader.getFid(verifier);
    }

    function getFidWithEvent(address verifier) public returns (uint256 fid) {
        return verificationsV4Reader.getFidWithEvent(verifier);
    }

    function getFids(address[] calldata verifiers) public view returns (uint256[] memory fid) {
        return verificationsV4Reader.getFids(verifiers);
    }

    function getTopFrenListers(address topFren) public view returns (uint256[] memory) {
        uint256 topFrenFid = verificationsV4Reader.getFid(topFren);
        return reverseLookup[topFrenFid];
    }

    function getTopFrenListersByFid(uint256 topFrenFid) public view returns (uint256[] memory) {
        return reverseLookup[topFrenFid];
    }
}
