var express = require("express");
const { route } = require("..");
var router = express.Router();
var { guestsDB } = require("../../models/guestsModel");
var pdf = require("pdf-creator-node");
var fs = require("fs");
const moment = require("moment");

router.post("/to-pdf", async function (req, res) {
  let guest = req.body;

  guest.dateOfBirth = moment(guest.dateOfBirth).format("DD/MM/YYYY");
  guest.departureDate = moment(guest.departureDate).format(
    "DD/MM/YYYY - hh:mm A"
  );
  guest.arrivalDate = moment(guest.arrivalDate).format("DD/MM/YYYY - hh:mm A");

  let idType;
  let idValue;
  let issExpDate = {};

  if(guest.identificationType == "drivers-license") {
    idType = "DRIVER'S LICENSE";
    idValue = `DRIVER'S LISENCE NO.: ${guest.drivingLicenseNumber}`;
  } else if(guest.identificationType == "passport") {
    idType = "PASSPORT";
    idValue = `PASSPORT NUMBER: ${guest.passportNumber}`
  } else if(guest.identificationType == "national-identity-number") {
    idType = "NATIONAL IDENTITY";
    idValue = `NATIONAL IDENTITY NO: ${guest.nin}`
  }

  if(guest.identificationType == "national-identity-number") {
    issExpDate.IssDate = "N/A";
    issExpDate.expDate = "N/A";
  } else {
    issExpDate.IssDate = `
      ISSUE DATE: ${moment((guest.idIssueDate)).format("DD/MM/YYYY")}
    `;
    issExpDate.expDate = `
      EXPIRY DATE: ${moment((guest.idExpiryDate)).format("DD/MM/YYYY")}
    `;
  }

  



  console.log(guest);

  const bitmap = fs.readFileSync(__dirname + "/cropped-logo-1.png");
  const logo = bitmap.toString("base64");

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Hello world!</title>
    </head>
    <body>

    <style>

          body {
            padding: 0;
            margin: 0;
            font-size: 8px;
            width: 100%;
          }
          
          .little-top-space {
            margin-top: 10px;
          }
          
          .grid-design {
            width: 100%;
          }
          
          .make-flex {
            display: flex;
            flex-direction: column;
            gap: 40px;
          }

          .wi-3>div, .little-top-space>div {
            padding: 5px 0px 5px 0px;
          }
          
          .make-bold {
            font-weight: bold;
          }

          .wi-3 {
            width: 33.33%;
            float: left;
          }

    </style>

    <div style="width: 100%; overflow: hidden; box-sizing: border-box; padding: 20px 0px;">
      <div style="width: 50%; float: left;">
    <img src="data:image/png;base64,{{logo}}" style="height: 40px; width: 120px;" />
      </div>
    <h1 style="width: 50%; float: left; text-align: right;">Guest Registration</h1>
    </div>
    


      <div class="grid-design">
  <div class="make-flex wi-3">
    <div>SURNAME: {{guestsDetails.surname}}</div>
    <div>OTHER NAMES: {{guestsDetails.otherNames}}</div>
    <div>EMAIL: {{guestsDetails.email}}</div>
    <div>GENDER: {{guestsDetails.gender}}</div>
    <div>ARRIVAL DATE AND TIME: <br /> {{guestsDetails.arrivalDate}}</div>
    <div>CHECKOUT DATE AND TIME: <br /> {{guestsDetails.departureDate}}</div>
    <div>COST CENTER: {{guestsDetails.costCenterNumber}}</div>
    <div>RESIDENTIAL ADDRESS: {{guestsDetails.residentialAddress}}</div>
    <div>NATIONALITY: {{guestsDetails.nationality}}</div>
    <div>DATE OF BIRTH: {{guestsDetails.dateOfBirth}}</div>
    <div>PLACE OF BIRTH: {{guestsDetails.placeOfBirth}}</div>
    <div>MOBILE NUMBER ONE: {{guestsDetails.phoneNumberOne}}</div>
    <div>MOBILE NUMBER TWO: {{guestsDetails.phoneNumberTwo}}</div>
    <div>APPROVED MANAGER ______________</div>
  </div>
  <div class="make-flex wi-3">
    <div class="make-bold">IDENTIFICATION TYPE</div>
    <div>{{guestIdType}}</div>
    <div>{{guestIdValue}}</div>
    <div>ISSUE DATE: {{guestIssExpDate.IssDate}}</div>
    <div>EXPIRY DATE: {{guestIssExpDate.expDate}}</div>
    <div class="make-flex little-top-space">
    <div>COUNTRY OF ORIGIN: {{guestsDetails.country}}</div>
    <div>RESIDENT PERMIT NUMBER: {{guestDetails.residentPermitNumber}}</div>
    <div>OCCUPATION: {{guestsDetails.occupation}}</div>
  </div>

  <div class="make-flex little-top-space">
    <div>METHOD OF PAYMENT: {{guestsDetails.methodOfPayment}}</div>
    <div>CAR PLATE NO.: {{guestsDetails.carPlateNumber}}</div>
    <div>SIGNATURE: ____________</div>
  </div>
  </div>

  <div class="make-flex wi-3">
    <div class="make-bold">EMERGENCY CONTACT</div>
    <div>FULL NAME: {{guestsDetails.emergencyContactName}}</div>
    <div>RELATIONSHIP: {{guestsDetails.emergencyContactRelationship}}</div>
    <div>MOBILE NUMBER: {{guestsDetails.emergencyContactPhoneNumber}}</div>

    <div class="make-flex little-top-space">
    <div class="make-bold">ROOM DETAILS</div>
    <div>ROOM NUMBER: {{guestsDetails.roomNumber}}</div>
    <div>ROOM TYPE: {{guestsDetails.roomType}}</div>
    <div>NUMBER OF PERSONS: {{guestsDetails.numberOfPersons}}</div>
    <div>RATE: {{guestsDetails.rate}}</div>
    <div>DEPOSIT: {{guestsDetails.deposit}}</div>
    <div>COMPANY NAME: {{guestsDetails.company}}</div>
    <div>APPROVED BY: _______________</div>
  </div>
  </div>
</div>
<div style="width: 100%; margin-top: 20px; overflow: hidden; text-align: center; padding-top: 20px;">Note: The hotel cannot be held responsible for any valuable left in the rooms, use the safe box provided in the room.</div>
    </body>
  </html>
    `;

  var options = {
    format: "A5",
    orientation: "landscape",
    border: "2mm",
    // header: {
    //     height: "45mm",
    //     contents: `<div style="text-align: center;">Villa Marina Guest</div>`
    // },
    footer: {
      height: "5mm",
      contents: {
        default:
          '<span style="color: #444;">{{page}}</span> of <span>{{pages}}</span>', // fallback value
      },
    },
  };

  var document = {
    html: html,
    data: {
      guestsDetails: guest,
      logo,
      guestIdType: idType,
      guestIdValue: idValue,
      guestIssExpDate: issExpDate
    },
    path: "public/result.pdf",
    type: "",
  };

  pdf
    .create(document, options)
    .then((response) => {
      console.log("Hard drive", response);
      res.send("Created Successfully!");
    })
    .catch((error) => {
      console.error(error);
    });
});

module.exports = router;
