const { election } = require('../models/schoolElectionsModel/electionModel');


async function isPaidByElectionUrl (req, res, next) {
    const result = await election.findOne(req.body.electionUrl);
    if(result.paid == true) {
        next();
    } else {
        res.status(402).json({
            successful: false,
            message: 'Election has not been paid for'
        });
    }
}

async function isPaidByElectionID (req, res) {
    const result = await election.findById(req.body.electionID);
    if(result.paid == true) {
        next();
    } else {
        res.status(402).json({
            successful: false,
            message: 'Election has not been paid for'
        });
    }
}

module.exports = {
    isPaidByElectionUrl,
    isPaidByElectionID
};
