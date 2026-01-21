export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const ABI = [
    "function createPurchaseOrder(address _vendor, uint256 _amount, uint256 _deliveryDate, string memory _goodsCategory) external returns (uint256)",
    "function requestLoan(uint256 _poId) external",
    "function markDelivered(uint256 _poId) external",
    "function markFinanced(uint256 _poId) external",
    "function closePO(uint256 _poId) external",
    "function purchaseOrders(uint256) public view returns (uint256 id, address buyer, address vendor, uint256 amount, uint256 deliveryDate, string goodsCategory, uint8 status)",
    "function poCount() public view returns (uint256)"
];
