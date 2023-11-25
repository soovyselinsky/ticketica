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
            from: "Ticket",
            to: req.body.email,
            subject: `New Ticket`,
            html: `
                <div>
                <div style="margin:0px;padding:0px;background-color:#ffffff" bgcolor="#FFFFFF">      
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#ffffff">
                        <tbody>
                            <tr>
                                <td align="center">
                                    <table cellpadding="0" cellspacing="0" border="0" width="480">
                                        <tbody>
                                            <tr> 
                                                <td width="480" align="center" style="min-width:480px">
                                                    <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">                     
                                                        <tbody>
                                                            <tr>
                                                                <td>
                                                                    <table cellpadding="0" cellspacing="0" width="100%" style="min-width:100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <table bgcolor="#009CDE" cellpadding="0" cellspacing="0" border="0" width="100%">      
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:0px;line-height:0px;color:#009cde">${ticketOwner ==
                    null
                    ? req
                        .body
                        .email
                    : ticketOwner.firstName
                }, You have received a ticket for "${newTicket.ticketName
                }"!</td>              
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td align="center" valign="top" style="padding:30px 20px 20px"> 
                                                                                                    <table align="center" cellpadding="0" cellspacing="0" border="0">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td align="cetner" style="fill: #ffffff;">
                                                                                                                    <a href="https://click.email.ticketmaster.com/?qs=f2204422d6938f11af685bdaf5d106139d23bce463ddc1f79d445ddeec68f473a64e566c22db26848a6770cd923a1a4efe75bcf84b4c1442105799a8cec52ad2" rel="noreferrer noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3Df2204422d6938f11af685bdaf5d106139d23bce463ddc1f79d445ddeec68f473a64e566c22db26848a6770cd923a1a4efe75bcf84b4c1442105799a8cec52ad2&amp;source=gmail&amp;ust=1677052638048000&amp;usg=AOvVaw1rm9sTIbQ6igoWNeQS3oHy">
                                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" data-src="/assets/tm-logo-header.623a820a.svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                                                                                                            <path d="M125.552 5.857c-4.467 0-7.747 4.033-7.747 8.225 0 4.02 2.644 5.91 6.562 5.91 1.45 0 2.958-.344 4.327-.76l.455-2.783c-1.326.6-2.727.973-4.176.973-2.264 0-3.597-.797-3.765-2.922 0-.125-.015-.242-.015-.381v-.072-.037c.015-.92.211-1.84.57-2.682.682-1.715 1.647-2.907 3.742-2.907 1.473 0 2.241.811 2.241 2.258a5.7 5.7 0 01-.08.92h-4.851c-.313 1.059-.373 1.768-.373 2.408h8.351c.205-.992.345-1.992.345-3.016-.005-3.431-2.224-5.134-5.586-5.134zm-11.895 10.096c0-.533.088-.994.161-1.314l1.295-5.903h3.181l.549-2.57h-3.179l.879-4.01-3.809 1.234-.607 2.775h-2.57l-.551 2.57h2.562l-1.002 4.565c-.241 1.074-.455 2.098-.455 3.148 0 2.602 1.693 3.543 4.096 3.543.613 0 1.296-.182 1.911-.312l.616-2.732c-.455.189-1.1.322-1.723.322-.804.001-1.354-.513-1.354-1.316zm-14.809-5.801c0 3.383 4.601 3.594 4.601 5.772 0 1.096-1.245 1.498-2.439 1.498-1.376 0-2.38-.506-3.384-1.053l-.775 2.812c1.305.6 2.725.811 4.159.811 3.04 0 6.138-1.053 6.138-4.572 0-3.295-4.599-3.93-4.599-5.632 0-1.074 1.317-1.366 2.38-1.366 1.004 0 1.979.292 2.358.497l.776-2.651c-.703-.176-2.029-.416-3.326-.416-2.799.005-5.889 1.13-5.889 4.3zm48.113 1.315c-1.413 0-2.477-1.125-2.477-2.571 0-1.453 1.062-2.57 2.477-2.57 1.398 0 2.453 1.117 2.453 2.57 0 1.446-1.055 2.571-2.453 2.571zm-.016-5.594c-1.678 0-3.047 1.352-3.047 3.023 0 1.659 1.369 3.018 3.047 3.018 1.686 0 3.055-1.359 3.055-3.018 0-1.672-1.369-3.023-3.055-3.023zM89.004 17.43c-.9 0-1.794-.469-1.794-1.41 0-2.279 2.854-2.57 4.577-2.57h1.246c-.556 2.175-1.379 3.98-4.029 3.98zm2.469-11.564c-1.59 0-3.119.284-4.636.811l-.499 2.812c1.398-.658 2.907-1.052 4.469-1.052 1.244 0 2.717.394 2.717 1.752 0 .395 0 .79-.103 1.155h-1.237c-3.332 0-8.365.352-8.365 4.807 0 2.482 1.752 3.85 4.213 3.85 1.955 0 3.179-.854 4.387-2.381h.059l-.373 2.066h2.987c.315-2.541 1.671-7.846 1.671-9.649-.001-3.178-2.566-4.171-5.29-4.171zm54.886 2.774V7.566h.703c.367 0 .726.125.726.526 0 .46-.278.548-.726.548h-.703zm2.016-.525c0-.672-.396-.993-1.225-.993h-1.362v3.542h.579V9.093h.49l.996 1.571h.623l-1.019-1.571c.552 0 .918-.408.918-.978zm-11.5.598h-.051l.476-2.549h-3.384c-.109.628-.221 1.233-.322 1.812l-2.432 11.704h3.538l1.282-6.057c.445-2.184 1.662-4.413 4.174-4.413.447 0 .953.073 1.354.212l.74-3.44c-.418-.102-.901-.131-1.354-.131-1.641.006-3.382 1.395-4.021 2.862zM79.666 5.857c-1.908 0-3.895.812-4.794 2.564h-.056c-.183-1.629-1.849-2.564-3.464-2.564-1.67 0-3.229.73-4.183 2.119h-.051l.314-1.812h-3.303c-.08.424-.189.972-.293 1.498L61.35 19.678h3.545l1.406-6.428c.442-1.812 1.109-4.668 3.512-4.668.904 0 1.67.628 1.67 1.629 0 .811-.263 2.067-.45 2.885l-1.429 6.582h3.549l1.399-6.428c.45-1.834 1.056-4.668 3.522-4.668.9 0 1.662.628 1.662 1.629 0 .811-.264 2.075-.446 2.885l-1.433 6.582h3.557l1.414-6.449c.292-1.104.607-2.471.607-3.674.003-2.054-1.747-3.698-3.769-3.698zm-68.365.308L8.394 19.68h3.541l2.912-13.515h-3.546zm7.244 7.581c0-2.541 1.585-5.164 4.416-5.164.979 0 1.904.233 2.593.679l.872-2.885c-.952-.285-2.22-.52-3.545-.52-4.893 0-8.038 3.586-8.038 8.313 0 3.49 2.273 5.822 5.79 5.822 1.164 0 2.328-.111 3.412-.629l.399-2.783c-.926.438-2.014.68-2.882.68-2.438.011-3.017-1.759-3.017-3.513zM16.146.335h-3.544l-.743 3.368h3.544l.743-3.368zm30.107 5.522c-4.472 0-7.753 4.033-7.753 8.225 0 4.02 2.644 5.91 6.562 5.91 1.454 0 2.963-.344 4.336-.76l.446-2.783c-1.322.6-2.718.973-4.175.973-2.271 0-3.596-.797-3.765-2.922h-.003c-.008-.125-.019-.242-.019-.381 0-.021.004-.051.004-.072v-.037c.015-.92.22-1.84.575-2.682.677-1.715 1.644-2.907 3.734-2.907 1.483 0 2.249.811 2.249 2.258 0 .312-.025.598-.08.92h-4.849c-.315 1.059-.37 1.768-.378 2.408h8.35c.213-.992.348-1.992.348-3.016.002-3.431-2.221-5.134-5.582-5.134zm-6.017.308h-4.601l-4.947 4.91h-.058L32.988 0h-3.545l-4.204 19.68H28.7l1.538-7.158h.051l3.52 7.158h3.996l-4.102-7.35 6.533-6.165zm16.882 9.788c0-.533.08-.994.161-1.314l1.293-5.903h3.179l.557-2.57h-3.176l.876-4.01-3.81 1.234-.614 2.775h-2.56l-.561 2.57h2.566l-1 4.565c-.241 1.074-.453 2.098-.453 3.148 0 2.602 1.695 3.543 4.101 3.543.608 0 1.297-.182 1.905-.312l.607-2.732c-.45.189-1.08.322-1.721.322-.79.001-1.35-.513-1.35-1.316zm-52.46 0c0-.533.084-.994.157-1.314l1.297-5.903H9.29l.557-2.57H6.668l.875-4.01L3.735 3.39l-.612 2.776H.556L0 8.736h2.57l-1.006 4.565c-.238 1.072-.455 2.098-.455 3.148 0 2.6 1.696 3.543 4.106 3.543.607 0 1.296-.184 1.903-.314l.608-2.732c-.446.189-1.084.322-1.717.322-.794.002-1.351-.512-1.351-1.315z">                        
                                                                                                                            </path>
                                                                                                                        </svg>
                                                                                                                    </a>                                                                     
                                                                                                                </td>                            
                                                                                                            </tr>
                                                                                                        </tbody>                      
                                                                                                    </table>                             
                                                                                                </td>                          
                                                                                            </tr>      
                                                                                        </tbody>
                                                                                    </table>                           
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>                         
                                                                </td>                        
                                                            </tr>
                                                            <tr>
                                                                <td height="1" style="max-height:1px;line-height:1px;font-size:1px">
                                                                    <img src="https://logos-world.net/wp-content/uploads/2021/03/Ticketmaster-Logo.png" width="1" height="1" alt="" class="CToWUd" data-bit="iit">
                                          
                                                                    <img src="https://logos-world.net/wp-content/uploads/2021/03/Ticketmaster-Logo.png" width="1" height="1" alt="" class="CToWUd" data-bit="iit">
                                                                </td>
                                                            </tr>                          
                                                            <tr>
                                                                <td>
                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" valign="top" style="font-family:Arial,Helvetica,sans serif;color:#475058;font-size:23px;line-height:32.2px;font-weight:bold;padding:25px 20px 25px">
                                                                                ${ticketOwner ==
                    null
                    ? req
                        .body
                        .email
                    : ticketOwner.firstName
                }, A ticket has been sent to you! 
                                                                                </td>          
                                                                            </tr>
                                                                            <tr>
                                                                                <td align="center" style="padding:0 25px 25px">
                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td align="left">
                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td align="left" valign="middle" width="10">
                                                                                                                    <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" width="10" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                </td>
                                                                                                                <td align="center">                                     
                                                                                                                    <img border="0" src="https://ci4.googleusercontent.com/proxy/wGMPt99siccSY3wNoebb-rWgCP8CJm5EvoIJiRn-SM-KfmBueamQbM3W4NrK8KKBVOVmRh9jg6PLf-mE9zMZ0c-0VcMYngcD_1X8mG-ZngfB19ZH6LJVT8fBrWwEUYUaZPDhXN1Tg60Aua6gvZ6gJQ=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/9/pp-transfer-received-icon.png" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">                                      
                                                                                                                </td>
                                                                                                                <td align="left" valign="middle">
                                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:2px solid #80ceef">
                                                                                                                        <tbody>
                                                                                                                            <tr>
                                                                                                                                <td align="left" valign="middle" width="10">
                                                                                                                                    <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="10" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                                </td>
                                                                                                                            </tr>                                            
                                                                                                                        </tbody>
                                                                                                                    </table>
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                            <tr>
                                                                                                                <td colspan="3" align="center" style="font-family:Arial,Helvetica,sans serif;color:#009cde;font-size:10px;line-height:12px;padding-top:5px">                                      
                                                                                                                    Received                                      
                                                                                                                </td>                                  
                                                                                                            </tr>                                
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </td>
                                                                                                <td align="center">
                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td align="left" valign="middle">
                                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:2px solid #80ceef">
                                                                                                                        <tbody>
                                                                                                                            <tr>
                                                                                                                                <td align="left" valign="middle" width="132">
                                                                                                                                    <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="132" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                                </td>
                                                                                                                            </tr>
                                                                                                                        </tbody>
                                                                                                                    </table>                                            
                                                                                                                </td>
                                                                                                                <td align="center">
                                                                                                                    <img border="0" src="https://ci5.googleusercontent.com/proxy/8YHu8NGvF_3URFHEDIdeZIRNPg5hHzc9gRn_kR47FFCXYYtgWEag3Gs1_jC9pFivO5-k3JFSE9P7aMy-c5F3PYa-3ja9iP5b686ZYM7zC0sM1k_UyDzU6eHdVL0Io5dqaHxAsYG8QtVwElPUQEyFDw=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/9/pp-transfer-accepted-icon.png" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                </td>
                                                                                                                <td align="right" valign="middle">
                                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:2px solid #80ceef">
                                                                                                                        <tbody>
                                                                                                                            <tr>
                                                                                                                                <td align="left" valign="middle" width="132">
                                                                                                                                    <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="132" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                                </td>                                              
                                                                                                                            </tr>
                                                                                                                        </tbody>
                                                                                                                    </table>
                                                                                                                </td>                                           
                                                                                                            </tr>
                                                                                                            <tr>
                                                                                                                <td colspan="3" align="center" style="font-family:Arial,Helvetica,sans serif;color:#009cde;font-size:10px;line-height:12px;padding-top:5px">
                                                                                                                    Accepted
                                                                                                                </td>
                                                                                                            </tr>                                                                  
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </td>
                                                                                                <td align="right">
                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td align="left" valign="middle">
                                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:2px solid #80ceef">
                                                                                                                        <tbody>
                                                                                                                            <tr>
                                                                                                                                <td align="left" valign="middle" width="10">
                                                                                                                                    <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="10" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                                </td>                                               
                                                                                                                            </tr>
                                                                                                                        </tbody>
                                                                                                                    </table>
                                                                                                                </td>
                                                                                                                <td align="center">
                                                                                                                    <img border="0" src="https://ci4.googleusercontent.com/proxy/9RwYMRGfj1PIeBLksUDKxH3miS_0iLvl5XDdhva4HLxGjBLPQZ21R2biMuD2wrJ-zsaK0Msq-CKpmZ5CCWR4Y4axzfOFRUTneuNYb0xFvmyDGq4wxhMn9FxqcR_4O6n3gkEYwU0zsfYrx4iYqAJ9DA=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/9/pp-transfer-complete-icon.png" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                </td>
                                                                                                                <td align="right" valign="middle" width="10">
                                                                                                                    <img src="https://ci5.googleusercontent.com/proxy/_knyQjw7BdibQf1MBJKChCYutkHShb-57OY-V8EZLlF1cJkh_4k_ZGY5Oz6kYPq7Lsgn=s0-d-e1-ft#https://spacergif.org/spacer.gif" align="left" width="10" height="1" border="0" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                </td>                                    
                                                                                                            </tr>
                                                                                                            <tr>
                                                                                                                <td colspan="3" align="center" style="font-family:Arial,Helvetica,sans serif;color:#009cde;font-size:10px;line-height:12px;padding-top:5px">
                                                                                                                    Complete
                                                                                                                </td>
                                                                                                            </tr>                                
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </td>                                                
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                </td>          
                                                                            </tr>
                                                                        </tbody>      
                                                                    </table>                          
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" style="padding:0 30px">
                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td align="center" valign="top">
                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" valign="top">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td align="center">
                                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                        <tbody>
                                                                                                                            <tr>
                                                                                                                                <td align="left" style="border:1px solid #dfe4e7">
                                                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                                                                        <tbody>
                                                                                                                                            <tr>
                                                                                                                                                <td align="left" style="border-bottom:1px solid #dfe4e7">
                                                                                                                                                    <table bgcolor="#f7f8f9" width="100%" cellspacing="0" cellpadding="0" border="0">                                                                                                                      
                                                                                                                                                        <tbody>
                                                                                                                                                            <tr>
                                                                                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#353c42;font-size:16px;line-height:18px;font-weight:bold;padding:20px 0 5px;padding-left:16px">
                                                                                                                                                                ${newTicket.ticketName
                }
                                                                                                                                                                </td>                                                                                                                        
                                                                                                                                                            </tr>
                                                                                                                                                            <tr>
                                                                                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#69747c;font-size:14px;line-height:18px;padding-top:10px;padding-left:16px">                                                                                                                         
                                                                                                                                                                ${newTicket.ticketDescription
                }
                                                                                                                                                                </td>                                                                                                                        
                                                                                                                                                            </tr>
                                                                                                                                                            <tr>
                                                                                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#69747c;font-size:14px;line-height:18px;padding-top:10px;padding-left:16px">                                                                                                                         
                                                                                                                                                                ${moment(
                    newTicket.eventTimeAndDate
                ).format(
                    "LLLL"
                )}
                                                                                                                                                                </td>                                                                                                                        
                                                                                                                                                            </tr>
                                                                                                                                                            <tr>
                                                                                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#69747c;font-size:14px;line-height:18px;padding:3px 0px 20px;padding-left:16px">                                                                                                                          
                                                                                                                                                                ${newTicket.eventLocation
                }                                                                                                                         
                                                                                                                                                                </td>                                                                                                                        
                                                                                                                                                            </tr>
                                                                                                                                                            <tr>
                                                                                                                                                                <td align="left">
                                                                                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:solid 1px #dfe4e7;padding:15px">
                                                                                                                                                                        <tbody>
                                                                                                                                                                            <tr>
                                                                                                                                                                                <td align="left" valign="top" style="font-family:Arial,Helvetica,sans serif;color:#353c42;font-size:14px;line-height:18px;font-weight:bold">                                                                                                                                              
                                                                                                                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">                                                                                                                                                      
                                                                                                                                                                                        <tbody>
                                                                                                                                                                                            <tr>
                                                                                                                                                                                            ${newTicket.numberOfTickets.map((t, index) => {
                    return `<td align="left" valign="top" style="font-family:Arial,Helvetica,sans serif;color:#353c42;font-size:14px;line-height:18px;font-weight:bold">
                                                                                                                                                                                              (${index + 1}.) Sec ${t.sSection} Row ${t.sRow}, Seat ${t.sNumber}
                                                                                                                                                                                          </td>`;
                })}                                                                                                                                                            
                                                                                                                                                                                            </tr>                                                                                                                                          
                                                                                                                                                                                        </tbody>
                                                                                                                                                                                    </table>                                                                                                                                   
                                                                                                                                                                                </td>                                                                                                                                          
                                                                                                                                                                            </tr>
                                                                                                                                                                        </tbody>
                                                                                                                                                                    </table>                                                                                                                                  
                                                                                                                                                                </td>
                                                                                                                                                            </tr>                                                                                                                      
                                                                                                                                                        </tbody>
                                                                                                                                                    </table>
                                                                                                                                                </td>                                                                                                        
                                                                                                                                            </tr>
                                                                                                                                            <tr>
                                                                                                                                                <td align="center" valign="top" width="100%">
                                                                                                                                                  <img border="0" src="${newTicket.flyer}" width="418" style="display:block;width:100%" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 534.8px; top: 1483.64px;"><div id=":ot" class="T-I J-J5-Ji aQv T-I-ax7 L3 a5q" role="button" tabindex="0" aria-label="Download attachment " jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB" data-tooltip-class="a1V" data-tooltip="Download"><div class="akn"><div class="aSK J-J5-Ji aYr"></div></div></div></div>
                                                                                                                                                </td>
                                                                                                                                            </tr>
                                                                                                                                            <tr>
                                                                                                                                                <td align="center" style="padding:20px 20px 0">
                                                                                                                                                    <table cellspacing="0" width="100%" cellpadding="0" border="0" bgcolor="#009cde">
                                                                                                                                                        <tbody>
                                                                                                                                                            <tr>
                                                                                                                                                                <td align="center" style="font-family:Arial,Helvetica,sans serif;font-weight:bold;color:#ffffff;font-size:12px;line-height:16px;padding:10px 0">
                                                                                                                                                                <a href="${req.get(
                    "origin"
                )}/confirm-ticket.html?id=      ${newTicket._id}" style="color:#ffffff;text-decoration:none" rel="noreferrer noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=index.html&amp;source=gmail&amp;ust=1677052638049000&amp;usg=AOvVaw3dH4cNJLqxfl59TZs1YCiK">ACCEPT TICKETS</a>
                                                                                                                                                                </td>                                                                                                                          
                                                                                                                                                            </tr>
                                                                                                                                                        </tbody>
                                                                                                                                                    </table>                                                                                                                  
                                                                                                                                                </td>
                                                                                                                                            </tr>
                                                                                                                                            <tr>
                                                                                                                                                <td align="center" valign="top" style="font-family:Arial,Helvetica,sans serif;color:#475058;font-size:11px;line-height:14px;padding:20px 10px">
                                                                                                                                                    This email is <b>NOT</b> your ticket. You can see the ticket in your Ticketmaster account via the button above.
                                                                                                                                                </td>
                                                                                                                                            </tr>                                                                                           
                                                                                                                                        </tbody>
                                                                                                                                    </table>
                                                                                                                                </td>                                                                                       
                                                                                                                            </tr>
                                                                                                                        </tbody>
                                                                                                                    </table>
                                                                                                                </td>                                                                        
                                                                                                            </tr>
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </td>                                                      
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td align="left">
                                                                                                    <table width="100%" align="center" cellpadding="0" cellspacing="0" border="0" style="padding-top:20px">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td align="center">
                                                                                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">                                                                                      
                                                                                                                        <tbody>
                                                                                                                            <tr>
                                                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#353c42;font-size:14px;line-height:19.6px;font-weight:bold;padding:0px 0px 5px 0px">Transfer Status: Completed</td>
                                                                                                                            </tr>
                                                                                                                            <tr>
                                                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#474f57;font-size:14px;line-height:19.6px;padding:0px 0px 5px 0px">You have successfully accepted your ticket transfer from Lily and you're now on your way to see ${newTicket.ticketName
                }: ${newTicket.ticketDescription
                }.</td>
                                                                                                                            </tr>
                                                                                                                            <tr>
                                                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#353c42;font-size:14px;line-height:19.6px;font-weight:bold;padding:15px 0px 5px 0px">What's Next?</td>
                                                                                                                            </tr>
                                                                                                                            <tr>
                                                                                                                                <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#474f57;font-size:14px;line-height:19.6px;padding:0px 0px 30.2px 0px">
                                                                                                                                    Don't forget to have your ticket(s) handy before you head out. To view and access your ticket order, click View Tickets above - or visit <a href="http://tmntr.ticketmaster.com/bsE+DAYP2b0UwjtKdeRFiXDepumfzvpGxY9lRc3QLB/iRYIpHzN5ftNaK4FO7u8v92AyfAjjQz2gLiciwPF20RD3q6NZB4Ooz0xPmXNXPfM3xwujW8+j7iPTWf/Ps2cYgMpVCL1nvBAxUxG3aINrQotxhr2E2ZuM/ve0+kFZS+xgyhUZfRlTz7nV098LpiQqnduzsAq+5jNbF1M29j3/Fp4YEZ6+LCeg0xoqKPwUoiGwGqarAJTK3RZLc+KoTcvuYW4fwSZfa3jFBdAGBOOUuTBniUhj7wY4G+t0Dep+BuD9Xxa0aOQZy5rfKQiKiOUY+LdBqYnMod0JPyVWHayOZdq+yb1n/IkC7uTcqY551pR9bPlpBQtfMB2/uvw+TCSezCc4VIG82OpMJ5Gs86nQek4d8QExMl6x2t9PvCvESxR1lXFioZ2qT2EPawmU30riHCu0Yln+KtK1cn8ohcXcADXea9c/9nvIR2VtUDBjY8NwRgcHSwOUxgXOlMCJj6JpHJQrFSO1nJ4=" style="color:#009cde;text-decoration:none" rel="noreferrer noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=http://tmntr.ticketmaster.com/bsE%2BDAYP2b0UwjtKdeRFiXDepumfzvpGxY9lRc3QLB/iRYIpHzN5ftNaK4FO7u8v92AyfAjjQz2gLiciwPF20RD3q6NZB4Ooz0xPmXNXPfM3xwujW8%2Bj7iPTWf/Ps2cYgMpVCL1nvBAxUxG3aINrQotxhr2E2ZuM/ve0%2BkFZS%2BxgyhUZfRlTz7nV098LpiQqnduzsAq%2B5jNbF1M29j3/Fp4YEZ6%2BLCeg0xoqKPwUoiGwGqarAJTK3RZLc%2BKoTcvuYW4fwSZfa3jFBdAGBOOUuTBniUhj7wY4G%2Bt0Dep%2BBuD9Xxa0aOQZy5rfKQiKiOUY%2BLdBqYnMod0JPyVWHayOZdq%2Byb1n/IkC7uTcqY551pR9bPlpBQtfMB2/uvw%2BTCSezCc4VIG82OpMJ5Gs86nQek4d8QExMl6x2t9PvCvESxR1lXFioZ2qT2EPawmU30riHCu0Yln%2BKtK1cn8ohcXcADXea9c/9nvIR2VtUDBjY8NwRgcHSwOUxgXOlMCJj6JpHJQrFSO1nJ4%3D&amp;source=gmail&amp;ust=1677052638049000&amp;usg=AOvVaw1LLYdPX9lCIoJGEdAUuljr">My Account</a>.
                                                                                                                                </td>
                                                                                                                            </tr>                                                               
                                                                                                                        </tbody>
                                                                                                                    </table>
                                                                                                                </td>                                                                     
                                                                                                            </tr>
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </td>
                                                                                            </tr>                         
                                                                                        </tbody>
                                                                                    </table>
                                                                                </td>
                                                                            </tr>                                                             
                                                                        </tbody>
                                                                    </table>                                                                   
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f7f8f9">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td align="center" style="padding:35px 0">
                                                                                    <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td align="center" valign="top" style="font-family:Arial,Helvetica,sans-serif;color:#4b545b;font-size:16px;font-weight:bold;line-height:20px;text-align:center">
                                                                                                    Want to know who else is going?
                                                                                                </td>                                                            
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td align="center" valign="top" style="font-family:Arial,Helvetica,sans-serif;color:#4b545b;font-size:16px;line-height:20px;text-align:center;padding-top:5px;padding:5px 5px 0 5px">
                                                                                                    Share with your friends and plan to meet-up.
                                                                                                </td>
                                                                                            </tr>
                                                                                            <tr>
                                                                                                <td align="center" style="padding:10px 0 0">
                                                                                                    <table cellspacing="0" cellpadding="0" border="0">
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td align="left">
                                                                                                                    <a href="https://click.email.ticketmaster.com/?qs=f2204422d6938f1105c79db2e0090261e6aaa75e2a125014831309fcea15ea7a723f118d251440416d6839408a0ba2247e8be3a07d391ac4c8b4e7698ecf20d3" style="color:#11a2e0;text-decoration:none" rel="noreferrer noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3Df2204422d6938f1105c79db2e0090261e6aaa75e2a125014831309fcea15ea7a723f118d251440416d6839408a0ba2247e8be3a07d391ac4c8b4e7698ecf20d3&amp;source=gmail&amp;ust=1677052638049000&amp;usg=AOvVaw1gofOFQBs-n1pszMwhxOWq">
                                                                                                                        <img border="0" src="https://ci4.googleusercontent.com/proxy/xFV9z0CUbhpj6SZJwagwIs_rcNKlGrldSe54l1RW5HrnBvQEKmn6bugY8zBK675Q_-GJBfNjIVKkV-zIuLFfSASdGgSzwA2o4o614Fp04Zgkm9HP6fJ8xUtj_hbi_pGp1rc65fgjXjeHpuddsa6xP3OZXxg=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/5/3pe-transfer-complete-fb-icon.jpg" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                    </a>
                                                                                                                </td>
                                                                                                                <td align="left" style="padding-left:20px">
                                                                                                                    <a href="https://click.email.ticketmaster.com/?qs=f2204422d6938f116f1a328224cadabb4a8af36ce6c4dbe07e9af3e9dcfa1e7b5abc795f34aa910e4def487f62d159690e46dfe67f78939c3fff3281a27b8237" style="color:#11a2e0;text-decoration:none" rel="noreferrer noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3Df2204422d6938f116f1a328224cadabb4a8af36ce6c4dbe07e9af3e9dcfa1e7b5abc795f34aa910e4def487f62d159690e46dfe67f78939c3fff3281a27b8237&amp;source=gmail&amp;ust=1677052638049000&amp;usg=AOvVaw1CCCAmLoEBQ5jQ9AnmVoJC">
                                                                                                                        <img border="0" src="https://ci4.googleusercontent.com/proxy/ge8Xb_HzSifsQzx3CwBjT2DYExNYJ0HHDNnqC3qDl29rw8etxVtCVLEBcHw1vAG49DtMNYG48K5OXTNn1KFonx7olYXNZV8J2hGFDc5TNgGPmBczGp2XaUqnEGHAb7imQYogBQTqImO6VxpP6ugHjT47va4=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/5/3pe-transfer-complete-tw-icon.jpg" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                    </a>
                                                                                                                </td>
                                                                                                                <td align="left" style="padding-left:20px">
                                                                                                                    <a href="https://click.email.ticketmaster.com/?qs=f2204422d6938f112c4cbaa0f9932508cc13d4c8d73b1de1b2e0ccf937d3c04ae3e0f0c2d9a1a2af6267618fb7cc412070325a1aad891125e7a27757070e96ed" style="color:#11a2e0;text-decoration:none" rel="noreferrer noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3Df2204422d6938f112c4cbaa0f9932508cc13d4c8d73b1de1b2e0ccf937d3c04ae3e0f0c2d9a1a2af6267618fb7cc412070325a1aad891125e7a27757070e96ed&amp;source=gmail&amp;ust=1677052638049000&amp;usg=AOvVaw1vvk2YQnGxwnhD6ovFoj6S">
                                                                                                                        <img border="0" src="https://ci4.googleusercontent.com/proxy/Km4SqOFLS_hBFFxxsnyOSjjLkbV6Y2M0YiqEYt_HqGJ3kipo08tZok6oEi7EJEHXAoqbRK7jJ4sf-Uezu4JkYDTujEUBjV-28K7sQwD9xIEB2gIzZeDMTbxi7goK6JQsJ6YJm5OkzRY1rmocrc1fL1_Hfw4=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/5/3pe-transfer-complete-in-icon.jpg" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                    </a>
                                                                                                                </td>
                                                                                                                <td align="left" style="padding-left:20px">
                                                                                                                    <a href="https://click.email.ticketmaster.com/?qs=f2204422d6938f119c0c22e251782997b9e0dc48da9d69936e84c45b2fffbe62831bfb854965847dfd4a21b3073eae3f799ecca33a8ac9961cf8cc2468c9ae38" style="color:#11a2e0;text-decoration:none" rel="noreferrer noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=https://click.email.ticketmaster.com/?qs%3Df2204422d6938f119c0c22e251782997b9e0dc48da9d69936e84c45b2fffbe62831bfb854965847dfd4a21b3073eae3f799ecca33a8ac9961cf8cc2468c9ae38&amp;source=gmail&amp;ust=1677052638049000&amp;usg=AOvVaw3n1Zv0ClZH5qMldErONn5o">
                                                                                                                        <img border="0" src="https://ci6.googleusercontent.com/proxy/_2VoNRosZvQNR7fKn7eR-tJkrH1vGZTAaX1TFLMueS8otRn6eCcKv_2TbHnvozdNoRuNkZCu0QfiubFLNZOP3tk4TrNaZS6_U9Uq4ugB6M6pJKPsNJizOMirUh7Ot7rYezGlEQtT59HHX_4zRpnF3fdE-4I=s0-d-e1-ft#https://image.email.ticketmaster.com/lib/fe8c137277660c7470/m/5/3pe-transfer-complete-ty-icon.jpg" width="32" height="32" style="display:block" class="CToWUd" data-bit="iit">
                                                                                                                    </a>
                                                                                                                </td>                               
                                                                                                            </tr>
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </td>
                                                                                            </tr>                                              
                                                                                        </tbody>
                                                                                    </table>
                                                                                </td>
                                                                            </tr>                                                                                  
                                                                        </tbody>       
                                                                    </table>
                                                                    <table cellpadding="0" cellspacing="0" width="100%" style="min-width:100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <table border="0" cellpadding="0" cellspacing="0" bgcolor="#009CDE" width="100%">           
                                                                                        <tbody>
                                                                                            <tr>
                                                                                                <td align="center">
                                                                                                    <table border="0" cellpadding="0" cellspacing="0" width="480">               
                                                                                                        <tbody>
                                                                                                            <tr>
                                                                                                                <td align="center" style="max-width:480px" width="480">
                                                                                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">                   
                                                                                                                        <tbody>
                                                                                                                            <tr>
                                                                                                                                <td align="left" style="padding:30px 20px">
                                                                                                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">                       
                                                                                                                                        <tbody>
                                                                                                                                            <tr>
                                                                                                                                                <td align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:12px;line-height:20px;font-weight:normal;padding:2px 0px 0px" valign="top">
                                                                                                                                                    <a href="#m_-547938275599619874_m_-2151566541607647739_m_4867869927588489704_" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:12px;line-height:20px;font-weight:normal;padding:2px 0px 0px;text-decoration:none" rel="noreferrer noreferrer">Ticketmaster, Attn: Fan Support, <br> 1000 Corporate Landing, Charleston, WV 25311 </a><br>
                                                                                                                                                    <br>
                                                                                                                                                    © 2023 Ticketmaster. All rights reserved.
                                                                                                                                                </td>
                                                                                                                                            </tr>
                                                                                                                                        </tbody>
                                                                                                                                    </table>
                                                                                                                                </td>
                                                                                                                            </tr>
                                                                                                                        </tbody>
                                                                                                                    </table>
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        </tbody>
                                                                                                    </table>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    <table cellpadding="0" cellspacing="0" width="100%" style="min-width:100%">
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>                      
                                                                </td>
                                                            </tr>                         
                                                        </tbody>
                                                    </table>                          
                                                </td>
                                            </tr>                            
                                        </tbody>
                                    </table>
                                </td>
                            </tr>            
                        </tbody>
                    </table>
                    <div class="yj6qo">
                    </div>
                    <div class="adL">             
                    </div>
                </div>
            </div>

            //NEW TEST CODE GOES BELOW

            <body>
    <div><div class="gmail_quote"><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left-width:1px;border-left-style:solid;padding-left:1ex;border-left-color:rgb(204,204,204)"><div><div class="gmail_quote"><blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left-width:1px;border-left-style:solid;padding-left:1ex;border-left-color:rgb(204,204,204)"> 
        <u></u>
        
          
            
            
            
            
            
            
          
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
                <td align="center" valign="top" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:23px;line-height:32.2px;font-weight:bold;padding:25px 20px;color:rgb(71,80,88)">Caitlin, Your Ticket Transfer Is Complete!
                      
                    
        
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
                                            Taylor Swift | The Eras Tour 
                                          </td>
                                        </tr>
                                        <tr>
                                          <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:18px;padding-top:10px;padding-left:16px;color:rgb(105,116,124)">
                                          
                                             Sat, Dec 7 @ 7:00 PM
                                           
                                          </td>
                                        </tr>
                                        <tr>
                                          <td align="left" style="font-family:Arial,Helvetica,&quot;sans serif&quot;;font-size:14px;line-height:18px;padding:3px 0px 20px 16px;color:rgb(105,116,124)">
                                            
                                              BC Place , Vancouver, BC
                                            
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
                                                                    Sec ${t.sSection} Row ${t.sRow}, Seat ${t.sNumber}
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
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                            
                          </tbody></table></td></tr></tbody></table></td></tr></tbody></table></div></blockquote></div></div></blockquote></div></div>

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
