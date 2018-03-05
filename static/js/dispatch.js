/* Dispatch area - Should be eliminate after dispatching */

var markersGroup = new L.LayerGroup();
var isDispatching = false;
var placeIcon = L.icon({
    iconUrl: '/static/icons/place_marker.png',
    iconSize: [50, 50], // size of the icon
});
var dispatchingAmbulances = {};
var numberOfDispatchingAmbulances = 0;

var currentAddress;
var currentLocation;

var updateCurrentLocation = function(location) {

    // set currentLocation
    currentLocation = location;

    // update coordinates on form
    document.getElementById('curr-lat').innerHTML = currentLocation.lat;
    document.getElementById('curr-lng').innerHTML = currentLocation.lng;

    // remove existing marker
    markersGroup.clearLayers();

    // laydown marker
    var marker = L.marker([location.lat, location.lng],
        {
            icon: placeIcon,
            draggable: true
        }).addTo(markersGroup);
    markersGroup.addTo(mymap);

    // events
    marker.on('dragend', function(e) {
        // update current location
        updateCurrentLocation(marker.getLatLng());
    })

}

var updateCurrentAddress = function(location) {

    var options = {
        types: 'address',
        limit: 1
    };
    geocoder.reverse(location, options,
        function (results, status) {

        if (status != "success") {
            alert("Could not geocode:\nError " + status + ", " + results['error']);
            return;
        }

        // quick return if found nothing
        if (results.length == 0) {
            console.log('Got nothing from geocode');
            return;
        }

        // parse features into address
        var address = geocoder.parse_feature(results[0]);

        alert('street: '
            + address['street']
            + '\nlocation: ' + address['location']['latitude'] + ',' + address['location']['longitude']
            + '\nneighborhood: ' + address['neighborhood']
            + '\nzipcode: ' + address['zipcode']
            + '\ncity: ' + address['city']
            + '\nstate: ' + address['state']
            + '\ncountry: ' + address['country']
        );

    });



    // set currentLocation
    currentLocation = location;

    // update coordinates on form
    document.getElementById('curr-lat').innerHTML = currentLocation.lat;
    document.getElementById('curr-lng').innerHTML = currentLocation.lng;

    // remove existing marker
    markersGroup.clearLayers();

    // laydown marker
    var marker = L.marker([location.lat, location.lng],
        {
            icon: placeIcon,
            draggable: true
        }).addTo(markersGroup);
    markersGroup.addTo(mymap);

    // events
    marker.on('dragend', function(e) {
        // update current location
        updateCurrentLocation(marker.getLatLng());
    })

}

var beginDispatching = function () {
   
    isDispatching = true;
    console.log('Begin dispatching.');
    
    document.getElementById('dispatch_work').innerHTML 
        = '<button type="button" class="btn btn-link" onclick="endDispatching()">'
        + '<span class="glyphicon glyphicon-chevron-left"></span>'
        + 'Abort'
        + '</button>';
    $('#dispatchForm').collapse('show');
    $('#ambulance_info_collapse').collapse('hide');

    // Update current location
    updateCurrentLocation(mymap.getCenter());

    // Update current address
    updateCurrentAddress(currentLocation);

}

var endDispatching = function () {
    
    isDispatching = false;
    dispatchingAmbulances = {};
    console.log('End dispatching.');
    
    markersGroup.clearLayers();
    document.getElementById('dispatch_work').innerHTML 
        = '<button class="btn btn-primary" style="display: block; width: 100%;"' 
        + 'data-toggle="collapse" href="#dispatchForm" onclick="beginDispatching()">'
        + 'Dispatch'
        + '</button>';
    $('#dispatchForm').collapse('hide');
    $('#ambulance_info_collapse').collapse('show');
    
}

var removeFromDispatchingList = function(ambulance) {

    // delete from dispatching list
    delete dispatchingAmbulances[ambulance.id];
    numberOfDispatchingAmbulances--;

    // show message if last button
    if (numberOfDispatchingAmbulances == 0)
        $('#ambulance-selection-message').show();

}

var addToDispatchingList = function(ambulance) {

    // quick return if null or not dispatching
    if (ambulance == null || !isDispatching)
        return;

    // add ambulance to dispatching list
    console.log('Adding ambulance ' + ambulance.identifier + ' to dispatching list');

    // already in?
    if (ambulance.id in dispatchingAmbulances) {
        console.log('Already in dispatching list, skip');
        return;
    }

    // not available?
    if (ambulance.status != STATUS_AVAILABLE) {
        console.log('Ambulance is not available');
        alert('Can only dispatch available ambulances!');
        return;
    }

    // hide message if first button
    if (numberOfDispatchingAmbulances == 0)
        $('#ambulance-selection-message').hide();

    // add ambulance to list of dispatching ambulances
    dispatchingAmbulances[ambulance.id] = true;
    numberOfDispatchingAmbulances++;

    // add button to ambulance dispatch grid
    $('#ambulance-selection').append(
        '<button id="dispatch-button-' + ambulance.id + '"'
        + ' value="' + ambulance.id + '"'
        + ' type="button" class="btn btn-sm btn-success"'
        + ' style="margin: 2px 2px;"'
        + ' draggable="true">'
        + ambulance.identifier
        + '</button>'
    );
    $('#dispatch-button-' + ambulance.id)
        .on('dragstart', function (e) {
            // on start of drag, copy information and fade button
            console.log('dragstart');
            this.style.opacity = '0.4';
            e.originalEvent.dataTransfer.setData("text/plain", ambulance.id);
        })
        .on('dragend', function (e) {
            console.log('dragend');
            if (e.originalEvent.dataTransfer.dropEffect == 'none') {
                // Remove button if not dropped back
                removeFromDispatchingList(ambulance);
                // Remove button
                $(this).remove();
            } else {
                // Restore opacity if dropped back in
                this.style.opacity = '1.0';
            }
        });
}

$("#street").change(function (data) {

    var address = document.getElementById('street').value;
    console.log('Received address: ' + address);

    var options = {
        types: 'address',
        limit: 1,
        autocomplete: 'true'
    };
    geocoder.geocode(address, options,
        function (results, status) {

        if (status != "success") {
            alert("Could not geocode:\nError " + status + ", " + results['error']);
            return;
        }

        // quick return if found nothing
        if (results.length == 0) {
            console.log('Got nothing from geocode');
            return;
        }

        // parse features into address
        var address = geocoder.parse_feature(results[0]);

        alert('street: '
            + address['street']
            + '\nlocation: ' + address['location']['latitude'] + ',' + address['location']['longitude']
            + '\nneighborhood: ' + address['neighborhood']
            + '\nzipcode: ' + address['zipcode']
            + '\ncity: ' + address['city']
            + '\nstate: ' + address['state']
            + '\ncountry: ' + address['country']
        );

    });

/*
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({address: addressInput}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var coordinate = results[0].geometry.location;

            document.getElementById('curr-lat').innerHTML = coordinate.lat();
            document.getElementById('curr-lng').innerHTML = coordinate.lng();

            L.marker([coordinate.lat(), coordinate.lng()], {icon: placeIcon}).addTo(markersGroup);
            markersGroup.addTo(mymap);
            mymap.setView(new L.LatLng(coordinate.lat(), coordinate.lng()), 17);
        }
        else {
            alert("There is error from Google map server");
        }
    });
*/

});

/*
 * postDispatchCall makes an ajax post request to post dispatched ambulance.
 * @param void.
 * @return void.
 */
function postDispatchCall() {
    var formData = {};
    var assigned_ambulances = [];

    // Extract form value to JSON
    formData["stmain_number"] = $('#street').val();
    formData["residential_unit"] = $('#address').val();
    formData["latitude"] = document.getElementById('curr-lat').innerHTML;
    formData["longitude"] = document.getElementById('curr-lng').innerHTML;
    formData["active"] = true
    formData["name"] = "Make Dynamic for Future"
    console.log(formData["active"])

    console.log(formData["latitude"]);
    formData["description"] = $('#comment').val();
    formData["priority"] = $('input:radio[name=priority]:checked').val();
    $('input:checkbox[name="ambulance_assignment"]:checked').each(function (i) {
        assigned_ambulances[i] = $(this).val();
    });

    if (formData["priority"] == undefined) {
        alert("Please click one of priorities");
        return;
    }

    if (assigned_ambulances.length == 0) {
        alert("Please dispatch at least one ambulance");
        return;
    }

    formData["ambulance"] = assigned_ambulances.toString();

    let postJsonUrl = 'api/calls/';
    alert(JSON.stringify(formData) + '\n' + postJsonUrl);

    var csrftoken = getCookie('csrftoken');

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    })

    $.ajax({
        url: postJsonUrl,
        type: 'POST',
        dataType: 'json',
        data: formData,
        success: function (data) {
            // alert(JSON.stringify(data));
            var successMsg = '<strong>Success</strong><br/>' +
                +'Ambulance: ' + data['ambulance']
                + ' dispatched to <br/>' + data['residential_unit']
                + ', ' + data['stmain_number'] + ', ' + data['latitude'] + ', ' + data['longitude'];
            $('.modal-body').html(successMsg).addClass('alert-success');
            $('.modal-title').append('Successfully Dispached');
            $("#dispatchModal").modal('show');
            endDispatching();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert(JSON.stringify(jqXHR) + ' ' + textStatus);
            $('.modal-title').append('Dispatch failed');
            $("#dispatchModal").modal('show');
            endDispatching();
        }
    });
}

function csrfSafeMethod(method) {
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

/*
 * getCookie extracts the csrf token for form submit
 */
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = $.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/* Functions to fill autocomplete AND to click specific locations */
function dispatchInitAutocomplete() {
    // Create the autocomplete object, restricting the search to geographical
    autocomplete = new google.maps.places.Autocomplete((document.getElementById('street')),
        {types: ['geocode']});
    //autocomplete.addListener('place_changed', fillInAddress);
}