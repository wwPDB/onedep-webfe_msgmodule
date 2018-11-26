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

function is_valid_ID(depID) {
       if (depID.substring(0,3) == 'D_9') {
            alert(" That is a validation ID ")
            return false;
       }
       return true;
}

function get_base_url() {
       var url = window.location.toString();
       var last = url.lastIndexOf("service");
       url = url.substring(0,last);
       return url;
}

function dodepuistatus(sessionid, depID, orig_stat) {
       var stat = orig_stat;
       if (orig_stat == 'unlock_with_rest') {
            stat = 'unlock';
       }
       if (stat == 'lock') {
            if (!confirm('Are you sure you want to do this, it will prevent the depositor using the depUI')) return;
       } else if (stat == 'unlock') {
            if (!confirm('Are you sure you want to do this, it will allow the depositor to edit data in the depUI')) return;
       }
       if (orig_stat == 'unlock_with_rest') {
            dodepuireset(sessionid, depID, false);
       }

       if (!is_valid_ID(depID)) return;
       var url = get_base_url();
       var csrftoken = getCookie('csrftoken');
       var login = url + 'deposition/pageviewalt/'
       var logout = url + 'deposition/logout';
       var action = url + 'deposition/stage/' + stat;

       var token = getpasswordcall(sessionid, depID); 

       var success = true;
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

function dodepuireset(sessionid, depID, warning_flag) {
       if (warning_flag) {
            if (!confirm('Are you sure you want to do this, it will delete all the depositors data in the depUI')) return;
       }

       if (!is_valid_ID(depID)) return;
       var url = get_base_url();
       var csrftoken = getCookie('csrftoken');
       var login = url + 'deposition/pageviewalt/';
       var logout = url + 'deposition/logout';
       var action = url + 'deposition/stage/reset';

       var token = getpasswordcall(sessionid, depID); 

       var success = true;

       $.when(
            $.ajax({
                'type': 'POST',
                'async': false,
                'data': { 'sessionid': sessionid, 'identifier': depID },
                'url': '/service/workmanager/milestonereset',
                success: function(jsonOBJ) {
                    if (jsonOBJ.errorflag) {
                        success = false;
                    }
                },
                error: function (data, status, e) {
                    alert('Something went wrong here with milestone : ' + e);
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
            if (success && warning_flag) {
                alert('Successfully wrote milestone file to deposit and issued reload')
            }
       });
}
