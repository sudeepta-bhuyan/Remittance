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
    mapping(uint256 => Request) public requests;
    uint256 public numRequests;
    mapping(bytes32 => bool) public usedSolutions;
    
    event RemittanceRequestCreated(uint256 requestID, address indexed from, address indexed to, uint256 amount);
    event RemittanceClaimed(uint256 requestID, address indexed by, uint256 amount);

    function submitRemittanceRequest(address exch, bytes32 userData, string date)
        public payable onlyIfRunning returns (uint256 requestID) {

        require(!usedSolutions[userData]);
        usedSolutions[userData] = true;

        requestID = numRequests++;
        requests[requestID] = Request(msg.sender, exch, msg.value, userData, date, false);
        emit RemittanceRequestCreated(requestID, msg.sender, exch, msg.value);
    }
    
    function claimRemittance(uint256 requestId, string puzzleInput) public onlyIfRunning {
        Request storage req = requests[requestId];
        require(!req.fundReleased);
        require(msg.sender == req.receiver);
        
        bytes32 candidateSolution = keccak256(abi.encodePacked(puzzleInput));
        require(req.puzzleSolution == candidateSolution);
        req.fundReleased = true;
        
        emit RemittanceClaimed(requestId, msg.sender, req.amount);
        uint256 amount = req.amount;
        req.amount = 0;
        msg.sender.transfer(amount);
    }
}
