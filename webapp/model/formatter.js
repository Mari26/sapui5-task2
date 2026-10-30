sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Formats a Date object to display "Published: {Year}"
         * @param {Date|string} vDate - The release date from the model
         * @returns {string} Formatted string with the publication year
         */
        formatReleaseYear(vDate) {
            if (!vDate) {
                return "";
            }

            const oDate = vDate instanceof Date ? vDate : new Date(vDate);
            if (isNaN(oDate.getTime())) {
                return "";
            }

            const iYear = oDate.getFullYear();
            const oResourceBundle = this.getResourceBundle();

            return oResourceBundle.getText("publishedYearText", [iYear]);
        }
    };
});