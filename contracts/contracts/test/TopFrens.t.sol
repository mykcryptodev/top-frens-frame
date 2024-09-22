// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.27;

import {VerificationsV4} from "../src/VerificationsV4.sol";
import {TopFrens} from "../src/TopFrens.sol";
import {Test} from "forge-std/Test.sol";

contract TopFrensTest is Test {
    VerificationsV4 public verificationsV4;
    TopFrens public topFrens;

    address public owner;
    address public user1;
    address public user2;
    address public user3;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);

        verificationsV4 = new VerificationsV4();
        vm.prank(owner);
        topFrens = new TopFrens(address(verificationsV4));

        // Set up some FIDs
        verificationsV4.setVerification(user1, 1);
        verificationsV4.setVerification(user2, 2);
        verificationsV4.setVerification(user3, 3);
    }

    function test_addTopFrenByAddress() public {
        vm.prank(user1);
        topFrens.addTopFrenByAddress(user1, user2);
        
        uint256[] memory frens = topFrens.getTopFrensFidsByAddress(user1);
        assertEq(frens.length, 1);
        assertEq(frens[0], 2);
    }

    function test_addTopFrenByFid() public {
        vm.prank(user1);
        topFrens.addTopFrenByFid(1, 2);
        
        uint256[] memory frens = topFrens.getTopFrensFidsByFid(1);
        assertEq(frens.length, 1);
        assertEq(frens[0], 2);
    }

    function test_addTopFrensByAddress() public {
        address[] memory frensToAdd = new address[](2);
        frensToAdd[0] = user2;
        frensToAdd[1] = user3;

        vm.prank(user1);
        topFrens.addTopFrensByAddress(user1, frensToAdd);
        
        uint256[] memory frens = topFrens.getTopFrensFidsByAddress(user1);
        assertEq(frens.length, 2);
        assertEq(frens[0], 2);
        assertEq(frens[1], 3);
    }

    function test_removeTopFrenByAddress() public {
        vm.startPrank(user1);
        topFrens.addTopFrenByAddress(user1, user2);
        topFrens.addTopFrenByAddress(user1, user3);
        topFrens.removeTopFrenByAddress(user1, user2);
        vm.stopPrank();
        
        uint256[] memory frens = topFrens.getTopFrensFidsByAddress(user1);
        assertEq(frens.length, 1);
        assertEq(frens[0], 3);
    }

    function test_removeTopFrensByFid() public {
        vm.startPrank(user1);
        topFrens.addTopFrenByFid(1, 2);
        topFrens.addTopFrenByFid(1, 3);
        
        uint256[] memory frensToRemove = new uint256[](1);
        frensToRemove[0] = 2;
        topFrens.removeTopFrensByFid(1, frensToRemove);
        vm.stopPrank();
        
        uint256[] memory frens = topFrens.getTopFrensFidsByFid(1);
        assertEq(frens.length, 1);
        assertEq(frens[0], 3);
    }

    function test_removeAllTopFrensByAddresses() public {
        vm.startPrank(user1);
        topFrens.addTopFrenByAddress(user1, user2);
        topFrens.addTopFrenByAddress(user1, user3);
        topFrens.removeAllTopFrensByAddresses(user1);
        vm.stopPrank();
        
        uint256[] memory frens = topFrens.getTopFrensFidsByAddress(user1);
        assertEq(frens.length, 0);
    }

    function test_setMaxTopFrens() public {
        topFrens.setMaxTopFrens(10);
        assertEq(topFrens.maxTopFrens(), 10);
    }

    function test_getTopFrenListers() public {
        vm.prank(user1);
        topFrens.addTopFrenByAddress(user1, user2);
        
        vm.prank(user3);
        topFrens.addTopFrenByAddress(user3, user2);
        
        uint256[] memory listers = topFrens.getTopFrenListers(user2);
        assertEq(listers.length, 2);
        assertEq(listers[0], 1);
        assertEq(listers[1], 3);
    }

    function test_maxTopFrensReached() public {
        // Set max top frens to 2
        topFrens.setMaxTopFrens(2);

        vm.startPrank(user1);
        topFrens.addTopFrenByFid(1, 2);
        topFrens.addTopFrenByFid(1, 3);
        
        // This should revert
        vm.expectRevert(TopFrens.MaxTopFrensReached.selector);
        topFrens.addTopFrenByFid(1, 4);
        vm.stopPrank();
    }

    function test_notAuthorized() public {
        vm.prank(user2);
        vm.expectRevert(TopFrens.NotAuthorized.selector);
        topFrens.addTopFrenByFid(1, 2);
    }

    function test_onlyOwnerCanSetMaxTopFrens() public {
        vm.prank(user1);
        vm.expectRevert();
        topFrens.setMaxTopFrens(10);
    }
}
