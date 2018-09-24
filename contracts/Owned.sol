pragma solidity ^0.4.20;

contract Owned {
    address public owner;
    
    constructor() public {
        owner = msg.sender;    
    }
    
    modifier ownerOnly {
        require(msg.sender == owner);
        _;
    }
}
