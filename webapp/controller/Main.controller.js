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
                    { ID: "B1001", Name: "Eloquent JavaScript", Author: "Marijn Haverbeke", Genre: "Programming", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 15 },
                    { ID: "B1002", Name: "Thinking, Fast and Slow", Author: "Daniel Kahneman", Genre: "Psychology", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 8 },
                    { ID: "B1003", Name: "Principles of Mathematical Analysis", Author: "Baby Rudin", Genre: "Mathematics", ReleaseDate: new Date("2018-12-04T00:00:00"), AvailableQuantity: 22 },
                    { ID: "B1004", Name: "Topology", Author: "James Munkres", Genre: "Philosophy", ReleaseDate: new Date("1988-01-01T00:00:00"), AvailableQuantity: 5 },
                    { ID: "B1005", Name: "Silo: Wool", Author: "Hugh Howey", Genre: "Sci-Fi", ReleaseDate: new Date("2011-07-25T00:00:00"), AvailableQuantity: 30 }
                ]
            };

            // Read "All Genres" text from i18n resource bundle
            const oBundle = this.getResourceBundle();
            const sAllGenresText = oBundle.getText("allGenres");

            // Extract unique genres for the Select (Filter) control
            const aGenres = [...new Set(oData.Books.map(book => book.Genre))].map(genre => {
                return { key: genre, text: genre };
            });
            aGenres.unshift({ key: "", text: sAllGenresText });
            oData.Genres = aGenres;

            const oModel = new JSONModel(oData);
            this.setModel(oModel);
        },

        onAddRecord() {
            const oModel = this.getModel();
            const aBooks = oModel.getProperty("/Books");
            
            aBooks.push({
                ID: "", 
                Name: "", 
                Author: "", 
                Genre: "", 
                ReleaseDate: null, 
                AvailableQuantity: 0
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
        }
    });
});