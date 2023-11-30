var express = require("express");
var router = express.Router();
const { usersDB } = require("../../models/authModel");
const { ticketsDB } = require("../../models/ticketModel");
const bcrypt = require("bcryptjs");
const { transporter } = require("../../utilities/emailUtility");
const { hasAccess } = require("../../authenticationMiddlewares/accessControl");
const fs = require('fs');

let { checkLoggedIn } = require("../../authenticationMiddlewares/loginAuth");
const moment = require("moment/moment");

async function sendTheMail(options) {
    try {
        await transporter.sendMail(options);
    } catch (error) {
        console.log(error);
        console.log("An error occoured while trying to send the mail.");
    }
}

router.use(checkLoggedIn);
router.use(hasAccess.admin);

router.get("/profile", async function (req, res, next) {
    const id = req.decoded.userid;
    const user = await usersDB.findById(id);
    res.send(user);
});

router.get("/tickets", async function (req, res, next) {
    try {
        let allTickets = await ticketsDB.find();

        let arr = [];

        for (let i = 0; i < allTickets.length; i++) {
            let t = { ticket: allTickets[i] };
            if (Date.parse(t.ticket.expiryDate) >= Date.parse(Date.now()) && t.ticket.viewed == false) {
                t.expiredState = true;
            } else {
                t.expiredState = false;
            }
            arr.push(t);
        }

        res.send(arr);
    } catch (error) {
        next(error);
    }
});

router.put("/ticketbody/:id", async function (req, res, next) {
    try {
        await ticketsDB.findByIdAndUpdate(req.params.id, {
            ticketName: req.body.ticketName,
            ticketDescription: req.body.ticketDescription,
            flyer: req.body.flyer,
            numberOfTickets: req.body.numberOfTickets,
            eventTimeAndDate: req.body.eventTimeAndDate,
            expiryDate: req.body.expiryDate,
            eventLocation: req.body.eventLocation
        });
        res.send("Ticket edit Successful!");
    } catch (error) {
        next(error);
    }
});

router.put("/updateview/:id", async function (req, res, next) {

    try {
        const u = await usersDB.findById(req.decoded.userid);

        const t = await ticketsDB.findById(req.params.id);

        if (u.email == t.email) {
            await ticketsDB.findByIdAndUpdate(req.params.id, {
                viewed: true
            });
            res.send("Update Successful!");
        } else {
            res.send("Update Not Successful!");
        }

    } catch (error) {
        next(error);
    }
});

router.get("/ticket/:id", async function (req, res, next) {
    try {
        const ticket = await ticketsDB.findById(req.params.id);
        let t = { ticket }
        if (Date.parse(t.ticket.expiryDate) <= Date.now() && t.ticket.viewed == false) {
            t.expiredState = true;
        } else {
            t.expiredState = false;
        }

        res.send(t);
    } catch (error) {
        next(error);
    }
});

router.post("/ticket", async function (req, res, next) {

    try {

        const ticketOwner = await usersDB.findOne({ email: req.body.email });

        if ((await usersDB.findById(req.decoded.userid)).email == req.body.email) {
            req.body.viewed = true;
        }

        const min = 100000; // Minimum value (inclusive)
        const max = 999999; // Maximum value (inclusive)
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        async function convertImageToBase64(imgUrl) {
            const res = await fetch(imgUrl);
            const blob = await res.blob();
            const imageURL = URL.createObjectURL(blob);

            return imageURL;

            // const image = new Image();
            // image.crossOrigin='anonymous';
            // image.src = imgUrl;
            // const canvas = document.createElement('canvas');
            // const ctx = canvas.getContext('2d');
            // canvas.height = image.naturalHeight;
            // canvas.width = image.naturalWidth;
            // ctx.drawImage(image, 0, 0);
            // const dataUrl = canvas.toDataURL();
            // return dataUrl;
        }

        req.body.confirmDigits = randomNumber;

        const newTicket = await ticketsDB.create(req.body);

        const ticketAdmin = await usersDB.findById(req.decoded.userid);

        const mailForAdmin = {
            from: "Ticket",
            // to: ticketOwner.email,
            // to: "soovyselinsky@gmail.com",
            to: ticketAdmin.email,
            subject: "Ticket Confirmation Code",
            html: `
            The ticket confirmation code for the ticket created for ${req.body.email} is: ${randomNumber}
        `
        }

        // const getLogoImage = () => {
        //     const logoPath = '../../assets/Untitled.jpeg';
        //     const fileContent = fs.readFileSync(logoPath);
        // }



        var mailOptions = {
            from: `"Ticketmaster" Ticketmastercustomerservice00@gmail.com`,
            to: req.body.email,
            subject: "You are all set to see " + newTicket.ticketName,
            html: `

            <body>  
            
          
          <div style="margin:0px;padding:0px;background-color:rgb(255,255,255)" bgcolor="#FFFFFF" dir="auto">
              
              
              
        
        
        
        
        
        
        
        
        
              
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:rgb(255,255,255)">
                <tbody><tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="480">
                      <tbody><tr> 
                        <td width="480" align="center" style="min-width:480px">
                          
                          <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                            
                            
                            <tbody><tr>
                              <td>
                                <table cellpadding="0" cellspacing="0" width="100%" style="min-width:100%"><tbody><tr><td>
        
        <table bgcolor="#024DDF" cellpadding="0" cellspacing="0" border="0" width="100%">
            
                <tbody><tr>
                    
                    <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:0px;line-height:0px;color:rgb(0,156,222)">${ticketOwner ==
                        null
                        ? req
                            .body
                            .email
                        : ticketOwner.firstName
                    }, Your Ticket Transfer is complete!</td>
                     
                </tr>
                <tr>
                    <td align="center" valign="top" style="padding:30px 20px 20px">
                    
                    <table align="center" cellpadding="0" cellspacing="0" border="0">
                        
                            <tbody><tr>
                                <td align="cetner">
                                <a href="https://click.email.ticketmaster.com/?qs=3c4c67fb6f945476d0043d8ce4f1e0a1e4a62f3c0819c671a9eafc8222f4af8184e83117a233124c4d8a92ba240befdd52ee541da723a617fb57d72780b31498" rel="noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3D3c4c67fb6f945476d0043d8ce4f1e0a1e4a62f3c0819c671a9eafc8222f4af8184e83117a233124c4d8a92ba240befdd52ee541da723a617fb57d72780b31498&amp;source=gmail&amp;ust=1700845034341000&amp;usg=AOvVaw1lWXcANM6dtDWlNY4uQPyE">
                                <img src="https://ci5.googleusercontent.com/proxy/_LDWSSN58z-VOuB05rO9XyIwMGDFmrusQ0uT22qTOV0h6P5Icu7CS0lN_PQg2GzkQ_nMZzIpr1d0S1Ym9H_jXtxIhABHwu0tOwYPNTSaa8AoK9_dMX8b_RXMIndGaMx8N_Lzns2moDCQi9VuRF8RVjFeSYhY=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/1/ticketmaster_logo_white_retina.png" width="140" height="auto" border="0" style="display:block" alt="Ticketmaster" class="CToWUd" data-bit="iit">
                                </a>
                                </td>
                            </tr>
                        
                    </tbody></table>
                    
                    </td>
                </tr>
            
        </tbody></table>
        </td></tr></tbody></table>
                                
                                
                              </td>
                            </tr>
                            
                            <tr>
                              <td height="1" style="max-height:1px;line-height:1px;font-size:1px">
                                <img src="https://ci5.googleusercontent.com/proxy/vOpGNJN-O2ZWsFvxSB2Ti7k7i6d5pFM0J2GMaQI543FSbqm_iTFY9WkXrTIDHyntbelvLqCx33mAOQx49ecRuPGEJ6PZptDxXDI9g7Jdp78Jnj-flS8Mpg1XEQ6xcBjkbpEk1cvwSNSuLa39IFyv7rDmdIUQF-75EjOIum9RG68CBbTaQZzM0lBISJp0Ss2-hGBVoUIrxBrWuFQljqEe5KPM-VbCvE2DUL2wxG0AXSY7tzyovXmmUMd_mfdJnca4HRXpLRA=s0-d-e1-ft#https://click.email.ticketmaster.com/open.aspx?ffcb10-fec7127176600178-fe26127276620d7c751c76-fe8c137277660c7470-ff9c1671-fe1612797c660c7f721c76-fe9010787d67047a74&amp;d=70217&amp;bmt=0" width="1" height="1" alt="" class="CToWUd" data-bit="iit">
        
        <img src="https://ci3.googleusercontent.com/proxy/fne_qEU_lsKFVDO9BwRIo2JA381naEvewJWJpisP0X6IpK57AjTEsgpx4PGKARmvUrUBmtaGs7EQetfJidQFIg9L6zGYrppnr-9iPpqw6D8zP_niH3aN4xcPK61PAT_IlKOx_1-AzpEkRvTubNRrCViy5HolZdu_j3-oGK67w_eV5Ta4hGI9m-uvE3WQZINSWHLNS1NObjapxIGJjAKIKlERxLqZTVCw_xo1Dz8UFUlvkj8c8GlB6HUD6pfQe-AI_7XKZwaA-qV1ysPWXHgpcBQBH-Z2IPl5JPH46Ae-_U3mkayylfvclDSBUR3AivOt0X8galwYpeBgnQ1Kn-aZ6X5M9YHq3-4aj04vrcweGBS7q-TeD9uS8SlUx_Sjg1WedWfpxqB1mAJ4wQO9qUYt2XguvQ_xtCStKA06qr96uag5rvlJeO76pSGmxaqE64BbYAth5KRq9j4Et9ZcRarCBaD2_UdfSS396xpxUjM-fZzybyGEJCQV5Gl3nEkL8Y2CMgL4H6DWgTNnoGaWCLn6PfHYwJUn5hfZI0NmmHapQpDuRQILMyeZYS_lHiScFLEIXyH8PVHjnNnvQgkE__VfXHXa_Jz4BimtQCQUqKGWMFx7Hma7OerPlLSszXDh0pgY7ETPBykqmGBSnhqDi--HGyjJhedNL-md9z26hq3I5N9YmHsaif_3J3efY0dYCFi6wHZJHFBS1O6AN4ti8OBusOBsRhg9i2WMIwUc-Lsahk7jIA25e2Di2aIYOaeJYA=s0-d-e1-ft#http://tmntr.ticketmaster.com/xFWbdw87fROgv5RfcfEMXwLlM3eXdhmPbrEPaB6LsbxpfimEB5TVJn/oCWT8BIKgOZR6WVc+kcrei0JBauUJlEKFDG+W71qSo16Re2sMqoWpDFNEk0uyuPp27hw5uWEYs9YP+qg8bED6s3KzjjgZFq0cTdP4bZmzniyqzuKzeSoapeoBzgQevJFD45rjAET87b83rHOduF5+kLh74y9z47uH7L+QPxlFpF713d0QVtyeGBGeviwnoIrTLDR6ha9bsBqmqwCUyt0WS3PiqE3L7mFuH8EmX2t4xQXQBgTjlLkwZ4lIY+8GOBvrdA3qfgbg/V8WtGjkGcua3ykIiojlGPi3QamJzKHdCT8lVh2sjmWpkM+iBUOnUe7k3KmOedaUaOp8QnSXIG4dv7r8Pkwknjq2xbf1XP0FVQ+xXzlJaVKE8BKxY+kcCHv1dpFLLJFwFSH3gv+/YoFjEpxKUoI5azTUKyIsaKycDemR+YWrKZz7rOlv+vvJSKATuJBgobdc2udRVvGimf8=" width="1" height="1" alt="" class="CToWUd" data-bit="iit">
                              </td>
                            </tr>                    
        
                            
                            
                            <tr>
                              <td>
                                <table width="100%" cellspacing="0" cellpadding="0" border="0">
            <tbody><tr>
                <td align="center" valign="top" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:23px;line-height:32.2px;font-weight:bold;padding:25px 20px;color:rgb(71,80,88)">${ticketOwner ==
                    null
                    ?req
                    .body
                    .email: ticketOwner.firstName}, Your Ticket Transfer Is Complete!
                      
                    
        
                </td>
            </tr>
            <tr>
                <td align="center" style="padding:0px 25px 25px">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tbody><tr>
                            <td align="left">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tbody><tr>
                                        <td align="left" valign="middle" width="10">
                                            <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" width="10" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                        </td>
                                        <td align="center">
                                            
                                                <img border="0" src="https://ci3.googleusercontent.com/proxy/R9dGCUTZSXe8K0Gk5F52qhQSQvGipilQE4r2znYYELhl6jWT64gIzgADKEt_eL_e0knho6a93zY0SalG6MJbSSdFaDv0vwWq9iGeQbRtDjTbRTap4hQkh7zZQsKATro8nmatszCJ4Fr9NZwwY4choExbW5vthMng--A25Q=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/59/6664410a-2a6c-4b0a-9425-1d3cbdfbf481.png" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                            
                                        </td>
                                        <td align="left" valign="middle">
                                            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top-width:2px;border-top-style:solid;border-top-color:rgb(2,77,223)">
                                                <tbody><tr>
                                                    <td align="left" valign="middle" width="10">
                                                        <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="10" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                    </td>
                                                </tr>
                                            </tbody></table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" align="center" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:10px;line-height:12px;padding-top:5px;color:rgb(2,77,223)">
                                            
                                                Received
                                            
                                        </td>
                                    </tr>
                                </tbody></table>
                            </td>
                            <td align="center">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tbody><tr>
                                        <td align="left" valign="middle">
                                            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top-width:2px;border-top-style:solid;border-top-color:rgb(2,77,223)">
                                                <tbody><tr>
                                                    <td align="left" valign="middle" width="132">
                                                        <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="132" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                    </td>
                                                </tr>
                                            </tbody></table>
                                        </td>
                                        <td align="center">
                                            <img border="0" src="https://ci4.googleusercontent.com/proxy/EkdORn4-3wFBPF9I4Jutyrkwp8UsOqqdn65pu7LeBdubYXEYKgQMPd0kIm0py8LRlKly957qOudO0gnfqd9yzbJtYwNswv6vPANidPSIRWXjefyrRYPZ56-qgH-Xj0I-3U_T_RO_QUPLsbUzM6AuAtNAe3HUHhSx9MC0Eg=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/59/612b2ffd-48c8-4cba-b261-65887eac88cb.png" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                        </td>
                                        <td align="right" valign="middle">
                                            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top-width:2px;border-top-style:solid;border-top-color:rgb(2,77,223)">
                                                <tbody><tr>
                                                    <td align="left" valign="middle" width="132">
                                                        <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="132" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                    </td>
                                                </tr>
                                            </tbody></table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" align="center" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:10px;line-height:12px;padding-top:5px;color:rgb(2,77,223)">
                                            Accepted
                                        </td>
                                    </tr>
                                </tbody></table>
                            </td>
                            <td align="right">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tbody><tr>
                                        <td align="left" valign="middle">
                                            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top-width:2px;border-top-style:solid;border-top-color:rgb(2,77,223)">
                                                <tbody><tr>
                                                    <td align="left" valign="middle" width="10">
                                                        <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="10" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                    </td>
                                                </tr>
                                            </tbody></table>
                                        </td>
                                        <td align="center">
                                            <img border="0" src="https://ci5.googleusercontent.com/proxy/-pgsgkxgKG5itFFFSvu0_WdxsTX1wAevd4IiDFRDIvHD_WHvlfp0XlDfF7bM_wAFIsfJ0FN0eNe57RnsHYqYRijOz-pKGAcbmrnrEXI61xGePqyBxsEtucS8H2fxFSmVRh6BdcthBarGbOfyZM1ZjaSSnuV0wpS7zXn-4w=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/59/50e41577-8b23-4c38-a24b-6eca6118e761.png" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                        </td>
                                        <td align="right" valign="middle" width="10">
                                            <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="10" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="3" align="center" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:10px;line-height:12px;padding-top:5px;color:rgb(2,77,223)">
                                            Complete
                                        </td>
                                    </tr>
                                </tbody></table>
                            </td>
                        </tr>
                    </tbody></table>
                </td>
            </tr>
        </tbody></table>
        
                                
                              </td>
                            </tr>
                            
                            
                            
                            <tr>
                              <td>
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tbody><tr>
            <td align="center" style="padding:0px 30px">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tbody><tr>
                  <td align="center" valign="top">
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" valign="top">
                      <tbody><tr>
                        <td align="center">
                          <table width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tbody><tr>
                              <td align="left" style="border:1px solid rgb(223,228,231)">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                  <tbody><tr>
                                    <td align="left" style="border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgb(223,228,231)">
                                      <table bgcolor="#f7f8f9" width="100%" cellspacing="0" cellpadding="0" border="0">
                                        
                                        <tbody><tr>
                                          <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:16px;line-height:18px;font-weight:bold;padding:20px 0px 5px 16px;color:rgb(53,60,66)">
                                            ${newTicket.ticketName} 
                                          </td>
                                        </tr>
                                        <tr>
                                          <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:18px;padding-top:10px;padding-left:16px;color:rgb(105,116,124)">
                                          ${moment(newTicket.eventTimeAndDate).format("ddd, MMM D @ h:mm A")}
                                                                                       
                                          </td>
                                        </tr>
                                        <tr>
                                          <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:18px;padding:3px 0px 20px 16px;color:rgb(105,116,124)">
                                            
                                          ${newTicket.eventLocation}
                                            
                                          </td>
                                        </tr>
                                        <tr>
                                          <td align="left">
                                            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top-width:1px;border-top-style:solid;padding:15px;border-top-color:rgb(223,228,231)">
                                              <tbody><tr>
                                                <td align="left" valign="top" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:18px;font-weight:bold;color:rgb(53,60,66)">
                                                  
                                                    
                                                      <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-family:Arial,Helvetica,&quot;sans serif&quot;">
                                                        
                                                              <tbody style="font-family:Arial,Helvetica,&quot;sans serif&quot;">
                                                                <tr style="font-family:Arial,Helvetica,&quot;sans serif&quot;">
                                                                ${newTicket.numberOfTickets.map((t, index) => {
                                                                    return `<td align="left" valign="top" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:18px;font-weight:bold;color:rgb(53,60,66)">
                                                                    Sec ${t.sSection}, Row ${t.sRow}, Seat ${t.sNumber}
                                                            </td>`;
                                                        })}                                                                                                                                                            
                                                        
                                                      </tbody></table>
                                                    
                                                  
                                                </td>
                                              </tr>
                                            </tbody></table>
                                          </td>
                                        </tr>
                                      </tbody></table>
                                    </td>
                                  </tr>
                                  
                                  <tr>
                                    <td align="center" valign="top" width="100%">
                                      <img border="0" src="${newTicket.flyer}" width="418" style="display:block;width:100%" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 440.867px; top: 969.617px;"><div id=":rb" class="T-I J-J5-Ji aQv T-I-ax7 L3 a5q" title="Download" role="button" tabindex="0" aria-label="Download attachment " jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB; 4:WyIjbXNnLWY6MTc4MzM3MDkzNTc4Nzk2NTE5MCJd" data-tooltip-class="a1V" jsaction="JIbuQc:.CLIENT"><div class="akn"><div class="aSK J-J5-Ji aYr"></div></div></div></div>
                                    </td>
                                  </tr>
        
                                  <tr>
                                    <td align="center" style="padding:20px 20px 0px">
                                      <table cellspacing="0" width="100%" cellpadding="0" border="0" bgcolor="#024DDF">
                                        <tbody><tr>
                                          <td align="center" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-weight:bold;font-size:12px;line-height:16px;padding:10px 0px;color:rgb(255,255,255)">
                                          <a href="${req.get(
                                            "origin"
                                        )}/confirm-ticket.html?id=      ${newTicket._id}" style="text-decoration:none;font-family:Arial,Helvetica,&quot;sans serif&quot;;color:rgb(255,255,255)" rel="noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3D645f3651d3a07748ec1b95be48b5426f4014c7fa6386c0b7b9ccb203dfec79bbb754f411da6898eee92c332ca264fca787d183fdf3bc33e8475d6bfea2bd8ac1&amp;source=gmail&amp;ust=1700845034342000&amp;usg=AOvVaw0AivlDcNsZVPKzdOwchlyl">VIEW TICKETS</a>
                                          </td>
                                        </tr>
                                      </tbody></table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="center" valign="top" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:11px;line-height:14px;padding:20px 10px;color:rgb(71,80,88)">
                                      This email is <b style="font-family:Arial,Helvetica,&quot;sans serif&quot;">NOT</b> your ticket.
                                    </td>
                                  </tr>
                                  
                                </tbody></table>
                              </td>
                            </tr>
                          </tbody></table>
                        </td>
                      </tr>
                    </tbody></table>
                  </td>
                </tr>
                
                <tr>
                  <td align="left">
                    <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0" style="padding-top:20px">
                      <tbody><tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            
                              <tbody><tr>
                                <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:19.6px;font-weight:bold;padding:0px 0px 5px;color:rgb(53,60,66)">Transfer Status: Completed</td>
                              </tr>
                              <tr>
                                <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:19.6px;padding:0px 0px 5px;color:rgb(53,60,66)">You have successfully accepted your ticket transfer from Hayden and you're now on your way to see Taylor Swift | The Eras Tour.</td>
                              </tr>
                              <tr>
                                <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:19.6px;font-weight:bold;padding:15px 0px 5px;color:rgb(53,60,66)">What’s Next?</td>
                              </tr>
                              <tr>
                                <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:19.6px;padding:0px 0px 30.2px;color:rgb(53,60,66)">
                                  Don’t forget to have your ticket(s) handy before you head out. To view and access your ticket order, click View Tickets above - or visit <a href="http://tmntr.ticketmaster.com/xFWbdw87fROgv5RfcfEMX9XRtGM6M2dSTCeRrPOp0HpOHfEBMTJesSvurATu2f1z3PGF5hso2Os3qYy0irRfl7BeGt7xiwZW9/gEo84fomceZkEc5I350bBRANXfM1+igMpVCL1nvBAxUxG3aINrQotxhr2E2ZuMYr93sLTlCN1Rm6mkfWDtlmz+9zc8/5dZ7iS6cz5WhvYMpAG7kDS4reeLLctELwHTFMCX+ItDjYn0B3/iQxol+l3QORhBJZ1YP/cGi9rf6slcdbeXUEJRF25fOQN5wP6syl9rpF43VxmOhwy2mIprw3rVEJCeTxtUWvT84c1Uo7oD0SiUxkYyVlTdduNtmHwGiWcuyob/3Xdv02CbsVdP6OjwT5OwI67xCYXFfUQHAvETw1aV3pfCJjDbh7ouu5DlnTmmzqV/4OE8znt/vkHew7MB2pUXAELpfzZh9QCuDRbwtA0jPWNoH/htuuJSJLGexXrJkwUEo4a03H50lx5G8dJ0Rn7LMw19QaBIhoxeNEg=" style="text-decoration:none;font-family:Arial,Helvetica,&quot;sans serif&quot;;color:rgb(2,77,223)" rel="noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=http://tmntr.ticketmaster.com/xFWbdw87fROgv5RfcfEMX9XRtGM6M2dSTCeRrPOp0HpOHfEBMTJesSvurATu2f1z3PGF5hso2Os3qYy0irRfl7BeGt7xiwZW9/gEo84fomceZkEc5I350bBRANXfM1%2BigMpVCL1nvBAxUxG3aINrQotxhr2E2ZuMYr93sLTlCN1Rm6mkfWDtlmz%2B9zc8/5dZ7iS6cz5WhvYMpAG7kDS4reeLLctELwHTFMCX%2BItDjYn0B3/iQxol%2Bl3QORhBJZ1YP/cGi9rf6slcdbeXUEJRF25fOQN5wP6syl9rpF43VxmOhwy2mIprw3rVEJCeTxtUWvT84c1Uo7oD0SiUxkYyVlTdduNtmHwGiWcuyob/3Xdv02CbsVdP6OjwT5OwI67xCYXFfUQHAvETw1aV3pfCJjDbh7ouu5DlnTmmzqV/4OE8znt/vkHew7MB2pUXAELpfzZh9QCuDRbwtA0jPWNoH/htuuJSJLGexXrJkwUEo4a03H50lx5G8dJ0Rn7LMw19QaBIhoxeNEg%3D&amp;source=gmail&amp;ust=1700845034342000&amp;usg=AOvVaw26EPefkLl8UhrgAO6HDmAw">My Account</a>.
                                </td>
                              </tr>
                            
                          </tbody></table>
                        </td>
                      </tr>
                    </tbody></table>
                  </td>
                </tr>
              </tbody></table>
            </td>
          </tr>
        </tbody></table>
        
                                
                              </td>
                            </tr>
                            
                            
                            
                            <tr>
                              <td>
                                <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f7f8f9">
            
                <tbody><tr>
                    <td align="center" style="padding:35px 0px">
                        <table width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tbody><tr>
                                <td align="center" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:20px;text-align:center;color:rgb(75,84,91)">
                                    Want to know who else is going?
                                </td>
                            </tr>
                            <tr>
                                <td align="center" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;text-align:center;padding:5px 5px 0px;color:rgb(75,84,91)">
                                    Share with your friends and plan to meet-up.
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="padding:10px 0px 0px">
                                    <table cellspacing="0" cellpadding="0" border="0">
                                        <tbody><tr>
                                            <td align="left">
                                                <a href="https://click.email.ticketmaster.com/?qs=b1f423484440ef89ba1c87867f3ae1dbaba9735cbc8be5fbbbeb19f367e8ec7af2976b9b4bae90de74cd3e174f7f1a1ebed6388590b76cc9f7ddb77c815745c0" style="text-decoration:none;color:rgb(17,162,224)" rel="noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3Db1f423484440ef89ba1c87867f3ae1dbaba9735cbc8be5fbbbeb19f367e8ec7af2976b9b4bae90de74cd3e174f7f1a1ebed6388590b76cc9f7ddb77c815745c0&amp;source=gmail&amp;ust=1700845034342000&amp;usg=AOvVaw1meJiBq_mZGRQJ9OkeBWp9">
                                                    <img border="0" src="https://ci4.googleusercontent.com/proxy/xFV9z0CUbhpj6SZJwagwIs_rcNKlGrldSe54l1RW5HrnBvQEKmn6bugY8zBK675Q_-GJBfNjIVKkV-zIuLFfSASdGgSzwA2o4o614Fp04Zgkm9HP6fJ8xUtj_hbi_pGp1rc65fgjXjeHpuddsa6xP3OZXxg=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/5/3pe-transfer-complete-fb-icon.jpg" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                </a>
                                            </td>
                                            <td align="left" style="padding-left:20px">
                                               <a href="https://click.email.ticketmaster.com/?qs=1e2cea382479be39d8531c5cfd6930ebe0024e9fbadea00e6a7e98f9976401ce6d5d8d34efb56012a63f012d9e755b48d3881852e9a3a7c7e9dace8e466e90d2" style="text-decoration:none;color:rgb(17,162,224)" rel="noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3D1e2cea382479be39d8531c5cfd6930ebe0024e9fbadea00e6a7e98f9976401ce6d5d8d34efb56012a63f012d9e755b48d3881852e9a3a7c7e9dace8e466e90d2&amp;source=gmail&amp;ust=1700845034342000&amp;usg=AOvVaw2O6Wu4bWdobINtCvBJadpT">
                                                    <img border="0" src="https://ci4.googleusercontent.com/proxy/ge8Xb_HzSifsQzx3CwBjT2DYExNYJ0HHDNnqC3qDl29rw8etxVtCVLEBcHw1vAG49DtMNYG48K5OXTNn1KFonx7olYXNZV8J2hGFDc5TNgGPmBczGp2XaUqnEGHAb7imQYogBQTqImO6VxpP6ugHjT47va4=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/5/3pe-transfer-complete-tw-icon.jpg" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                               </a>
                                            </td>
                                            <td align="left" style="padding-left:20px">
                                                <a href="https://click.email.ticketmaster.com/?qs=a78912930057dd4e9b24c99f14663f0fcdd1c631cfcbe9a04dbc6442181b7551bf08405bfdc74b32e3e7f8a87d7368a1771a2f204122b42f2264e18e4fc8fd73" style="text-decoration:none;color:rgb(17,162,224)" rel="noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3Da78912930057dd4e9b24c99f14663f0fcdd1c631cfcbe9a04dbc6442181b7551bf08405bfdc74b32e3e7f8a87d7368a1771a2f204122b42f2264e18e4fc8fd73&amp;source=gmail&amp;ust=1700845034342000&amp;usg=AOvVaw3y_2_DPa2AMvVq2HcmdrLw">
                                                    <img border="0" src="https://ci4.googleusercontent.com/proxy/Km4SqOFLS_hBFFxxsnyOSjjLkbV6Y2M0YiqEYt_HqGJ3kipo08tZok6oEi7EJEHXAoqbRK7jJ4sf-Uezu4JkYDTujEUBjV-28K7sQwD9xIEB2gIzZeDMTbxi7goK6JQsJ6YJm5OkzRY1rmocrc1fL1_Hfw4=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/5/3pe-transfer-complete-in-icon.jpg" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                </a>
                                            </td>
                                            <td align="left" style="padding-left:20px">
                                                <a href="https://click.email.ticketmaster.com/?qs=40913c56bdb820600e56bd34e9b0ec1de27c9a240c51a715954cf60498b604bfdaa0c4ccbf0998775f521818be995808593379eb84026b7e9173b590abe9835d" style="text-decoration:none;color:rgb(17,162,224)" rel="noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3D40913c56bdb820600e56bd34e9b0ec1de27c9a240c51a715954cf60498b604bfdaa0c4ccbf0998775f521818be995808593379eb84026b7e9173b590abe9835d&amp;source=gmail&amp;ust=1700845034342000&amp;usg=AOvVaw2SUR90Q3OQn9mp14U42aD6">
                                                    <img border="0" src="https://ci6.googleusercontent.com/proxy/_2VoNRosZvQNR7fKn7eR-tJkrH1vGZTAaX1TFLMueS8otRn6eCcKv_2TbHnvozdNoRuNkZCu0QfiubFLNZOP3tk4TrNaZS6_U9Uq4ugB6M6pJKPsNJizOMirUh7Ot7rYezGlEQtT59HHX_4zRpnF3fdE-4I=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/5/3pe-transfer-complete-ty-icon.jpg" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                </a>
                                            </td>
        
                                        </tr>
                                    </tbody></table>
                                </td>
                            </tr>
                        </tbody></table>
                    </td>
                </tr>
            
        </tbody></table><table cellpadding="0" cellspacing="0" width="100%" style="min-width:100%"><tbody><tr><td><table border="0" cellpadding="0" cellspacing="0" bgcolor="#024DDF" width="100%">
         
          <tbody><tr>
           <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="480">
             
              <tbody><tr>
               <td align="center" style="max-width:480px" width="480">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                 
                  <tbody><tr>
                   <td align="left" style="padding:30px 20px">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                     
                      <tbody><tr>
                       <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;font-weight:normal;padding:2px 0px 0px;color:rgb(255,255,255)" valign="top">
                        <a href="#m_-2440367723907990640_m_-793901359231788122_m_2118558347506224448_m_70730612660185750_m_5358777052223715598_" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:20px;font-weight:normal;padding:2px 0px 0px;text-decoration:none;color:rgb(255,255,255)" rel="noreferrer">Ticketmaster, Attn: Fan Support, <br> 355 Sainte-Catherine West Street, Suite 601, Montreal, Quebec, H3B 1A5 </a><br>
                        <br>
                        © 2023 Ticketmaster. All rights reserved.</td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table><table cellpadding="0" cellspacing="0" width="100%" style="min-width:100%"><tbody><tr><td>
        </td></tr></tbody></table>
        
                                
                              </td>
                            </tr>
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                          </tbody></table></td></tr></tbody></table></td></tr></tbody></table></div></blockquote></div></div></blockquote>

                     `,
        };

        await sendTheMail(mailOptions);
        await sendTheMail(mailForAdmin);

        res.send("Ticket created Successfully!");
    } catch (error) {
        console.log(error);
        next(error);
    }
});

router.put("/ticket/:id", async function (req, res, next) {
    try {
        await ticketsDB.findByIdAndUpdate(req.params.id, req.body);
        res.send("Edit Successful!");
    } catch (error) {
        next(error);
    }
});

router.delete("/ticket/:id", async function (req, res, next) {
    try {
        await ticketsDB.findByIdAndDelete(req.params.id);
        res.send("Deleted Successfully!");
    } catch (error) {
        next(error);
    }
});

module.exports = router;
