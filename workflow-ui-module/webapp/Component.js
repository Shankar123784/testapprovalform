sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "workflowuimodule/model/models",
  ],
  function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend(
      "workflowuimodule.Component",
      {
        metadata: {
          manifest: "json",
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
          // call the base component's init function
          UIComponent.prototype.init.apply(this, arguments);

          // call the backend OData Serviec
          var oModel = this.getModel().sServiceUrl;
          jQuery.ajax({
            url: oModel + "Materials",
            method: "GET",
            contentType: "application/json",
            success: function (data, textStatus, jqXHR) {
              console.log(data)
              this.getModel("LocalModel").setProperty("/Materials", data.value);

            }.bind(this),
            error: function (jqXHR, textStatus, errorThrown) {
              console.log(errorThrown);
              sap.m.MessageToast(errorThrown);
              // reject(errorThrown);
              // MessageBox.error("Error uploading file." + error);
            }
          });

          // enable routing
          this.getRouter().initialize();

          // set the device model
          this.setModel(models.createDeviceModel(), "device");

          this.setTaskModels();

          this.getInboxAPI().addAction(
            {
              action: "APPROVE",
              label: "Approve",
              type: "accept", // (Optional property) Define for positive appearance
            },
            function () {
              this.completeTask(true, "approve");
            },
            this
          );
          this.getInboxAPI().addAction(
            {
              action: "SENDBACK",
              label: "Send Back",
              type: "Emphasized"
            },
            function () {
              this.completeTask(true)
            },
            this
          )
          this.getInboxAPI().addAction(
            {
              action: "REJECT",
              label: "Reject",
              type: "reject", // (Optional property) Define for negative appearance
            },
            function () {
              this.completeTask(false, "reject");
            },
            this
          );

          this.getInboxAPI().addAction(
            {
              action: "HOLD",
              label: "Hold",
              // type: "", // (Optional property) Define for negative appearance
            },
            function () {
              this.completeTask(false);
            },
            this
          );
          this.getInboxAPI().addAction(
            {
              action: "VIEW",
              label: "View MDN Item",
              // type: "", // (Optional property) Define for negative appearance
            },
            function () {
              this.completeTask(false);
            },
            this
          );
          this.getInboxAPI().addAction(
            {
              action: "VIEWATT",
              label: "View Attachment",
              // type: "", // (Optional property) Define for negative appearance
            },
            function () {
              this.completeTask(false);
            },
            this
          );
          this.getInboxAPI().addAction(
            {
              action: "APPROVE",
              label: "Special Approval",
              // type: "", // (Optional property) Define for negative appearance
            },
            function () {
              this.completeTask(false);
            },
            this
          );
        },


        setTaskModels: function () {
          // set the task model
          var startupParameters = this.getComponentData().startupParameters;
          this.setModel(startupParameters.taskModel, "task");

          // set the task context model
          var taskContextModel = new sap.ui.model.json.JSONModel(
            this._getTaskInstancesBaseURL() + "/context"
          );
          this.setModel(taskContextModel, "context");
        },

        _getTaskInstancesBaseURL: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            this.getTaskInstanceID()
          );
        },

        _getWorkflowRuntimeBaseURL: function () {
          var appId = this.getManifestEntry("/sap.app/id");
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = jQuery.sap.getModulePath(appPath);

          return appModulePath + "/bpmworkflowruntime/v1";
        },

        getTaskInstanceID: function () {
          return this.getModel("task").getData().InstanceID;
        },

        getInboxAPI: function () {
          var startupParameters = this.getComponentData().startupParameters;
          return startupParameters.inboxAPI;
        },

        completeTask: function (approvalStatus, status) {
          this.getModel("context").setProperty("/approved", approvalStatus);
          this._patchTaskInstance(status);
          this._refreshTaskList();
        },

        _patchTaskInstance: function (status) {
          var data = {
            status: "COMPLETED",
            // status: "SUSPENDED", 
            decision: status,
            context: this.getModel("context").getData(),
          };

          jQuery.ajax({
            url: this._getTaskInstancesBaseURL(),
            method: "PATCH",
            contentType: "application/json",
            async: false,
            data: JSON.stringify(data),
            headers: {
              "X-CSRF-Token": this._fetchToken(),
            },
          });
        },

        _fetchToken: function () {
          var fetchedToken;

          jQuery.ajax({
            url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
            method: "GET",
            async: false,
            headers: {
              "X-CSRF-Token": "Fetch",
            },
            success(result, xhr, data) {
              fetchedToken = data.getResponseHeader("X-CSRF-Token");
            },
          });
          return fetchedToken;
        },

        _refreshTaskList: function () {
          this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());
        },
        // getMaterialDetails: function () {

        // }
      }
    );
  }
);
