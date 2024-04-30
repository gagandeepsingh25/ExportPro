// ******** Legs ********
var legs_data = [];
var calls_data = [];
var l_selected_template = 'CSV1';
// Function to check selections in Legs Export component
async function checkLegsSelections() {
   var legsTemplateSelect = document.getElementById('legsTemplateSelect');
   var selectedOption_template = legsTemplateSelect.options[legsTemplateSelect.selectedIndex];
   var selectedValue_temp = selectedOption_template.value;
   l_selected_template = selectedValue_temp;
   return l_selected_template;
}

// FETCH COMMENT DATA FROM API
async function SearchLegsInfo(t_start, t_end) {
    try {
        var Updated_Array = [];
        var url = `${zendesk_domain}/api/v2/channels/voice/stats/incremental/legs?start_time=${t_start}&end_time=${t_end}`;
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);
        Updated_Array = data['legs'];
    } catch (error) {
    }
    return Updated_Array;
}

// FETCH COMMENT DATA FROM API
async function SearchCallsInfo(t_start, t_end) {
    try {
        var Updated_Array = [];
        var url = `${zendesk_domain}/api/v2/channels/voice/stats/incremental/calls?start_time=${t_start}&end_time=${t_end}`;
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);
        Updated_Array = data['calls'];
    } catch (error) {
    }
    return Updated_Array;
}


// Function to create a CSV file from selected fields
async function createLegsContent(legs_api_data, calls_api_data) {
    try {
        var selectedFieldsArray = [];

        for (var i = 0; i < legs_api_data.length; i++) {
            var ticket = legs_api_data[i];

            var selectedFieldsObject = {};
            // ***************************************************
            Object.keys(ticket).forEach(key => {
                let value = ticket[key];
                if (typeof value === 'object') {
                } else {
                    selectedFieldsObject['Leg_' + key] = '"' + value.toString() + '"';
                }
            });
            selectedFieldsArray.push(selectedFieldsObject);
        }

        for (var j = 0; j < calls_api_data.length; j++) {
            var ticket = calls_api_data[j];

            var selectedFieldsObject = {};
            // ***************************************************
            Object.keys(ticket).forEach(key => {
                let value = ticket[key];
                if (typeof value === 'object') {
                } else {
                    selectedFieldsObject['Call_' + key] = '"' + value.toString() + '"';
                }
            });
            selectedFieldsArray.push(selectedFieldsObject);
        }

        if (l_selected_template == 'JSON'){
            // Convert the arrays to JSON format
            var jsonContent = JSON.stringify(selectedFieldsArray, null, 2);
            if(jsonContent) {
                downloadJSON(jsonContent, 'talk-export.json');
            } else {
                downloadJSON('{}', 'talk-export.json');
            }
        }else if (l_selected_template == 'XML') {
            // Convert the arrays to XML format
            var xml = convertArrayOfObjectsToXML(selectedFieldsArray);
            if(xml) {
                downloadXML(xml, 'talk-export.xml');
            } else {
                downloadXML('', 'talk-export.xml');
            }
        }else{
            var csv = talk_convertArrayOfObjectsToCSV(selectedFieldsArray);
            if (csv) {
                downloadCSV(csv, 'talk-export.csv');
            } else {
                downloadCSV('No data available', 'talk-export.csv');
            }
        }
    } catch (error) {
    }
}

// Add an event listener to the "Export" button
document.getElementById('time_legs_export_Button').addEventListener('click', async function () {
    try {
        var lst = document.getElementById('talkstartdate').value;
        var let = document.getElementById('talkenddate').value;

        var t_start = talk_formatDateToUnixTimestamp(lst);
        var t_end = talk_formatDateToUnixTimestamp(let);

        if (l_selected_template){
            if(lst && let){
                showLoader();
                legs_data = await SearchLegsInfo(t_start, t_end)
                calls_data = await SearchCallsInfo(t_start, t_end)
            }else{
                hideLoader();
            }
        }
        await createLegsContent(legs_data, calls_data);
    } catch (error) {
        hideLoader();
    }
});


function talk_formatDateToUnixTimestamp(dateString) {
    var parts = dateString.split('/');
    var formattedDate = new Date(parts[2], parts[0] - 1, parts[1]);
    return Math.floor(formattedDate.getTime() / (1000 * 60 * 60 * 24));
}

// Function to convert an array of objects to CSV format
function talk_convertArrayOfObjectsToCSV(ticketArray) {
    try {
        // Check if ticketArray is defined and not empty
        if (!ticketArray || ticketArray.length === 0) {
            return 'No data available';
        }

        var ticketKeys = Object.keys(ticketArray[0]);

        var header = ticketKeys.join(',') + '\n';

        var csv = ticketArray.map(function (item, index) {
            var row = Object.values(item).join(',');
            return row + '\n';
        });

        return header + csv.join('');
    } catch (error) {
        return '';
    }
}
