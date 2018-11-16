// File depui.js
// Updates:
//     16-Dec-2015  jdw  update references to missing functions.
//     30-Dec-2015  jdw  update url refereences in dodepuistatusmessage()
//     24-Apr-2016  jdw  use alternative logout_no_redirect method
//     25-Apr-2016  jdw  revert back to the logout with redirection  -  This process is broken.
//     16-Nov-2018  ep   copied to msgmodule directly and stripped down


function dodepuistatusmessage(ob, depID, token, stat) {

    var url = window.location.toString()
    var success = true;

    last = url.lastIndexOf("service")
    url = url.substring(0, last)

    var csrftoken = getCookie('csrftoken');

    if (depID.substring(0, 3) == 'D_9') {
        alert(" That is a validation ID ")
    } else {
        action = url + 'deposition/stage/' + stat
        if (csrftoken) {
            login = url + 'deposition/pageviewalt/'
        } else {
            login = url + 'deposition/pageviewalt/'
        }
        logout = url + 'deposition/logout'

        $.when(
                $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken)
                    },
                    'type': 'POST',
                    'async': false,
                    'data': {},
                    'url': logout,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here logout...' + xhr.status);
                        success = false;
                    },
                }),
                $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken)
                    },
                    'type': 'POST',
                    'async': false,
                    'data': {
                        'depID': depID,
                        'token': token
                    },
                    'url': login,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here login...' + xhr.status);
                        success = false;
                    },
                }),
                $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken)
                    },
                    'type': 'POST',
                    'async': false,
                    'data': {},
                    'url': action,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here ' + stat + ' ...' + xhr.status);
                        success = false;
                    },
                }),
                $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken)
                    },
                    'type': 'POST',
                    'async': false,
                    'data': {},
                    'url': logout,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here logout2...' + xhr.status);
                        success = false;
                    },
                })
            )
            .then(function() {
                if (success) {
                    alert('Successfully changed status of depUI to ' + stat)
                }
            });

    }

}

function dodepuiresetmessage(ob, depID, token) {

    var url = window.location.toString()
    var success = true;

    last = url.lastIndexOf("service")
    url = url.substring(0, last)

    var csrftoken = getCookie('csrftoken');

    if (depID.substring(0, 3) == 'D_9') {
        alert(" That is a validation ID ")
    } else {
        action = url + 'deposition/stage/reset'
        if (csrftoken) {
            login = url + 'deposition/pageviewalt/'
        } else {
            login = url + 'deposition/pageviewalt/'
        }
        logout = url + 'deposition/logout'
        mile = url + 'workmanager/milestonereset/depID/' + depID

        var csrftoken = getCookie('csrftoken');

        $.when(
                $.ajax({
                    'type': 'POST',
                    'async': false,
                    'data': {},
                    'url': mile,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here with milestone : status = ' + xhr.status);
                        success = false;
                    },
                }),
                $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken)
                    },
                    'type': 'POST',
                    'async': false,
                    'data': {},
                    'url': logout,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here : status = ' + xhr.status);
                        success = false;
                    },
                }),
                $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken)
                    },
                    'type': 'POST',
                    'async': false,
                    'data': {
                        'depID': depID,
                        'token': token
                    },
                    'url': login,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here... status = ' + xhr.status);
                        success = false;
                    },
                }),
                $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken)
                    },
                    'type': 'POST',
                    'async': false,
                    'data': {},
                    'url': action,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here... status = ' + xhr.status);
                        success = false;
                    },
                }),
                $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken)
                    },
                    'type': 'POST',
                    'async': false,
                    'data': {},
                    'url': logout,
                    'success': function(data) {},
                    'error': function(xhr, status) {
                        alert('Something went wrong here... status = ' + xhr.status);
                        success = false
                    },
                })
            )
            .then(function() {
                if (success) {
                    alert('Successfully wrote milestone file to deposit and issued reload')
                }
            });

    }

}


function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
