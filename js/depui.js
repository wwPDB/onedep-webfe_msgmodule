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
            alert(" That is a validation ID ");
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
            promise_dodepuireset(sessionid, depID, false);
       }

       if (!is_valid_ID(depID)) return;
       var url = get_base_url();
       var csrftoken = getCookie('csrftoken');
       var login = url + 'deposition/pageviewalt/';
       var logout = url + 'deposition/logout';
       var action = url + 'deposition/stage/' + stat;

       var token = getpasswordcall(sessionid, depID);

       var success = true;

       $.when(
            $.ajax({
                'beforeSend': function(xhr) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
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
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
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
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
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
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
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
                alert('Successfully changed status of depUI to ' + stat);
            }
       });
}

function wfm_milestone_reset(sessionid, depID) {
  // Returns a promise for reset operation to perfor WF< wfm_milestone_reset
  return $.ajax({
      'type': 'POST',
      'data': { 'sessionid': sessionid, 'identifier': depID },
      'url': '/service/workmanager/milestonereset',
  });
}


function logout_depui(logouturl, csrftoken) {
  // Using logouturl, lotout of DepUI.
  // async method
  // Returns promise
      return $.ajax({
        'beforeSend': function(xhr) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        },
        'type': 'POST',
        'data': {},
        'url': logouturl,
      });
    }

function login_depui(loginurl, depID, token, csrftoken) {
    // login to Depui for depid and CSRFToken
    // Returns promise
                  return $.ajax({
                    'beforeSend': function(xhr) {
                        xhr.setRequestHeader("X-CSRFToken", csrftoken);
                    },
                    'type': 'POST',
                    'data': {
                        'depID': depID,
                        'token': token
                    },
                    'url': loginurl
                  });
}

function reset_depui(actionurl, csrftoken) {
              return $.ajax({
                  'beforeSend': function(xhr) {
                      xhr.setRequestHeader("X-CSRFToken", csrftoken);
                  },
                  'type': 'POST',
                  'data': {},
                  'url': actionurl,
                  'timeout': 600000 // sets timeout to 10 minuntes
                });
}

function promise_dodepuireset(sessionid, depID, warning_flag) {
       if (warning_flag) {
            if (!confirm('Are you sure you want to do this, it will delete all the depositors data in the depUI')) return;
       }
       console.log("Start dodepuireset");

       if (!is_valid_ID(depID)) return;
       var url = get_base_url();
       var csrftoken = getCookie('csrftoken');
       var login = url + 'deposition/pageviewalt/';
       var logout = url + 'deposition/logout';
       var action = url + 'deposition/stage/reset';

       var token = getpasswordcall(sessionid, depID);

       // Some promise functions
       var dologout = function() {
         //console.log("About to logout");
         return logout_depui(logout, csrftoken);
       };

       var dologin = function() {
         console.log("About to login");
         return login_depui(login, depID, token, csrftoken);
       };

       var doreset = function() {
         //console.log("About to reset");
         return reset_depui(action, csrftoken);
       };


       // Final error check promise hander
       function final_check(success, warning_flag) {
         console.log("promised_dodepuireset complete:"+success+' '+warning_flag);
          if (success && warning_flag) {
              alert('Successfully wrote milestone file to deposit and issued reload');
            }
          // Return for promise
          return null;
        }


        var success = true;

        // Return a promise
       return $.when(wfm_milestone_reset(sessionid, depID))
       .done(function(jsonObj) {
          if (jsonObj.errorflag) {
              success = false;
            }
          })
       .fail(function(data, status, e) {
           alert('Something went wrong here with milestone : ' + e);
           success = false;
          })

          // logout
          .then(dologout, dologout)
          .done(function(data) {
            //console.log("logout ok");
          })
          .fail(function(xhr, textStatus, e) {
            // console.log('logout failed: ' + e);
            alert('Something went wrong here : status = ' + xhr.status);
            success = false;
          })

          // dologin
          .then(dologin, dologin)
          .done(function(data) {
              // console.log("login ok")
            })
          .fail(function(xhr, textStatus, e) {
            // console.log('login failed: ' + e);
            alert('Something went wrong here : status = ' + xhr.status);
            success = false;
          })

          // reset_depui
          .then(doreset, doreset)
          .done(function(data) {
            // console.log("reset ok")
          })
          .fail(function(xhr, textStatus, e) {
            // console.log('reset failed: ' + e);
            alert('Something went wrong here : status = ' + xhr.status);
            success = false;
          })

          // logout
          .then(dologout, dologout)
          .done(function(data) {
              // console.log("logout2 ok");
            })
          .fail(function(xhr, textStatus, e) {
            //console.log('logout2 failed: ' + e);
            alert('Something went wrong here : status = ' + xhr.status);
            success = false;
          })

        .then(function () {final_check(success, warning_flag);}, function (){final_check(success, warning_flag);});

}
