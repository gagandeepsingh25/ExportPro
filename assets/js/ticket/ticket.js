var tok;
var userProfileUrl;
var client = ZAFClient.init();

let username, zendesk_domain, subdomain;
// Define the Promise function
function fetchData() {
  return new Promise((resolve, reject) => {
    client.get('currentUser').then((data) => {
      username = data.currentUser.email;
      return client.get('instances');
    }).then((data) => {
      const instanceKeys = Object.keys(data.instances);
      if (instanceKeys.length > 0) {
        const firstInstanceKey = instanceKeys[0];
        subdomain = data.instances[firstInstanceKey].account.subdomain;
        zendesk_domain = 'https://' + subdomain + '.zendesk.com';
        resolve({'zendesk_domain': zendesk_domain, 'subdomain': subdomain}); // Resolve the Promise
      } else {
        reject('No instances found in the response.');
      }
    }).catch((error) => {
      reject('Error fetching data from Zendesk: ' + error);
    });
  });
}

// Call the Promise function and handle the results
fetchData().then((data) => {
    zendesk_domain = data['zendesk_domain'];
    subdomain = data['subdomain'];
    const myPromise = new Promise((resolve, reject) => {
        try {
            const headers = {
                Authorization: `Basic ${btoa(`${username}/token:${tok}`)}`,
                'Content-Type': 'application/json'
            };
            // Helper function to make an asynchronous request
            const makeRequest = async (url) => {
                try {
                    const response = await client.request(url, {
                        type: "GET",
                        headers: headers,
                    });
                    return response;
                } catch (error) {
                    return {};
                }
            };
            // Array to store all promises for asynchronous requests
            var user_url = zendesk_domain + '/api/v2/users/me'
            const promises = [makeRequest(user_url)];

            // Wait for all promises to resolve
            const responses = Promise.all(promises);
            resolve(responses);
        } catch (error) {
            reject(error);
        }
    });
    myPromise.then((data) => {
        if(data){
            var settingsProfile = document.getElementsByClassName("settings_profile");

            var additionalInfoImage = document.getElementById('additionalInfoImage');
            var plan_profile1 = document.getElementById('sub_profile_free');
            var plan_profile2 = document.getElementById('sub_profile_silver');
            var plan_profile3 = document.getElementById('sub_profile_gold');
            if (data[0].user && data[0].user.photo && data[0].user.photo.content_url) {
                var profile_image_url = data[0]['user']['photo']['content_url']
                userProfileUrl = profile_image_url;
                additionalInfoImage.src = userProfileUrl;
            }else{
                additionalInfoImage.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
            }
        }
    }).catch((error) => {
    });
    checkUserPresence();
}).catch((error) => {
});

////*************************************************************************************************************
// Function to fetch the API key from the provided API endpoint
async function fetchApiKey() {
    const apiEndpoint = 'https://bluerockapps.co/index.php/wp-json/custom-api/v1/ustk';
    try {
        // Make a GET request to the API endpoint
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Check if the request was successful (status code 2xx)
        if (response.ok) {
            // Parse the response JSON to get the API key
            const data = await response.json();
            const main = data.ustk;
            // Use the API key or store it securely
            return main;
        } else {
        }
    } catch (error) {
    }
}

// Call the function to fetch the API key
fetchApiKey().then((main) => {
    tok = main;
});

// ******************************************* Activation code********************************************
var activationButton = document.getElementById('activationButton');
var activationTab = document.getElementById('activationTab');
var supportNav = document.getElementById('navItems');

//
var free = document.querySelectorAll(".free-class");
var silver = document.querySelectorAll(".silver-class");

// Function to hide activation button
function hideActivationButton() {
    activationButton.style.display = 'none';
}

// Function to show activation button
function showActivationButton() {
    activationButton.style.display = 'block';
}

// Function to handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    showLoader(); // Prevent the default form submission behavior

    var form = event.target; // Get the form element
    var formData = new FormData(form); // Create FormData object from the form

    // Convert FormData to JSON object
    var jsonData = {};
    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    // Fetch data using API
    fetch('https://bluerockapps.co/index.php/wp-json/custom-api/v1/save-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(jsonData)
    })
    .then(response =>{
        if(!response.ok){
            hideLoader();
            document.getElementById('alert_msg').textContent = 'Email already exists';
            return
        }else{
            document.getElementById('alert_msg').textContent = '';
            activationTab.style.display = 'none';
            supportNav.style.display = 'block';
            return response.json();
        }
     })
    .then(data => {
        if(data){
            hideLoader();
            checkUserPresence();
            hideActivationButton();
            supportNav.style.display = 'block';
        }else{
            hideLoader();
        }
    })
    .catch(error => {
    });
}
// Add event listener for form submission
document.getElementById('exportDataFormSubmitform').addEventListener('submit', handleFormSubmit);


var userPlan;
// Function to check if user is present in the database
function checkUserPresence() {
    var userEmail = username;
    if (userEmail) {
        showLoader();
        var url = "https://bluerockapps.co/index.php/wp-json/custom-api/v1/list-user/" + userEmail
        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('User is not present in the database');
            }
            return response.json();
        })
        .then(data => {
            if (data.data && data.data.email == userEmail){
                hideActivationButton();
                supportNav.style.display = 'block';
               userPlan = data.data.plan;
               if (userPlan == 'price_1P90mvFwJbrWuwgF3gZ6YX5R'){ // silver plan

                    var silverPlan = document.getElementById('professional_Plan');
                    silverPlan.querySelector('.text-light').style.display = 'block';
                    silverPlan.style.border = '2px solid #dc8389';
                    silverPlan.style.borderRadius = '15px';
                    silverPlan.querySelector('.btn').style.display = 'none';

                    document.getElementById("free-tem-plan").removeAttribute("onclick");

                    silver.forEach(function(element) {
                        element.classList.add("disabled");
                    });

               }else if (userPlan == 'price_1P90mvFwJbrWuwgFYaifSdJ5'){ // gold plan

                    var goldPlan = document.getElementById('enterprise_Plan');
                    goldPlan.querySelector('.text-light').style.display = 'block';
                    goldPlan.style.border = '2px solid #dc8389';
                    goldPlan.style.borderRadius = '15px';
                    goldPlan.querySelector('.btn').style.display = 'none';
               }else{
                    $('#multiSelectDropdown').addClass("disabled");

                    var freePlan = document.getElementById('free_Plan');
                    freePlan.querySelector('.text-light').style.display = 'block';
                    freePlan.style.border = '2px solid #dc8389';
                    freePlan.style.borderRadius = '15px';
                    freePlan.querySelector('.btn').style.display = 'none';

                    free.forEach(function(element) {
                        element.classList.add("disabled");
                    });

                    // Get the element with the ID "free-btn-class"
                    document.getElementById("free-tem-plan").removeAttribute("onclick");
                    document.getElementById("free-save-plan").removeAttribute("onclick");

                     // Disable JSON and XML options
                    document.getElementById('jsonOption').disabled = true;
                    document.getElementById('xmlOption').disabled = true;
               }
            }else {
                showActivationButton();
            }
            hideLoader();
        })
        .catch(error => {
            showActivationButton();
            hideLoader();
        });
    }
}

// ******************************************* view based tickets START********************************************
var ticket_arr = ['id', 'requester_id', 'submitter_id', 'assignee_id', 'brand_id', 'custom_status_id', 'group_id', 'ticket_form_id', 'organization_id', 'type', 'status', 'subject', 'result_type', 'raw_subject', 'is_public', 'created_at', 'updated_at', 'allow_attachments', 'url'];
var ticket_api_data = [];
var selected_template = 'CSV1';
var selectedValue_ticket = '';

async function checkSelections_selectView(){
    $('#multiSelectDropdown').show();
   // ticket view
    var viewSelect = document.getElementById('ticketView');
    var selectedOption_ticket = viewSelect.options[viewSelect.selectedIndex];
    selectedValue_ticket = selectedOption_ticket.value;
    return selectedValue_ticket;
}

async function checkSelections() {
    // select format
    var templateSelect = document.getElementById('templateSelect');
    var selectedOption_template = templateSelect.options[templateSelect.selectedIndex];
    var selectedValue_temp = selectedOption_template.value;
    selected_template = selectedValue_temp;
    return selected_template;
}

// FETCH TICKET DATA FROM API
async function ticketInfo(selectedValue_ticket) {
    try {
        var Updated_tickets_Array = [];
        if('All unsolved tickets' == selectedValue_ticket){
            var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket status<solved`;
        }else if('Your unsolved tickets' == selectedValue_ticket){
            var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket status<solved`;
        }else if('Pending tickets' == selectedValue_ticket){
            var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket status:pending`;
        }else if('Recently solved tickets' == selectedValue_ticket){
            var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket status:solved updated>2hours`;
        }else if('Recently updated tickets' == selectedValue_ticket){
            var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket updated>2hours`;
        }else if('Unassigned tickets' == selectedValue_ticket){
            var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket status:new assignee:none`;
        }else{
            var url = `${zendesk_domain}/api/v2/tickets.json`;
        }

        // Adding a delay of 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));


        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);

        ticketsArray = data['results'];
        if (ticketsArray.length > 0) {
            for (var i = 0; i < ticketsArray.length; i++) {
                var ticket = ticketsArray[i];
                var par_dict =
                    {'requester_id': ticket['requester_id'],
                     'submitter_id': ticket['submitter_id'],
                     'assignee_id': ticket['assignee_id'],
                     'organization_id': ticket['organization_id'],
                     'group_id': ticket['group_id'],
                     'ticket_form_id': ticket['ticket_form_id'],
                     'brand_id': ticket['brand_id'],
                     'custom_status_id': ticket['custom_status_id'],
                     'id': ticket["id"]
                     };

                var ApiData = await fetchRequesterData(par_dict);
                ticket = {
                    ...ticket,
                    ...ApiData
                };
                Updated_tickets_Array.push(ticket);
            }
        } else {
            // Perform actions when ticketsArray is empty
        }
    } catch (error) {
    }
    return Updated_tickets_Array;
}

function fetchRequesterData(par_dict) {
    return new Promise(async (resolve, reject) => {
        try {
            var requester_id = par_dict.requester_id;
            var submitter_id = par_dict.submitter_id;
            var assignee_id = par_dict.assignee_id;
            var organization_id = par_dict.organization_id;
            var group_id = par_dict.group_id;
            var ticket_form_id = par_dict.ticket_form_id;
            var brand_id = par_dict.brand_id;
            var custom_status_id = par_dict.custom_status_id;
            var t_id = par_dict.id;
            showLoader();
            const headers = {
                Authorization: `Basic ${btoa(`${username}/token:${tok}`)}`,
                'Content-Type': 'application/json'
            };

            let user_data = {};

            // Helper function to make an asynchronous request
            const makeRequest = async (url) => {
                try {
                    const response = await client.request(url, {
                        type: "GET",
                        headers: headers,
                    });
                    return response;
                } catch (error) {
                    return {};
                }
            };

            // Array to store all promises for asynchronous requests
            const promises = [];

            if (requester_id && requester_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/users/${requester_id}`));
            }
            if (submitter_id && submitter_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/users/${submitter_id}`));
            }
            if (assignee_id && assignee_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/users/${assignee_id}`));
            }
            if (organization_id && organization_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/organizations/${organization_id}`));
            }
            if (group_id && group_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/groups/${group_id}`));
            }
            if (ticket_form_id && ticket_form_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/ticket_forms/${ticket_form_id}`));
            }
            if (brand_id && brand_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/brands/${brand_id}`));
            }
            if (custom_status_id && custom_status_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/custom_statuses/${custom_status_id}`));
            }
            if (t_id && t_id !== 'null') {
                promises.push(makeRequest(`${zendesk_domain}/api/v2/tickets/${t_id}/metrics`));
            }

            // Wait for all promises to resolve
            const responses = await Promise.all(promises);

            // Populate user_data with responses
            if (requester_id && requester_id !== 'null') {
                user_data['requester'] = responses.shift();
            }else{
                user_data['requester'] = {};
            }
            if (submitter_id && submitter_id !== 'null') {
                user_data['submitter'] = responses.shift();
            }else{
                user_data['submitter'] = {};
            }
            if (assignee_id && assignee_id !== 'null') {
                user_data['assignee'] = responses.shift();
            }else{
                user_data['assignee'] = {};
            }
            if (organization_id && organization_id !== 'null') {
                user_data['organization'] = responses.shift();
            }else{
                user_data['organization'] = {};
            }
            if (group_id && group_id !== 'null') {
                user_data['groups'] = responses.shift();
            }else{
                user_data['groups'] = {};
            }
            if (ticket_form_id && ticket_form_id !== 'null') {
                user_data['ticket_forms'] = responses.shift();
            }else{
                user_data['ticket_forms'] = {};
            }
            if (brand_id && brand_id !== 'null') {
                user_data['brands'] = responses.shift();
            }else{
                user_data['brands'] = {};
            }
            if (custom_status_id && custom_status_id !== 'null') {
                user_data['custom_statuses'] = responses.shift();
            }else{
                user_data['custom_statuses'] = {};
            }
            if (t_id && t_id !== 'null') {
                user_data['metric_set'] = responses.shift();
            }else{
                user_data['metric_set'] = {};
            }
            resolve(user_data);
        } catch (error) {
            reject(error);
        }
        hideLoader();
    });
}

// Function to create a CSV file from selected fields
async function createContent(ticket_api_data, arr) {
    try {
        var selectedFieldsArray = [];

        for (var i = 0; i < ticket_api_data.length; i++) {
            var ticket = ticket_api_data[i];

            // ***************************************************
            var selectedFieldsObject = {};
            // Export Ticket
            for (var j = 0; j < arr.length; j++) {
                try{
                    var field = arr[j];
                    if (userPlan == 'price_1P90mvFwJbrWuwgF3gZ6YX5R' || userPlan == 'price_1P90mvFwJbrWuwgFYaifSdJ5'){
                        if (field == 'ticket'){
                            ticket_arr.forEach(tick => {
                                var value = ticket[tick];
                                if (value === undefined || value === null) {
                                    selectedFieldsObject['ticket_' + tick] = '';
                                } else {
                                    selectedFieldsObject['ticket_' + tick] = '"' + value.toString() + '"';
                                }
                            });
                        }else if (field == 'requester') {
                                Object.keys(ticket['requester']['user']).forEach(key => {
                                    let value = ticket['requester']['user'][key];
                                    if (typeof value === 'object') {
                                    } else {
                                        selectedFieldsObject['requester_' + key] = '"' + value.toString() + '"';
                                    }
                                });
                        }else if (field == 'submitter') {
                                Object.keys(ticket['submitter']['user']).forEach(key => {
                                    let value = ticket['submitter']['user'][key];
                                    if (typeof value === 'object') {
                                    } else {
                                        selectedFieldsObject['submitter_' + key] = '"' + value.toString() + '"';
                                    }
                                });
                        }else if (field == 'assignee') {
                                Object.keys(ticket['assignee']['user']).forEach(key => {
                                    let value = ticket['assignee']['user'][key];
                                    if (typeof value === 'object') {
                                    } else {
                                        selectedFieldsObject['assignee_' + key] = '"' + value.toString() + '"';
                                    }
                                });
                        }else if (field == 'groups') {
                                Object.keys(ticket['groups']['group']).forEach(key => {
                                    let value = ticket['groups']['group'][key];
                                    if (typeof value === 'object') {
                                    } else {
                                        if (value === undefined || value === null) {
                                            selectedFieldsObject['group_' + key] = '';
                                        }else {
                                            selectedFieldsObject['group_' + key] = '"' + value.toString() + '"';
                                        }
                                    }
                                });
                        }else if (field == 'organization') {
                                if (typeof ticket['organization']['organization'] === 'object' && ticket['organization']['organization'] !== null) {
                                    Object.keys(ticket['organization']['organization']).forEach(key => {
                                        let value = ticket['organization']['organization'][key];
                                        if (typeof value === 'object') {
                                        } else {
                                            if (value === undefined || value === null) {
                                                selectedFieldsObject['organization_' + tick] = '';
                                            }else {
                                                selectedFieldsObject['organization_' + key] = '"' + value.toString() + '"';
                                            }
                                        }
                                    });
                                }
                        }else if (field == 'brands') {
                                Object.keys(ticket['brands']['brand']).forEach(key => {
                                    let value = ticket['brands']['brand'][key];
                                    if (typeof value === 'object') {
                                    } else {
                                        if (value === undefined || value === null) {
                                            selectedFieldsObject['brand_' + key] = '';
                                        }else {
                                            selectedFieldsObject['brand_' + key] = '"' + value.toString() + '"';
                                        }
                                    }
                                });
                        }else if (field == 'metric_set') {
                                Object.keys(ticket['metric_set']['ticket_metric']).forEach(key => {
                                    let value = ticket['metric_set']['ticket_metric'][key];
                                    if (typeof value === 'object') {
                                    } else {
                                        if (value === undefined || value === null) {
                                            selectedFieldsObject['metric_' + key] = '';
                                        }else {
                                            selectedFieldsObject['metric_' + key] = '"' + value.toString() + '"';
                                        }
                                    }
                                });
                        }else if (field == 'ticket_forms') {
                                Object.keys(ticket['ticket_forms']['ticket_form']).forEach(key => {
                                    let value = ticket['ticket_forms']['ticket_form'][key];
                                    if (typeof value === 'object') {
                                    } else {
                                        if (value === undefined || value === null) {
                                            selectedFieldsObject['form_' + key] = '';
                                        }else {
                                            selectedFieldsObject['form_' + key] = '"' + value.toString() + '"';
                                        }
                                    }
                                });
                        }else if (field == 'custom_statuses') {
                                Object.keys(ticket['custom_statuses']['custom_status']).forEach(key => {
                                    let value = ticket['custom_statuses']['custom_status'][key];
                                    if (typeof value === 'object') {
                                    } else {
                                        if (value === undefined || value === null) {
                                            selectedFieldsObject['custom_' + key] = '';
                                        }else {
                                            selectedFieldsObject['custom_' + key] = '"' + value.toString() + '"';
                                        }
                                    }
                                });
                        }else {
                            selectedFieldsObject = {};
                        }
                    }else{
                        if (field == 'ticket'){
                            var ticket_arr_free = ['id', 'requester_id', 'submitter_id', 'assignee_id', 'brand_id',
                            'group_id', 'organization_id', 'status', 'subject', 'created_at', 'updated_at', 'url'];
                            ticket_arr_free.forEach(tick => {
                                var value = ticket[tick];
                                if (value === undefined || value === null) {
                                    selectedFieldsObject['ticket_' + tick] = '';
                                } else {
                                    selectedFieldsObject['ticket_' + tick] = '"' + value.toString() + '"';
                                }
                            });
                        }
                    }

                }catch (error) {
                    continue
                }
            }
            // ***************************************************
            selectedFieldsArray.push(selectedFieldsObject);
        }
        if (selected_template == 'JSON'){
            // Convert the arrays to JSON format
            var jsonContent = JSON.stringify(selectedFieldsArray, null, 2);
            if(jsonContent) {
                downloadJSON(jsonContent, 'ticket-export.json');
            } else {
                downloadJSON('{}', 'ticket-export.json');
            }
        }else if (selected_template == 'XML') {
            // Convert the arrays to XML format
            var xml = convertArrayOfObjectsToXML(selectedFieldsArray);
            if(xml) {
                downloadXML(xml, 'ticket-export.xml');
            } else {
                downloadXML('', 'ticket-export.xml');
            }
        }else{
            var csv = convertArrayOfObjectsToCSV(selectedFieldsArray);
            if (csv) {
                downloadCSV(csv, 'ticket-export.csv');
            } else {
                downloadCSV('', 'ticket-export.csv');
            }
        }
    } catch (error) {
    }
}

// Function to trigger the download of the JSON file
function downloadJSON(jsonContent, filename) {
    var jsonBlob = new Blob([jsonContent], { type: 'application/json' });
    var jsonURL = URL.createObjectURL(jsonBlob);
    var link = document.createElement('a');
    link.href = jsonURL;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    hideLoader();
}

// Function to trigger the download of the CSV file
function downloadCSV(csv, filename) {
    var csvBlob = new Blob([csv], { type: 'text/csv' });
    var csvURL = URL.createObjectURL(csvBlob);
    var link = document.createElement('a');
    link.href = csvURL;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    hideLoader();
}

// Function to convert an array of objects to CSV format
function convertArrayOfObjectsToCSV(ticketArray) {
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

async function commentCount(id) {
    try {
        var val = 0;
        var url = `${zendesk_domain}/api/v2/tickets/${id}/comments/count`;  // Added a slash before 'comments'
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);

        val = data['count']['value'];
        return val;
    } catch (error) {
        return 0;
    }
}

// Add an event listener to the "Export" button
document.getElementById('exportButton').addEventListener('click', async function () {
    try {
        // *********************** ticket based on view ********************************
        // Check if options are selected in both dropdowns
        if (selectedValue_ticket != '' && selected_template) {
            showLoader();
            // Ticket data
            ticket_api_data = await ticketInfo(selectedValue_ticket);

            // create csv content
            await createContent(ticket_api_data, arr);
        }else{
            hideLoader();
        }

         // *********************** ticket based on search ********************************
        var searchTicket = document.getElementById("ticketSearch").value;;
        var search_query = searchTicket;

        if (search_query && selected_template) {
            showLoader();
            // Ticket data
            ticket_api_data = await searchTicketsData(search_query);
            arr = ['ticket', 'requester', 'submitter', 'assignee', 'groups', 'organization', 'metric_set', 'ticket_forms', 'custom_statuses', 'custom_statuses'];

            // create csv content
            await createContent(ticket_api_data, arr);
        }else{
            hideLoader();
        }

    } catch (error) {
        hideLoader();
    }
});

// Add an event listener to the "Export" button
document.getElementById('exportButton_TimeBasedTicket').addEventListener('click', async function () {
    try {
        if (selected_template){
            if(start_time && end_time){
                showLoader();
                ticket_api_data = await SearchTicketInfo(start_time, end_time)
                arr = ['ticket', 'requester', 'submitter', 'assignee', 'groups', 'organization', 'metric_set', 'ticket_forms', 'custom_statuses', 'custom_statuses'];

                await createContent(ticket_api_data, arr);
            }else{
                hideLoader();
            }
        }else{
            hideLoader();
        }
    } catch (error) {
        hideLoader();
    }
});

// ******************************************* view based tickets END********************************************


// ******************************************* search based tickets START ****************************************
async function searchTicketsData(query) {
    query = query.toString();
    showLoader();

    if (!query) {
        hideLoader();
        return Promise.reject('Invalid search query.');
    }

    const auth = `Basic ${btoa(`${username}/token:${tok}`)}`;
    const headers = {
        Authorization: auth,
        'Content-Type': 'application/json',
    };

    var user_data = {};
    const url = `${zendesk_domain}/api/v2/search.json?query=type:ticket ${query}&sort_by=created_at&sort_order=asc`;
    var Updated_Array = [];
    try {
        const response = await client.request(url, {
            method: 'GET',
            headers: headers,
        });

        hideLoader();
        const t_d = response['results'];
        if (t_d.length > 0) {
            for (let i = 0; i < t_d.length; i++) {
                 try {
                    var ticket = t_d[i];
                    var par_dict = {
                        'requester_id': t_d[i].requester_id,
                        'submitter_id': t_d[i].submitter_id,
                        'assignee_id': t_d[i].assignee_id,
                        'organization_id': t_d[i].organization_id,
                        'group_id': t_d[i].group_id,
                        'ticket_form_id': t_d[i].ticket_form_id,
                        'brand_id': t_d[i].brand_id,
                        'custom_status_id': t_d[i].custom_status_id,
                        'id': t_d[i].id,
                    };
                    var AData = await fetchRequesterData(par_dict);
                    ticket = {
                        ...ticket,
                        ...AData
                    };
                    Updated_Array.push(ticket);

                 }catch (error) {
                }
            }
        }
        return Updated_Array;
    } catch (error) {
        hideLoader();
        return Promise.reject(error); // Reject with the error
    }
}

// ******************************************* search based tickets END ********************************************

// ******************************************* time based tickets START********************************************

async function checkSelectionsTime() {
    // select format
    var templateSelect = document.getElementById('templateSelectTime');
    var selectedOption_template = templateSelect.options[templateSelect.selectedIndex];
    var selectedValue_temp = selectedOption_template.value;
    selected_template = selectedValue_temp;
    return selected_template;
}


function ticketformatDateToUnixTimestamp(dateString) {
    var parts = dateString.split('-');
    var formattedDate = new Date(parts[2], parts[0] - 1, parts[1]);
    return Math.floor(formattedDate.getTime() / (1000 * 60 * 60 * 24));
}

// FETCH COMMENT DATA FROM API
async function SearchTicketInfo(t_start, t_end) {
    try {
        var Updated_Array = [];
        var url = `${zendesk_domain}/api/v2/search.json?query=type:ticket&created>${t_start}&created<${t_end}`;
        var settings = {
            url: url,
            type: 'GET',
            dataType: 'json',
        };
        const data = await client.request(settings);
        ticketsArray = data['results'];
        if (ticketsArray.length > 0) {
            for (var i = 0; i < ticketsArray.length; i++) {
                var ticket = ticketsArray[i];
                var par_dict =
                    {'requester_id': ticket['requester_id'],
                     'submitter_id': ticket['submitter_id'],
                     'assignee_id': ticket['assignee_id'],
                     'organization_id': ticket['organization_id'],
                     'group_id': ticket['group_id'],
                     'ticket_form_id': ticket['ticket_form_id'],
                     'brand_id': ticket['brand_id'],
                     'custom_status_id': ticket['custom_status_id'],
                     'id': ticket["id"]
                     };

                var ApiData = await fetchRequesterData(par_dict);
                ticket = {
                    ...ticket,
                    ...ApiData
                };
                Updated_Array.push(ticket);
            }
        }
    } catch (error) {
    }
    return Updated_Array;
}

// ******************************************* time based tickets END**********************************************

// Function to trigger the download of the XML file
function downloadXML(xml, filename) {
    var xmlBlob = new Blob([xml], { type: 'text/xml' });
    var xmlURL = URL.createObjectURL(xmlBlob);
    var link = document.createElement('a');
    link.href = xmlURL;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    hideLoader();
}

// Function to convert an array of objects to XML format
function convertArrayOfObjectsToXML(ticketArray) {
    try {
        if (!ticketArray || ticketArray.length === 0) {
            hideLoader();
            return '';
        }

        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<tickets>\n';

        for (var i = 0; i < ticketArray.length; i++) {
            var ticketObject = ticketArray[i];
            xml += '<ticket>\n';

            for (var key in ticketObject) {
                if (ticketObject.hasOwnProperty(key)) {
                    if (key != ''){
                        // Ensure valid XML element name by replacing invalid characters
                        var sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                        xml += `<${sanitizedKey}>${escapeXml(ticketObject[key])}</${sanitizedKey}>\n`;
                    }
                }
            }

            xml += '</ticket>\n';
        }

        xml += '</tickets>';
        return xml;
    } catch (error) {
        return '';
    }
}

// Function to escape special characters in XML content
function escapeXml(unsafe) {
    if (typeof unsafe === 'string' || unsafe instanceof String) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    } else {
        return unsafe;
    }
}