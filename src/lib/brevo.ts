import * as brevo from "@getbrevo/brevo"
import { brevoEmail } from "@/interfaces/brevoEmail.interface";

const apiInstance = new brevo.TransactionalEmailsApi;

apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
     process.env.BREVO_API_KEY as string )

     const smtpEmail = new brevo.SendSmtpEmail()



export async function sendEmail({to, subject, htmlContent}: brevoEmail) {        
smtpEmail.subject= subject;
smtpEmail.to= to;
smtpEmail.htmlContent= htmlContent
console.log("envio mail");

smtpEmail.sender={ name:"Gym Master", 
    email:"gym-master@adminsitracion.com"} //FALTA CREAR EL EMAIL
try {
  await apiInstance.sendTransacEmail(smtpEmail);
  console.log("Respuesta de Brevo exitosa");
} catch (error) {
  console.error("Error enviando email:", error);
}}

  


