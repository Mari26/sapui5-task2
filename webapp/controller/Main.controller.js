sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("sapui5task2.controller.Main", {
        onInit() {
            const oData = {
                Books: [
                    { ID: "B1001", Name: "Eloquent JavaScript", Author: "Marijn Haverbeke", Genre: "Programming", ReleaseDate: "2018-12-04", AvailableQuantity: 15 },
                    { ID: "B1002", Name: "Thinking, Fast and Slow", Author: "Daniel Kahneman", Genre: "Psychology", ReleaseDate: "2011-10-25", AvailableQuantity: 8 },
                    { ID: "B1003", Name: "Principles of Mathematical Analysis", Author: "Baby Rudin", Genre: "Mathematics", ReleaseDate: "1985-01-01", AvailableQuantity: 22 },
                    { ID: "B1004", Name: "Topology ", Author: "James Munkres", Genre: "Philosophy", ReleaseDate: "1988-01-01", AvailableQuantity: 5 },
                    { ID: "B1005", Name: "Silo: Wool", Author: "Hugh Howey", Genre: "Sci-Fi", ReleaseDate: "2011-07-25", AvailableQuantity: 30 }
                ]
         
             };

            const oModel = new JSONModel(oData);
            this.getView().setModel(oModel);
          }
    });
});