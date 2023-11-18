var express = require("express");
var router = express.Router();
const { usersDB } = require("../../models/authModel");
const { ticketsDB } = require("../../models/ticketModel");
const { transporter } = require("../../utilities/emailUtility");
// const { checkLoggedIn } = require("../../authenticationMiddlewares/loginAuth");
const { theroles } = require("../../authenticationMiddlewares/accessControl");
const moment = require("moment/moment");

async function sendTheMail(options) {
  try {
    await transporter.sendMail(options);
  } catch (error) {
    console.log(error);
    console.log("An error occoured while trying to send the mail.");
  }
}

// Middleware to check if the user is logged in
// router.use(checkLoggedIn);

/* GET users listing. */
router.get("/profile", async function (req, res, next) {
  const id = req.decoded.userid;
  const user = await usersDB.findById(id);
  res.send(user);
});

router.get("/tickets", async function (req, res, next) {
  try {
    const user = await usersDB.findById(req.decoded.userid);
    const allUserTicket = await ticketsDB.find({ email: user.email });

    let arr = [];

    for (let i = 0; i < allUserTicket.length; i++) {
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      let t = {ticket: allUserTicket[i]};
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

router.put("/updateview/:id", async function(req, res, next) {
  try {

    const u = await usersDB.findById(req.decoded.userid);

    const t = await ticketsDB.findById(req.params.id);

    if (Date.parse(t.ticket.expiryDate) >= Date.parse(Date.now()) && t.ticket.viewed == false) {
      res.send("Ticket has already expired!");
    } else {
      if(u.email == t.email) {
        await ticketsDB.findByIdAndUpdate(req.params.id, {
            viewed: true
        });
        res.send("Update Successful!");
      } else {
        res.send("Update Not Successful!");
      }
    }

  } catch (error) {
      next(error);
  }
});

router.get("/ticket/:id", async function (req, res, next) {
  try {
    const { id: ticketId } = req.params;
    const singleTicket = await ticketsDB.findById(ticketId);
    
    // Redirection
    
    if(!singleTicket) return res.redirect("https://www.viagogo.com/");

    let t = {ticket: singleTicket}
    const twoDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.parse(t.ticket.expiryDate) >= Date.parse(Date.now()) && t.ticket.viewed == false) {
      t.expiredState = true;
    } else {
      t.expiredState = false;
    }

    res.send(t);
  } catch (error) {
    next(error);
  }
});

router.put("/transfer-ticket/:id", async function (req, res, next) {
  try {
    const { id: ticketId } = req.params;
    const { email } = req.body;
    const confirmDigits = Math.floor(Math.random() * 100);
    const ticketOwner = await usersDB.findOne({ email: req.body.email });
    const newTicket = await ticketsDB.findByIdAndUpdate(ticketId, {
      email, confirmed: false, confirmDigits
    }, {new: true});

    const formerTicketOwner = await usersDB.findOne(req.decoded.userid);

    const mailForOwner = {
        from: "Ticket",
        // to: ticketOwner.email,
        // to: "soovyselinsky@gmail.com",
        to: formerTicketOwner.email,
        subject: "Tickt Confirmation Code",
        html: `
            The ticket confirmation code for the ticket transferred to ${req.body.email} is: ${confirmDigits}
        `
    }

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
                                                                                                  <td align="left" style="font-family:Arial,Helvetica,sans-serif;font-size:0px;line-height:0px;color:#009cde">${
                                                                                                    ticketOwner == null
                                                                                                      ? req.body.email
                                                                                                      : ticketOwner.firstName
                                                                                                  }, You have received a ticket for "${newTicket.ticketName}"!</td>              
                                                                                              </tr>
                                                                                              <tr>
                                                                                                  <td align="center" valign="top" style="padding:30px 20px 20px"> 
                                                                                                      <table align="center" cellpadding="0" cellspacing="0" border="0">
                                                                                                          <tbody>
                                                                                                              <tr>
                                                                                                                   <td align="cetner" style="fill: #ffffff;">
                                                                                                                       <img src="${req.get("host")}/image/ticketmaster-logo.png"> 
                                                                                                                           <svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" data-src="https://cdn.cookielaw.org/logos/ba6f9c5b-dda5-43bd-bac4-4e06afccd928/002b248b-6e0e-44fd-8cb6-320ffefa48fe/e5b998c1-73c7-46e8-a7ff-aa2ea18369bf/Ticketmaster-Logo-Azure_without_R.png" xmlns:xlink="http://www.w3.org/1999/xlink">
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
                                                                      <img src="https://ci3.googleusercontent.com/proxy/UotVfphO-rOSN2lhCoGwlniQNpIFzC3R1jDzZ0INspqziIUX1WtYw0PMmEjOpBqWH71ZpUck7Las0LGc12YJC_CgqQ8XX-jqIhwdmK96D26TqqQUAObi8ChY_0Q1xdvjCvtf2rIjmRd_pAnKCD6slj-12eVOvIu-v29sNh5XiesW8lwXEbbuvJuqQbsTgykORbcg7V_sfdc2mnyieGVC5XBo253G9rQ20kWkJLmEv7iiblEzNlMEDGt-BubqJV-dhgDH=s0-d-e1-ft#https://click.email.ticketmaster.com/open.aspx?ffcb10-fec211777d60017d-fe1c127377610d747c1173-fe8c137277660c7470-ff9c1671-fe29137070670178711677-febb1074716d0c7a&amp;d=70196&amp;bmt=0" width="1" height="1" alt="" class="CToWUd" data-bit="iit">
                                            
                                                                      <img src="https://ci3.googleusercontent.com/proxy/I2vK_wJgT091gv2KLobKhiYpfaaj66qe_v89WkI4YG1CABexsD7KPiVUoU4At0wL5gE1djpIhZ-gt5ZE3bVt2hfS4Z-13lAhWk-3oGk3BYrcj1Iy3Z4av0TsosugJzhEzGIqvR_she4pDaDrYQLYSonBjHwcRqyOhfUMxFBYLud81JkOCuzNiclRWM4Ohe8sADTm9iCRFn6ii9vZEB71bUiukgKP27j2uJstZ1HimEhI3Mk4QyA0MKQLV2Aw_IiYpdt0jRebqvv62sXmz6D3lWhYziR2RGs_P7nV5mfcWNAXkBNGwzte8dnDEDvWOE-nD69Es38r_cPdQ3zNL4T3jpYaRB0d3ciLdiDkMKqC--YKjIFuuNfAjKnmEmEQHO9m43NudMOh0lN5GdiR8j0llqe3E2JKgEH9h280Y4YvU4e8FXCah_PyJzLAwx3YsIhzEaR4b64LQq3Xha4ZvbYJrRJa9IYjgHiEtU7wrg6ObkQxRQpKskfGp_TPU7sXWj88VOUHOngBpIBYlnDTstmr8qDa8AZP2mZLD0-T8YHzIH7JPwMqWr4ADhVX0RDRInoFKpR7tFaFLDq61AJKAkVfeNDQ142JiYBL1OO8ExB9tpGYaKRMoOojNzapKzM3UO0rWbZ1LsGKsFb2MfTCuUfiipG4MpkjcndEClGiWJCPlL0g4N1xX_CBuaC0EKqW4V3narqOzDyuJPR4_pghJf60E0LM4X8LwCE_KKH0ECLQp09jTw=s0-d-e1-ft#http://tmntr.ticketmaster.com/bsE+DAYP2b0UwjtKdeRFiZtdkleaSZbG+n2Ft5taXYH3rGr+/HooRZa36oux1VTacJqpmcyPr8AIzKPK9i3qeGS0elVhg51w7EW+Jz5mmvNO+kNGgW0lQfywjDIRhS09BisUyko5rvwS99wAbtEi0hqTTOrggefAXR8hLx9jcnS1tIWdyThp7TFTEbdog2tCi3GGvYTZm4z+97T6QVlL7GDKFRl9GVPPS0WA1M+leGD39JYngnTMVBmSiR5fE9pUry0bKCtaoluPKRZnouhvkwP3fv80/qinq8pE6T2oSAXo5MD/xq2wO0bIFCwv8t65Qv7J2rghdcWgzs+6ASapOXEud2AHqPhbUmaUf+0Fptseh4m4WOF7KoTPGmeBVQrjKOH9DAwUxqZT7tVXipjFhPHAMUuqXId3MeJDLl/6OzWlzVVntgOJbFaOXi8Ths7KP7Ceqx4U9nmbvh1ojzgbgchGhL0ivRwn63/4cj615oyOWO9aQX/J8px1sYy2/Pc0" width="1" height="1" alt="" class="CToWUd" data-bit="iit">
                                                                  </td>
                                                              </tr>                          
                                                              <tr>
                                                                  <td>
                                                                      <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                                                          <tbody>
                                                                              <tr>
                                                                                  <td align="center" valign="top" style="font-family:Arial,Helvetica,sans serif;color:#475058;font-size:23px;line-height:32.2px;font-weight:bold;padding:25px 20px 25px">
                                                                                  ${
                                                                                    ticketOwner ==
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
                                                                                                                                                                  ${
                                                                                                                                                                    newTicket.ticketName
                                                                                                                                                                  }
                                                                                                                                                                  </td>                                                                                                                        
                                                                                                                                                              </tr>
                                                                                                                                                              <tr>
                                                                                                                                                                  <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#69747c;font-size:14px;line-height:18px;padding-top:10px;padding-left:16px">                                                                                                                         
                                                                                                                                                                  ${
                                                                                                                                                                    newTicket.ticketDescription
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
                                                                                                                                                                  ${
                                                                                                                                                                    newTicket.eventLocation
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
                                                                                                                                                    <img border="0" src="${
                                                                                                                                                      newTicket.flyer
                                                                                                                                                    }" width="418" style="display:block;width:100%" class="CToWUd a6T" data-bit="iit" tabindex="0"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 534.8px; top: 1483.64px;"><div id=":ot" class="T-I J-J5-Ji aQv T-I-ax7 L3 a5q" role="button" tabindex="0" aria-label="Download attachment " jslog="91252; u014N:cOuCgd,Kr2w4b,xr6bB" data-tooltip-class="a1V" data-tooltip="Download"><div class="akn"><div class="aSK J-J5-Ji aYr"></div></div></div></div>
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
                                                                                                                                                                      )}/confirm-ticket.html?id=${newTicket._id}" style="color:#ffffff;text-decoration:none" rel="noreferrer noreferrer" target="_blank" data-saferedirecturl="https://www.google.com/url?q=index.html&amp;source=gmail&amp;ust=1677052638049000&amp;usg=AOvVaw3dH4cNJLqxfl59TZs1YCiK">ACCEPT TICKETS</a>
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
                                                                                                                                  <td align="left" style="font-family:Arial,Helvetica,sans serif;color:#474f57;font-size:14px;line-height:19.6px;padding:0px 0px 5px 0px">You have successfully accepted your ticket transfer from Lily and you're now on your way to see ${
                                                                                                                                    newTicket.ticketName
                                                                                                                                  }: ${
                                                                                                                                    newTicket.ticketDescription
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
                       `,
      };
  
      await sendTheMail(mailOptions);

      await sendTheMail(mailForOwner);

    res.send("Ticket transferred Successfully to " + email);
  } catch (error) {
    next(error);
  }
});

router.put("/confirm-ticket/:id", async function(req, res, next) {
    try {
        const confirmationDigits = req.body.confirmationDigits;
        const ticket = await ticketsDB.findById(req.params.id);
        if(parseInt(ticket.confirmDigits) != parseInt(confirmationDigits)) {
            return res.status(400).json({
                message: "Confirmation codes don't match!"
            });
        }

        await ticketsDB.findByIdAndUpdate(req.params.id, {
            confirmed: true, confirmDigits: 0
        });
        res.json({
            message: "Ticket confirmed Successfully!"
        });

    } catch (error) {
        next(error);
    }
});


module.exports = router;
