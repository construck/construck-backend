const mongoose = require("mongoose");
const moment = require('moment')

const maintenanceLogsSchema = new mongoose.Schema({
    jobCard_Id: {
        type: String
    },
    entryDate: {
        type: Date,
        default: moment()
    },
    driver: {
        type: Object
    },
    plate: {
        type: Object
    },
    mileage: {
        type: String
    },
    location: {
        type: Object
    },
    startRepair: {
        type: Date
    },
    endRepair: {
        type: Date
    },
    inspectionTools: {
        type: [String],

    },
    mechanicalInspections: {
        type: [String]
    },
    assignIssue: {
        type: [Object]
    },
    operator: {
        type: String
    },
    status: {
        type: String,
        default: 'entry'
    },
    transferData: {
        type: [Object]
    },
    inventoryData: {
        type: [[Object]]
    },
    inventoryItems: {
        type: [Object]
    },
    teamApproval: {
        type: Boolean,
        default: false
    },
    supervisorApproval: {
        type: Boolean,
        default: false
    },
    sourceItem: {
        type: String
    },
    operatorApproval: {
        type: [String]
    },
    transferParts: {
        type: [String]
    },
    isViewed: {
        type: String,
        default: 'not viewed'
    },
    reason: {
        type: String,
        default: ''
    },
    jobCard_status: {
        type: String,
        default: 'opened'
    },
    updated_At: {
        type: Date,
        default: moment()
    },
    operatorNotApplicable: {
        type: Boolean
    },
    mileagesNotApplicable: {
        type: Boolean
    },
    requestParts: {
        type: Date
    },
    receivedParts: {
        type: Date
    }
});

const MaintenanceLogs = mongoose.model('MaintenanceLogs', maintenanceLogsSchema);

exports.MaintenanceLogs = MaintenanceLogs;
exports.maintenanceLogsSchema = maintenanceLogsSchema;