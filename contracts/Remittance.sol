pragma solidity ^0.4.20;
import "./Owned.sol";

contract Remittance is Owned {
    address public exchAddr;
    address public solver;
    bytes32 public puzzleSolution;
    bool public releaseFund;
    
    event RemittanceCreated(address by, address exch, uint256 amount);
    event PuzzleSolved(address by);
    event FundWithdrawn(address by, uint256 amount);

    function createRemittance(address exch, bytes32 data) public payable ownerOnly {
        exchAddr = exch;
        puzzleSolution = data;
        emit RemittanceCreated(owner, exchAddr, msg.value);
    }
    
    function solvePuzzle(string puzzleInput) public {
        require(msg.sender == exchAddr);
        bytes32 candidateSolution = keccak256(abi.encodePacked(puzzleInput));
        if (keccak256(abi.encodePacked(puzzleSolution)) 
            == keccak256(abi.encodePacked(candidateSolution))) {
            solver = exchAddr;
            releaseFund = true;
            emit PuzzleSolved(solver);
        }
    }
    
    function withdrawFund() public {
        require(msg.sender == solver);
        require(releaseFund == true);

        releaseFund = false;
        exchAddr = 0;
        solver = 0;

        uint256 amount = address(this).balance;
        msg.sender.transfer(amount);
        emit FundWithdrawn(msg.sender, amount);
    }
}
