
// MAIL_USERNAME=rodrigo.noronha@v2solucoes.tec.br
// MAIL_PASSWORD=eunaosei123
// MAIL_FROM=rodrigo.noronha@v2solucoes.tec.br
// MAIL_PORT=143
// MAIL_SERVER=mail.v2solucoes.tec.br
// MAIL_FROM_NAME=Codhab

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: "mail.v2solucoes.tec.br",
    port: 25,
    secure: false, // true for port 465, false for other ports

    auth: {
        user: "rodrigo.noronha@v2solucoes.tec.br",
        pass: "eunaosei123",
    },
});

// async..await is not allowed in global scope, must use a wrapper
async function main() {
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
        to: "rodrigodnoronha@gmail.com", // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Hello world?</b>", // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

main().catch(console.error);