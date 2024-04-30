var c_selected_template ='CSV1';
var tickets_data = [];

async function checkCommentSelections() {
    var commentTemplateSelect = document.getElementById('commentTemplateSelect');
    var selectedOption_template = commentTemplateSelect.options[commentTemplateSelect.selectedIndex];
    var selectedValue_temp = selectedOption_template.value;
    c_selected_template = selectedValue_temp;
    return c_selected_template;
}


// FETCH COMMENT DATA FROM API
async function commentInfo(start, end) {
    try {
        var Updated_Array = [];
        var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket&created>${start}&created<${end}`;
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);
        const ticketsArray = data['results'];

        for (var i = 0; i < ticketsArray.length; i++) {
            var ticket = ticketsArray[i];
            if(ticket["id"]){
                var CommentApiData = [];
                var AuditApiData = [];
                CommentApiData = await fetchCommentData(ticket["id"]);
                AuditApiData = await fetchAuditsData(ticket["id"]);
                var new_dict = {
                    'comment_data':CommentApiData,
                    'audit_data':AuditApiData
                }
            }
            Updated_Array.push(new_dict);
        }
    } catch (error) {
    }
    return Updated_Array;
}

async function fetchCommentData(id) {
    var commentsData = [];
    try {
        var url = `${zendesk_domain}/api/v2/tickets/${id}/comments`;
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const Data = await client.request(settings);
        commentsData = Data['comments'];
    } catch (error) {
    }
    return commentsData;
}

async function fetchAuditsData(id) {
    var auditData = [];
    try {
        var url = `${zendesk_domain}/api/v2/tickets/${id}/audits`;
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);
        auditData = data['audits'];
    } catch (error) {
    }
    return auditData;
}


// Function to create a CSV file from selected fields
async function createCommentsContent(tickets_data) {
    try {
        var selectedFieldsArray = [];

        for (var i = 0; i < tickets_data.length; i++) {
            var ticket = tickets_data[i];
            var comment_ticket_data = ticket['comment_data'];
            var audit_ticket_data = ticket['audit_data'];

            var selectedFieldsObject = {};
            if(comment_ticket_data.length>0){
                for (var j = 0; j < comment_ticket_data.length; j++) {
                     Object.keys(comment_ticket_data[j]).forEach(key => {
                           let value = comment_ticket_data[j][key];
                           if (typeof value === 'object') {
                           }else if(key == 'html_body'){
                           }else {
                                selectedFieldsObject['Comment_' + key] = '"' + value.toString() + '"';
                           }
                    });
                    selectedFieldsArray.push(selectedFieldsObject);
                }
            }
            if(audit_ticket_data.length>0){
                for (var j = 0; j < audit_ticket_data.length; j++) {
                     Object.keys(audit_ticket_data[j]).forEach(key => {
                           let value = audit_ticket_data[j][key];
                           if (typeof value === 'object') {
                               if (key == 'metadata') {
                                    if (Object.keys(value['system']).length !== 0) {
                                        selectedFieldsObject['client'] = '"' + value['system']['client'].toString() + '"';
                                        selectedFieldsObject['location'] = '"' + value['system']['location'].toString() + '"';
                                        selectedFieldsObject['ip_address'] = '"' + value['system']['ip_address'].toString() + '"';
                                        selectedFieldsObject['latitude'] = '"' + value['system']['latitude'].toString() + '"';
                                        selectedFieldsObject['longitude'] = '"' + value['system']['longitude'].toString() + '"';
                                    }
                               }
                           }else {
                                selectedFieldsObject['Audit_' + key] = '"' + value.toString() + '"';
                           }

                    });
                    selectedFieldsArray.push(selectedFieldsObject);
                }
            }
        }

        if (c_selected_template == 'JSON'){
            // Convert the arrays to JSON format
            var jsonContent = JSON.stringify(selectedFieldsArray, null, 2);
            if(jsonContent) {
                downloadJSON(jsonContent, 'comment-export.json');
            } else {
                downloadJSON('{}', 'comment-export.json');
            }
        }else if (c_selected_template == 'XML') {
            // Convert the arrays to XML format
            var xml = convertArrayOfObjectsToXML_comment(selectedFieldsArray);
            if(xml) {
                downloadXML(xml, 'comment-export.xml');
            } else {
                downloadXML('', 'comment-export.xml');
            }
        }else{
            var csv = convertArrayOfObjectsToCSV(selectedFieldsArray);
            if (csv) {
                downloadCSV(csv, 'comment-export.csv');
            } else {
                downloadCSV('', 'comment-export.csv');
            }
        }
    } catch (error) {
    }
}


// Add an event listener to the "Export" button
document.getElementById('comment_export_Button').addEventListener('click', async function () {
    try {
        if (c_selected_template) {
            if (start_time && end_time){
                showLoader();
                tickets_data = await commentInfo(start_time, end_time)
            }else{
                hideLoader();
            }
        }
        await createCommentsContent(tickets_data);
    } catch (error) {
        hideLoader();
    }
});

// *******************************************************************************************************
// Function to convert an array of objects to XML format
function convertArrayOfObjectsToXML_comment(ticketArray) {
    try {
        if (!ticketArray || ticketArray.length === 0) {
            return '';
        }

        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<comments>\n';

        for (var i = 0; i < ticketArray.length; i++) {
            var ticketObject = ticketArray[i];

            xml += '<comment>\n';

            for (var key in ticketObject) {
                if (ticketObject.hasOwnProperty(key)) {
                    // Ensure valid XML element name by replacing invalid characters
                    var sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                    xml += `<${sanitizedKey}>${escapeXml(ticketObject[key])}</${sanitizedKey}>\n`;
                }
            }

            xml += '</comment>\n';
        }

        xml += '</comments>';
        return xml;
    } catch (error) {
        return '';
    }
}