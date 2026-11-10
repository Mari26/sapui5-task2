sap.ui.define([
    "./BaseController",
    "sap/ui/core/routing/History"
], function (BaseController, History) {
    "use strict";

    return BaseController.extend("sapui5task2.controller.Product", {
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("RouteProduct").attachPatternMatched(this._onProductMatched, this);
        },

        _onProductMatched(oEvent) {
            const sProductId = oEvent.getParameter("arguments").ProductID;
            // Bind the view to the product data based on the ProductID
        },

        onNavBack() {
            const sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteTab", {
                    tabKey: "odataV2"
                }, true);
            }
        }
    });
});