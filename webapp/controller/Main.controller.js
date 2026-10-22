sap.ui.define([
    "./BaseController", 
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("sapui5task2.controller.Main", {
        onInit() {
            const oData = {
                Books: [
                    { ID: "B1001", Name: "Eloquent JavaScript", Author: "Marijn", Genre: "Programming", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 15, editMode: false },
                    { ID: "B1002", Name: "Thinking, Fast and Slow", Author: "Daniel", Genre: "Psychology", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 8, editMode: false },
                    { ID: "B1003", Name: "Mathematical Analysis", Author: "Rudin", Genre: "Mathematics", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 22, editMode: false },
                    { ID: "B1004", Name: "Topology", Author: "James Munkres", Genre: "Philosophy", ReleaseDate: new Date("1988-01-01T00:00:00"), AvailableQuantity: 5, editMode: false },
                    { ID: "B1005", Name: "Silo: Wool", Author: "Hugh Howey", Genre: "Sci-Fi", ReleaseDate: new Date("2011-07-25T00:00:00"), AvailableQuantity: 30, editMode: false }
                ]
            };

            // Extract unique genres for the Select (Filter) control
            const aGenres = [...new Set(oData.Books.map(book => book.Genre))].map(genre => {
                return { key: genre, text: genre };
            });
            aGenres.unshift({ key: "", text: "All Genres" }); // Default "All Genres" option
            oData.Genres = aGenres;

            const oModel = new JSONModel(oData);
            // Set the model using the BaseController method
            this.setModel(oModel);
        },

        onAddRecord() {
            const oModel = this.getModel();
            const aBooks = oModel.getProperty("/Books");
            
            // Add a new empty record with editMode set to false
            aBooks.push({
                ID: "", 
                Name: "", 
                Author: "", 
                Genre: "", 
                ReleaseDate: null, 
                AvailableQuantity: 0,
                editMode: false
            });
            
            oModel.setProperty("/Books", aBooks);
        },

        onDeleteRecord() {
            const oTable = this.byId("booksTable");
            const aSelectedContexts = oTable.getSelectedContexts();
            
            if (aSelectedContexts.length === 0) {
                return;
            }

            const oModel = this.getModel();
            const aBooks = oModel.getProperty("/Books");
            
            // Extract indices of selected records and sort in descending order to prevent index shifting during deletion
            const aIndices = aSelectedContexts.map(oContext => {
                return parseInt(oContext.getPath().split("/").pop(), 10);
            }).sort((a, b) => b - a);
            
            aIndices.forEach(iIndex => {
                aBooks.splice(iIndex, 1);
            });
            
            oModel.setProperty("/Books", aBooks);
            oTable.removeSelections(true);
        },

        onFilter() {
            const sTitleQuery = this.byId("titleInput").getValue();
            const sGenreQuery = this.byId("genreSelect").getSelectedKey();
            const aFilters = [];

            if (sTitleQuery) {
                aFilters.push(new Filter("Name", FilterOperator.Contains, sTitleQuery));
            }
            
            if (sGenreQuery) {
                aFilters.push(new Filter("Genre", FilterOperator.EQ, sGenreQuery));
            }

            const oTable = this.byId("booksTable");
            const oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },

        // Enable edit mode for the specific row where the button was pressed
        onEditTitle(oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            this.getModel().setProperty(oContext.getPath() + "/editMode", true);
        },

        // Save changes and switch the row back to display mode
        onSaveTitle(oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            this.getModel().setProperty(oContext.getPath() + "/editMode", false);
        }
    });
});