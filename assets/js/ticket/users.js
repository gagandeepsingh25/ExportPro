// ----------------------------- User ------------------------------------>

var u_selected_template = 'CSV1';
async function checkUserSelections() {
        var userTemplateSelect = document.getElementById('userTemplateSelect');
        var selectedOption_template = userTemplateSelect.options[userTemplateSelect.selectedIndex];
        u_selected_template = selectedOption_template.value;
        return u_selected_template;
    }

async function searchUsersData(query) {
    query = query.toString();
    if (!query) {
        console.error('Invalid search query. Please provide a valid query.');
        return Promise.reject('Invalid search query.');
    }

    const auth = `Basic ${btoa(`${username}/token:${tok}`)}`;
    const headers = {
        Authorization: auth,
        'Content-Type': 'application/json',
    };

    var user_data = {};

    const url = `${zendesk_domain}/api/v2/search.json?query=type:user ${query}&sort_by=created_at&sort_order=asc`;

    try {
        const response = await client.request(url, {
            method: 'GET',
            headers: headers,
        });

        var u_d = [];
        u_d = response['results'];

//        if (response && response.results.length) {
//            const searchSelectMessage = $('#userSelectMessage');
//            const lengthMessage = 'This view contains ' + response.results.length + ' users.';
//            searchSelectMessage.text(lengthMessage).show();
//        } else {
//            const searchSelectMessage = $('#userSelectMessage');
//            const lengthMessage = 'This view contains 0 users.';
//            searchSelectMessage.text(lengthMessage).show();
//        }

//        const userData = [];
//        for (let i = 0; i < u_d.length; i++) {
//            try {
//                if ('organization_id' in u_d[i]) {
//                    const org_id = u_d[i]['organization_id'];
//                    if (org_id && org_id !== 'null' && org_id !== undefined) {
//                        const orgUrl = `${zendesk_domain}/api/v2/organizations/${org_id}`;
//                        const orgResponse = await fetch(orgUrl, {
//                            method: 'GET',
//                            headers: {
//                                Authorization: auth,
//                                'Content-Type': 'application/json',
//                            },
//                        });
//                        const orgData = await orgResponse.json();
//                        u_d[i]['organization_data'] = orgData.organization;
//                    } else {
//                        u_d[i]['organization_data'] = {};
//                    }
//                } else {
//                    u_d[i]['organization_id'] = null;
//                    u_d[i]['organization_data'] = {};
//                }
//
//                if ('group_id' in u_d[i]) {
//                    const grp_id = u_d[i]['group_id']; // Use u_d[i] instead of i
//                    if (grp_id && grp_id !== 'null' && grp_id !== undefined) {
//                        const groupUrl = `${zendesk_domain}/api/v2/groups/${grp_id}`;
//                        const groupResponse = await fetch(groupUrl, {
//                            method: 'GET',
//                            headers: {
//                                Authorization: auth,
//                                'Content-Type': 'application/json',
//                            },
//                        });
//                        const groupData = await groupResponse.json();
//                        u_d[i]['group_data'] = groupData.group; // Use u_d[i] instead of i
//                    } else {
//                        u_d[i]['group_data'] = {};
//                    }
//                } else {
//                    u_d[i]['group_id'] = null;
//                    u_d[i]['group_data'] = {};
//                }
//                userData.push(i);
//            } catch (error) {
//                console.error('Error processing user data:', error);
//            }
//            user_data = { 'user_data': userData};
//
//            //user_data = { 'user_data': i};
//        }
        return user_data = { 'user_data': u_d};
    } catch (error) {
        console.error('Error fetching search users data:', error);
        return Promise.reject(error); // Reject with the error
    }
}


// Function to create a CSV file from selected fields
async function createUsersContent(search_users_data) {
    try {
        var selectedFieldsArray = [];
        for (var i = 0; i < search_users_data.length; i++) {
            var user = search_users_data[i];

            var selectedFieldsObject = {};
            Object.keys(user).forEach(key => {
                let value = user[key];
                if (typeof value === 'object') {
                } else {
                    selectedFieldsObject['User_' + key] = '"' + value.toString() + '"';
                }
            });
            // ***************************************************

            selectedFieldsArray.push(selectedFieldsObject);
        }

        if (u_selected_template == 'JSON'){
            // Convert the arrays to JSON format
            var jsonContent = JSON.stringify(selectedFieldsArray, null, 2);
            if(jsonContent) {
                downloadJSON(jsonContent, 'user-export.json');
            } else {
                downloadJSON('{}', 'user-export.json');
            }
        }else if (u_selected_template == 'XML') {
            // Convert the arrays to XML format
            var xml = convertArrayOfObjectsToXML_user(selectedFieldsArray);
            if(xml) {
                downloadXML(xml, 'user-export.xml');
            } else {
                downloadXML('', 'user-export.xml');
            }
        }else{
            var csv = convertArrayOfObjectsToCSV(selectedFieldsArray);
            if (csv) {
                downloadCSV(csv, 'user-export.csv');
            } else {
                downloadCSV('', 'user-export.csv');
            }
        }
    } catch (error) {
        console.error('Error in users create Content function:', error);
    }
}


// Add an event listener to the "Export" button
document.getElementById('search_user_export_Button').addEventListener('click', async function () {
    try {
        var result_data = [];
        var userViewSelect = document.getElementById('userSearch');
        var query = userViewSelect.value;
        if (u_selected_template){
            if(query){
                showLoader();
                var result = await searchUsersData(query);
                result_data = result['user_data'];
            }else{
                hideLoader();
            }
        }
        await createUsersContent(result_data);
    } catch (error) {
        hideLoader();
        console.error('Error fetching onclick users export button:', error);
    }
});
//*********************************************************************************************************
// Function to convert an array of objects to XML format
function convertArrayOfObjectsToXML_user(ticketArray) {
    try {
        if (!ticketArray || ticketArray.length === 0) {
            return '';
        }

        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<users>\n';

        for (var i = 0; i < ticketArray.length; i++) {
            var ticketObject = ticketArray[i];
            xml += '<user>\n';

            for (var key in ticketObject) {
                if (ticketObject.hasOwnProperty(key)) {
                    // Ensure valid XML element name by replacing invalid characters
                    var sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                    xml += `<${sanitizedKey}>${escapeXml(ticketObject[key])}</${sanitizedKey}>\n`;
                }
            }

            xml += '</user>\n';
        }

        xml += '</users>';
        return xml;
    } catch (error) {
        console.error('Error converting array to XML:', error);
        return '';
    }
}