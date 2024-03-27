const express = require('express');
const { Mechanics } = require('../models/mechanic');
const router = express.Router();

router.get('/mechanics', async (req, res) => {
    const pageSize = 15;
    const currentPage = +req.query.page;

    const totalMechanics = await Mechanics.find();
    const mechanicsQuery = Mechanics.find();

    if (pageSize && currentPage)
        mechanicsQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);

    const mechanics = await mechanicsQuery;
    if(!mechanics) return res.status(404).json({message: "No Mechanics Found"});

    res.status(200).send({mechanics, totalMechanics})
})

router.post('/mechanics', async (req, res) => {
    const { 
        firstName,
        lastName,
        title,
        contactNumber
    } = req.body.payload;

    let mechanicId = await Mechanics.find();
    if(!mechanicId) return res.status(404).json({message: "No Mechanics Found"});

    const mechanics = new Mechanics({
        '# ': mechanicId.length + 1,
        ' FIRST NAME ': firstName,
        ' LAST NAME ': lastName,
        ' TITLE ': title,
        'CONTACT NUMBER': contactNumber
    })
    
    await mechanics.save();

    return res.status(200).send(mechanics)
});

router.put('/mechanics/:id', async (req, res) => {
    const {
        id,
        firstName,
        lastName,
        title,
        contactNumber
    } = req.body.payload;

    const mechanics = await Mechanics.findByIdAndUpdate(req.params.id, {
        '# ': id,
        ' FIRST NAME ': firstName,
        ' LAST NAME ': lastName,
        ' TITLE ': title,
        'CONTACT NUMBER': contactNumber
    }, {new: true});

    if(!mechanics)
        return res.status(404).send('The Mechanics can not be found');

    await mechanics.save();

    return res.status(200).send(mechanics)
})

module.exports = router;