const { MaintenanceLogs } = require('../models/maintenanceLog');
const moment = require('moment');
const express = require('express');
const router = express.Router();

router.get('/maintenance/repair', async(req, res) => {
    const jobCards = await MaintenanceLogs.find();
    if(!jobCards) return res.status(404).json({message: 'No JobCards Available'});

    res.status(200).send(jobCards);
})

router.get('/maintenance/logs', async(req, res) => {
    const jobCards = await MaintenanceLogs.find().sort({jobCard_Id: -1});
    if(!jobCards) return res.status(404).json({message: 'No JobCards Available'});

    res.status(200).send(jobCards);
})

router.post('/maintenance/logs', async (req, res) => {
    const {
        entryDate,
        driver,
        carPlate,
        mileages,
        location,
        status
    } = req.body.payload;

    const jobCards = await MaintenanceLogs.find();
    
    // Checking if it's still in the repair mode
    const stillInRepair = jobCards.find((item) => {
        if((item.plate.value == carPlate.value && item.status == 'Checking'))
            return item;
    })

    if(stillInRepair) return res.status(400).json({message: 'The equipment is still in repair or Issues with Mileages'})

    const lowMileages = jobCards.find(item => ((item.plate.value == carPlate.value) && item.mileage > mileages) && item)
    if((mileages && mileages.length > 0) && lowMileages) return res.status(400).json({message: 'Mileages input are low to the previous'})

    // Saving the Job Card
    const jobCard = new MaintenanceLogs({
        jobCard_Id: 
            ((jobCards.length + 1) < 10 
            ? `000${jobCards.length + 1}` 
            :  (jobCards.length + 1) < 100
            ? `00${jobCards.length + 1}`
            : (jobCards.length + 1) < 1000
            ? `0${jobCards.length + 1}`
            : `${jobCards.length + 1}`)
            + '-' 
            + ((new Date).getUTCMonth() < 10 ? `0${(new Date).getMonth() + 1}` : (new Date).getUTCMonth()) 
            + '-'
            + ((new Date).getFullYear()).toString().substr(2)
        ,
        entryDate,
        driver,
        plate: carPlate,
        mileage: mileages,
        location,
        status,
        jobCard_status: 'opened'
    })

    await jobCard.save();

    return res.status(200).send(jobCard);
})

router.put('/maintenance/logs/:id', async (req, res) => {
    console.log('Req Params ', req.params);
    const {
        jobCard_id,
        entryDate,
        driver,
        plate,
        mileages,
        location,
        startRepair,
        endRepair,
        status,
        inspectionTools,
        mechanicalInspections,
        assignIssue,
        operator,
        sourceItem,
        operatorApproval,
        supervisorApproval,
        inventoryItems,
        inventoryData,
        transferData,
        teamApproval,
        transferParts,
        isViewed,
        reason,
        operatorNotApplicable,
        mileagesNotApplicable,
        requestParts,
        receivedParts
    } = req.body.payload;

    const jobCard = await MaintenanceLogs.findOneAndUpdate({jobCard_Id: req.params.id}, {
        jobCard_Id: jobCard_id,
        entryDate,
        driver,
        plate,
        mileage: mileages,
        location,
        startRepair,
        endRepair: supervisorApproval == true ? moment() : '',
        status: supervisorApproval == true ? 'pass' : (sourceItem == 'No Parts Required' && status == 'repair') ? 'repair' : status,
        inspectionTools,
        mechanicalInspections,
        assignIssue,
        operator,
        transferData,
        inventoryData,
        inventoryItems,
        sourceItem,
        operatorApproval,
        teamApproval,
        transferParts,
        isViewed,
        reason,
        jobCard_status: supervisorApproval == true ? 'closed' : 'opened',
        updated_At: moment(),
        operatorNotApplicable,
        mileagesNotApplicable,
        requestParts,
        receivedParts
    }, {new: true});

    if(!jobCard)
        return res.status(404).send('The Job Card with the given ID was not found');

    await jobCard.save()
    
    return res.status(200).send(jobCard);
})

module.exports = router;