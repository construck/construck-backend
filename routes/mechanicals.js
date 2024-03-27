const express = require('express');
const { Mechanicals } = require('../models/mechanical');
const router = express.Router();

router.get('/mechanicals', async (req, res) => {
    const pageSize = 15;
    const currentPage = +req.query.page;

    const totalMechanicals = await Mechanicals.find();
    const mechanicalsQuery = Mechanicals.find();

    if (pageSize && currentPage)
        mechanicalsQuery.skip(pageSize * (currentPage - 1)).limit(pageSize);

    const mechanicals = await mechanicalsQuery;
    if(!mechanicals) return res.status(404).json({message: "No Mechanicals Found"});

    res.status(200).send({mechanicals, totalMechanicals});
})

router.post('/mechanicals', async (req, res) => {
    const { 
        service,
    } = req.body.payload;

    let mechanicalId = await Mechanicals.find();
    if(!mechanicalId) return res.status(404).json({message: "No Mechanical Found"});

    const mechanicals = new Mechanicals({
        'SERVICE': service
    })
    
    await mechanicals.save();

    return res.status(200).send(mechanicals)
});

router.put('/mechanicals/:id', async (req, res) => {
    const {
        service
    } = req.body.payload;

    const mechanicals = await Mechanicals.findByIdAndUpdate(req.params.id, {
        'SERVICE': service,
    }, {new: true});

    if(!mechanicals)
        return res.status(404).send('The Mechanicals can not be found');

    await mechanicals.save();

    return res.status(200).send(mechanicals)
})

module.exports = router;