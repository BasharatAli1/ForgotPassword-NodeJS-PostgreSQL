const nodemailer = require("nodemailer");
const envs = require("../env.vars.json");

const sendEmail = async (receiverMail, link) => {
    try {
        var smtpTransport = nodemailer.createTransport({
            name: envs.mail_server,
            host: envs.mail_server,
            port: 465,
            secure: true,
            // service: 'Gmail',
            auth: {
                user: envs.mail_username,
                pass: envs.mail_password
            }
        });
        // smtpTransport.verify((err, success) => {
        //     if (err) console.error(err);
        //     console.log('Your config is correct');
        // });
        var mailOptions = {
            to: receiverMail,
            from: envs.mail_username,
            subject: "Password Reset Token",
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
             link
        };
        smtpTransport.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + subject);
            }
        });
    } catch (error) {
        console.log(error, "email not sent");
    }
};

module.exports = sendEmail;