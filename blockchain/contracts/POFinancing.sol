// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract POFinancing {
    enum POStatus { Created, Financed, Delivered, Closed }

    struct PurchaseOrder {
        uint256 id;
        address buyer;
        address vendor;
        uint256 amount;
        uint256 deliveryDate;
        string goodsCategory;
        POStatus status;
    }

    uint256 public poCount;
    mapping(uint256 => PurchaseOrder) public purchaseOrders;

    event PurchaseOrderCreated(uint256 indexed poId, address indexed buyer, address indexed vendor, uint256 amount);
    event LoanRequested(uint256 indexed poId, address indexed vendor, uint256 amount);
    event PurchaseOrderDelivered(uint256 indexed poId);
    event POClose(uint256 indexed poId);

    function createPurchaseOrder(
        address _vendor,
        uint256 _amount,
        uint256 _deliveryDate,
        string memory _goodsCategory
    ) external returns (uint256) {
        poCount++;
        purchaseOrders[poCount] = PurchaseOrder({
            id: poCount,
            buyer: msg.sender,
            vendor: _vendor,
            amount: _amount,
            deliveryDate: _deliveryDate,
            goodsCategory: _goodsCategory,
            status: POStatus.Created
        });

        emit PurchaseOrderCreated(poCount, msg.sender, _vendor, _amount);
        return poCount;
    }

    function requestLoan(uint256 _poId) external {
        PurchaseOrder storage po = purchaseOrders[_poId];
        require(msg.sender == po.vendor, "Only vendor can request loan");
        require(po.status == POStatus.Created, "PO must be in Created status");

        emit LoanRequested(_poId, po.vendor, po.amount);
    }

    function markDelivered(uint256 _poId) external {
        PurchaseOrder storage po = purchaseOrders[_poId];
        require(msg.sender == po.buyer, "Only buyer can mark delivered");
        require(po.status == POStatus.Financed || po.status == POStatus.Created, "Invalid status");

        po.status = POStatus.Delivered;
        emit PurchaseOrderDelivered(_poId);
    }

    function markFinanced(uint256 _poId) external {
        // In a real app, this would be restricted to the lender or the backend wallet
        PurchaseOrder storage po = purchaseOrders[_poId];
        po.status = POStatus.Financed;
    }

    function closePO(uint256 _poId) external {
        PurchaseOrder storage po = purchaseOrders[_poId];
        po.status = POStatus.Closed;
        emit POClose(_poId);
    }

    function getPurchaseOrder(uint256 _poId) external view returns (PurchaseOrder memory) {
        return purchaseOrders[_poId];
    }
}
