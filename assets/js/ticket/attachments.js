var attachments_data = [];
var a_selected_template = 'CSV1';

async function checkAttachmentSelections() {
    var attachmentTemplateSelect = document.getElementById('attachmentTemplateSelect');

    var selectedOption_template = attachmentTemplateSelect.options[attachmentTemplateSelect.selectedIndex];

    var selectedValue_temp = selectedOption_template.value;
    a_selected_template = selectedValue_temp;
    return a_selected_template;
}

// FETCH COMMENT DATA FROM API
async function AttachCommentInfo(start, end) {
    try {
        var AttachmentData = [];
        var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket&created>${start}&created<${end}`;
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);
        const ticketsArray = data['results'];

        if (ticketsArray.length){
            for (var i = 0; i < ticketsArray.length; i++) {
                var ticket = ticketsArray[i];
                var id = ticket["id"];
                if(id){
                    var url = `${zendesk_domain}/api/v2/tickets/${id}/comments`;
                    var settings = {
                        url: url,
                        type: 'GET',
                        dataType: 'json',
                    };
                    const Data = await client.request(settings);
                    const commentsData = Data['comments'];
                    for (var j = 0; j < commentsData.length; j++) {
                        var cmt = commentsData[j];
                        if (cmt['attachments'].length >0){
                            var att = cmt['attachments'];
                            if (att.length>0){
                                for (var k = 0; k < att.length; k++) {
                                    var att_data = att[k];
                                    AttachmentData.push(att_data);
                                }
                            }
                        }
                    }
                }
                else{
                }
            }
        }
    } catch (error) {
    }
    return AttachmentData;
}


// Function to create a CSV file from selected fields
async function createAttachmentContent(attachments_data) {
    try {
        var selectedFieldsArray = [];
        for (var i = 0; i < attachments_data.length; i++) {
            try {
                var ticket = attachments_data[i];

                var selectedFieldsObject = {};
                // ***************************************************
                Object.keys(ticket).forEach(key => {
                    let value = ticket[key];
                    if (typeof value === 'object') {
                    } else {
                        selectedFieldsObject['Attachment_' + key] = '"' + value.toString() + '"';
                    }
                });

                selectedFieldsArray.push(selectedFieldsObject);
            }catch (error) {
            }

        }
        if (a_selected_template == 'JSON'){
            // Convert the arrays to JSON format
            var jsonContent = JSON.stringify(selectedFieldsArray, null, 2);
            if(jsonContent) {
                downloadJSON(jsonContent, 'attachments-export.json');
            } else {
                downloadJSON('{}', 'attachments-export.json');
            }
        }else if (a_selected_template == 'XML') {
            // Convert the arrays to XML format
            var xml = convertArrayOfObjectsToXML_attach(selectedFieldsArray);
            if(xml) {
                downloadXML(xml, 'attachments-export.xml');
            } else {
                downloadXML('', 'attachments-export.xml');
            }
        }else{
            var csv = convertArrayOfObjectsToCSV(selectedFieldsArray);
            if (csv) {
                downloadCSV(csv, 'attachments-export.csv');
            } else {
                downloadCSV('', 'attachments-export.csv');
            }
        }

    } catch (error) {
    }
}


// Add an event listener to the "Export" button
document.getElementById('attachment_export_Button').addEventListener('click', async function () {
    try {
        var ast = document.getElementById('attachstartdate').value;
        var aet = document.getElementById('attachenddate').value;

        var t_start = attach_formatDateToUnixTimestamp(ast);
        var t_end = attach_formatDateToUnixTimestamp(aet);

        if (a_selected_template){
            if(ast && aet){
                showLoader();
                attachments_data = await AttachCommentInfo(ast, aet)
            }else{
                hideLoader();
            }
        }
        await createAttachmentContent(attachments_data);
    } catch (error) {
        hideLoader();
    }
});

//***********************************************************************************************************
// Function to convert an array of objects to XML format
function convertArrayOfObjectsToXML_attach(ticketArray) {
    try {
        if (!ticketArray || ticketArray.length === 0) {
            return '';
        }

        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<attachments>\n';

        for (var i = 0; i < ticketArray.length; i++) {
            var ticketObject = ticketArray[i];
            xml += '<attachment>\n';

            for (var key in ticketObject) {
                if (ticketObject.hasOwnProperty(key)) {
                    // Ensure valid XML element name by replacing invalid characters
                    var sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                    xml += `<${sanitizedKey}>${escapeXml(ticketObject[key])}</${sanitizedKey}>\n`;
                }
            }

            xml += '</attachment>\n';
        }

        xml += '</attachments>';
        return xml;
    } catch (error) {
        return '';
    }
}

function attach_formatDateToUnixTimestamp(dateString) {
    var parts = dateString.split('/');
    var formattedDate = new Date(parts[2], parts[0] - 1, parts[1]);
    return Math.floor(formattedDate.getTime() / (1000 * 60 * 60 * 24));
}
