var Search_Org_Data = [];
var o_selected_template = 'CSV1';
// ************************************** search bases organizations *********************************************
// // -----------------Organization ---------------------
// Function to check selections in organization export
async function checkOrganizationSelections() {
    var templateSelect = document.getElementById('organizationTemplateSelect');
    var selectedOption_template = templateSelect.options[templateSelect.selectedIndex];
    var selectedValue_temp = selectedOption_template.value;
    o_selected_template = selectedValue_temp;
    return o_selected_template;
}


async function searchOrganizationData(query) {
    query = query.toString();
    if (!query) {
        return Promise.reject('Invalid search query.');
    }

    const auth = `Basic ${btoa(`${username}/token:${tok}`)}`;
    const headers = {
        Authorization: auth,
        'Content-Type': 'application/json',
    };

    const url = `${zendesk_domain}/api/v2/search.json?query=type:organization name:${query}&sort_by=created_at&sort_order=asc`;

    // Initialize timeout variables
    let timeoutId;
    const timeoutPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error('Request timed out'));
        }, 5000); // Adjust the timeout duration as needed (e.g., 5000 milliseconds)
    });

    try {
        // Make the API request and race it against the timeout
        const responsePromise = client.request(url, {
            method: 'GET',
            headers: headers,
        });

        const response = await Promise.race([responsePromise, timeoutPromise]);

        // Clear the timeout if the request succeeds
        clearTimeout(timeoutId);

        const o_d = response['results'];
        return { 'org_data': o_d };
    } catch (error) {
        // Clear the timeout if an error occurs
        clearTimeout(timeoutId);
        return Promise.reject(error);
    }
}


// Function to create a CSV file from selected fields
async function createOrganizationContent(Search_Org_Data) {
    try {
        var selectedFieldsArray = [];
        for (var i = 0; i < Search_Org_Data.length; i++) {
            var org = Search_Org_Data[i];

            var selectedFieldsObject = {};

            Object.keys(org).forEach(key => {
                let value = org[key];
                if (typeof value === 'object') {
                } else {
                    selectedFieldsObject['Organization_' + key] = '"' + value.toString() + '"';
                }
            });

            // ***************************************************

            selectedFieldsArray.push(selectedFieldsObject);
        }

        if (o_selected_template == 'JSON'){
            // Convert the arrays to JSON format
            var jsonContent = JSON.stringify(selectedFieldsArray, null, 2);
            if(jsonContent) {
                downloadJSON(jsonContent, 'organization-export.json');
            } else {
                downloadJSON('{}', 'organization-export.json');
            }
        }else if (o_selected_template == 'XML') {
            // Convert the arrays to XML format
            var xml = convertArrayOfObjectsToXML_org(selectedFieldsArray);
            if(xml) {
                downloadXML(xml, 'organization-export.xml');
            } else {
                downloadXML('', 'organization-export.xml');
            }
        }else{
            var csv = convertArrayOfObjectsToCSV(selectedFieldsArray);
            if (csv) {
                downloadCSV(csv, 'organization-export.csv');
            } else {
                downloadCSV('', 'organization-export.csv');
            }
        }
    } catch (error) {
    }
}

// Add an event listener to the "Export" button
document.getElementById('search_org_export_Button').addEventListener('click', async function () {
    try {
        var viewSelect = document.getElementById('orgSearchInput');
        var query = viewSelect.value;

        if (o_selected_template) {
            if (query){
                showLoader();
                const result = await searchOrganizationData(query);
                Search_Org_Data = result.org_data;
            }else{
                hideLoader();
            }
        }
        await createOrganizationContent(Search_Org_Data);
    } catch (error) {
        hideLoader();
    }
});
//**********************************************************************************************************

async function checkOrganizationSelections_time() {
    var orgViewSelect = document.getElementById('orgtemplateSelect_time');

    var selectedOption_template = orgViewSelect.options[orgViewSelect.selectedIndex];

    var selectedValue_temp = selectedOption_template.value;
    o_selected_template = selectedValue_temp;
    return o_selected_template;
}


async function fetchTimeBasedOrganizationData(start, end) {
    var organizationsArray = [];
    try {
        var url = `${zendesk_domain}/api/v2/incremental/organizations.json?start_time=${start}&end_time=${end}`;
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);
        organizationsArray = data['organizations'];
    } catch (error) {
    }
    return organizationsArray;
}

// Add an event listener to the "Export" button
document.getElementById('time_org_export_Button').addEventListener('click', async function () {
    try {
        var ost = document.getElementById('orgstartdate').value;
        var oet = document.getElementById('orgenddate').value;

        var t_start = formatDateToUnixTimestamp(ost);
        var t_end = formatDateToUnixTimestamp(oet);

        if (o_selected_template){
            if(ost && oet){
                showLoader();
                Search_Org_Data = await fetchTimeBasedOrganizationData(t_start, t_end)
            }else{
                hideLoader();
            }
        }

        await createOrganizationContent(Search_Org_Data);
    } catch (error) {
        hideLoader();
    }
});

//**********************************************************************************************************


// Function to convert an array of objects to XML format
function convertArrayOfObjectsToXML_org(ticketArray) {
    try {
        if (!ticketArray || ticketArray.length === 0) {
            return '';
        }

        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<organizations>\n';

        for (var i = 0; i < ticketArray.length; i++) {
            var ticketObject = ticketArray[i];
            xml += '<organization>\n';

            for (var key in ticketObject) {
                if (ticketObject.hasOwnProperty(key)) {
                    // Ensure valid XML element name by replacing invalid characters
                    var sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                    xml += `<${sanitizedKey}>${escapeXml(ticketObject[key])}</${sanitizedKey}>\n`;
                }
            }

            xml += '</organization>\n';
        }

        xml += '</organizations>';
        return xml;
    } catch (error) {
        return '';
    }
}

function formatDateToUnixTimestamp(dateString) {
    var parts = dateString.split('/');
    var formattedDate = new Date(parts[2], parts[0] - 1, parts[1]);
    return Math.floor(formattedDate.getTime() / (1000 * 60 * 60 * 24));
}