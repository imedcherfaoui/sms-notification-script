require('dotenv').config();

const tas = process.env.TWILIO_ACCOUNT_SID;
const tat = process.env.TWILIO_AUTH_TOKEN;
const tpn = process.env.TWILIO_PHONE_NUMBER;
const ppn = process.env.PERSONAL_PHONE_NUMBER;

const puppeteer = require('puppeteer');

//fonction envoi ssms
function envoyer_sms(message) {
    const accountSid = tas; // Your Account SID from www.twilio.com/console
    const authToken = tat;  // Your Auth Token from www.twilio.com/console
    const client = require('twilio')(accountSid, authToken);

    client.messages
        .create({
            body: message,
            from: tpn,
            to: ppn
        })
        .then(() => {
            console.log('SMS sent successfully. Exiting the script.');
            process.exit(); // Stop the script after sending the SMS
        })
        .catch(error => {
            console.error('Error sending SMS:', error);
            process.exit(1); // Exit with an error code
        });

}
async function verifier_machines() {

    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto('http://gad.lmcontrol.com/bienvenue');
        await page.waitForSelector('#username_field');

        await page.type('#username_field', '178');
        await page.type('#password_field', 'laverie');

        await page.click('#connection_submit');

        // Wait for the table to appear
        await page.waitForSelector('#machines_list_table');

        // Evaluate the table content in the browser context
        const tableData = await page.evaluate(() => {
            const tableRows = Array.from(document.querySelectorAll('#machines_list_table tbody tr'));
            const result = [];

            tableRows.forEach(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                if (cells.length >= 2) {
                    const firstCellContent = cells[0].textContent.trim();
                    const secondCellContent = cells[1].textContent.trim();
                    
                    if (secondCellContent === 'Libre') {
                        result.push(firstCellContent);
                    }
                }
            });

            return result;
        });

        console.log('Data :', tableData);

        if (tableData.includes('Machine N1') || tableData.includes('Machine N2') || tableData.includes('Sechoir N3')) { //si une machine à laver est libre
            envoyer_sms('Les machines sont libres !' + tableData);
        }

        await browser.close();
    })();
}

verifier_machines();

setInterval(verifier_machines, 1000 * 60); //1 minutes