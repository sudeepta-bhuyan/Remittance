pragma solidity ^0.4.20;
import './Pausable.sol';

contract Remittance is Pausable {
    
    struct Request {
        address sender;
        address receiver;
        uint256 amount;
        bytes32 puzzleSolution;
        string notAfter; //Not used
        bool fundReleased;
    }
    mapping(uint256 => Request) requests;
    uint256 numRequests;
    
    event RemittanceRequestCreated(address from, address to, uint256 amount);
    event RemittanceClaimed(address by, uint256 amount);

    function submitRemittanceRequest(address exch, bytes32 data, string date) public payable onlyIfRunning returns (uint256 requestID) {
        requestID = numRequests++;
        requests[requestID] = Request(msg.sender, exch, msg.value, data, date, false);
        emit RemittanceRequestCreated(msg.sender, exch, msg.value);
    }
    
    function claimRemittance(uint256 requestId, string puzzleInput) public onlyIfRunning {
        Request storage req = requests[requestId];
        require(req.fundReleased == false);
        require(msg.sender == req.receiver);
        
        bytes32 candidateSolution = keccak256(abi.encodePacked(puzzleInput));
        require(req.puzzleSolution == candidateSolution);
        req.fundReleased = true;
        
        emit RemittanceClaimed(msg.sender, req.amount);
        msg.sender.transfer(req.amount);
    }
    
}
