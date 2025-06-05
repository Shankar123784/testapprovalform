sap.ui.define(
  [
    "sap/ui/core/mvc/Controller"
  ],
  function (BaseController) {
    "use strict";

    return BaseController.extend("workflowuimodule.controller.App", {
      onInit() {
        this.oModel = this.getOwnerComponent().getModel();
        this.getMaterialDetails();
      },
      getMaterialDetails: function () {
        var oListBinding = this.oModel.bindList("/MDN", null, null, null, null);

        oListBinding.requestContexts(0, 100).then(function (aContexts) {
            var aData = aContexts.map(function (oContext) {
                return oContext.getObject();
            });
            this.getOwnerComponent().getModel("LocalModel").setProperty("/MDN", aData[0])
            // Handle filtered data
        }.bind(this)).catch(function (oError) {
            console.error("Error reading filtered data:", oError);
        });
      }
    });
  }
);
