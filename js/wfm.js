
function progressStart() {
       $("#loading").fadeIn('slow').spin("large", "black");
}

function progressEnd() {
       $("#loading").fadeOut('fast').spin(false);
}

function refresh_ajax_call(tab_id) {
/*
       var index = '';
       if (tab_id == 'all') index = tab_id;
       else {
            if (table_id_map.hasOwnProperty(tab_id)) {
                 for (var i = 0; i < table_id_map[tab_id].length; i++) {
                      if (table_id_map[tab_id][i][0]) {
                           index = tab_id + '_' + table_id_map[tab_id][i][1];
                           break;
                      }
                 }
            }
       }
       if (index == '') return;
*/
       var index = 'all';
       $.ajax({ type: 'GET', async: false, url: '/service/workmanager/refresh', dataType: 'json',
            data: { 'sessionid': session_ID, 'annotator': annotator, 'index': index },
            beforeSend: function() {
                 progressStart();
            },
            success: function(jsonOBJ) {
                 progressEnd();
                 if ('map' in jsonOBJ) {
                      update_count(jsonOBJ.map);
                 }
            },
            error: function (data, status, e) {
                 progressEnd();
                 alert(e);
            }
       });
}

$(document).on('click','.tabselection', function(){
       var id = $(this).attr('id');
       refresh_ajax_call(id);
       setTab(id);
});

function set_count() {
       for (var name in entry_count_map) {
            if ($('#' + name).length > 0) {
                 $('#' + name).html(entry_count_map[name]);
            }
       }
}

function update_count(return_count_map) {
       for (var name in return_count_map) {
            if ($('#' + name).length > 0) {
                 entry_count_map[name] = return_count_map[name];
            }
       }
       set_count();
}

function resize_tables() {
       if (table_id_map.hasOwnProperty(selected_tab_id)) {
            for (var i = 0; i < table_id_map[selected_tab_id].length; i++) {
                 if (!table_id_map[selected_tab_id][i][0]) continue;
                 $('#table_id_' + selected_tab_id + '_' + table_id_map[selected_tab_id][i][1]).bootstrapTable('resetView');
                 $('#table_id_' + selected_tab_id + '_' + table_id_map[selected_tab_id][i][1]).bootstrapTable('resetWidth');
            }
       }
}

function setTab(id) {
       selected_tab_id = id;
       var parent_tr = $('#' + id).closest('tr');
       $('td', $(parent_tr)).each(function() {
            var child_id = $(this).attr('id');
            if (child_id == id) {
                 $(this).css('background-color', '#669966');
                 $(this).css('color', 'white');
                 $('#Contents_' + child_id).show();
                 var table_array = [];
                 if (table_id_map.hasOwnProperty(child_id)) {
                      for (var i = 0; i < table_id_map[child_id].length; i++) {
                           if (!table_id_map[child_id][i][0]) continue;
                           var return_data = [];
                           $.ajax({ type: 'GET', async: false, url: '/service/workmanager/gettabledata', dataType: 'json',
                                data: { 'picklefile' : table_id_map[child_id][i][2], 'sessionid' : session_ID, 'annotator' : annotator },
                                success: function(jsonOBJ) {
                                     if ('table_rows' in jsonOBJ) {
                                          return_data = jsonOBJ.table_rows;
                                     }
                                },
                                error: function (data, status, e) { alert('error'); alert(e); }
                           });
                           $('#table_id_' + child_id + '_' + table_id_map[child_id][i][1]).bootstrapTable('load', return_data);
                           $('#table_id_' + child_id + '_' + table_id_map[child_id][i][1]).bootstrapTable('resetView');
                           $('#table_id_' + child_id + '_' + table_id_map[child_id][i][1]).bootstrapTable('resetWidth');
                           $('#table_id_' + child_id + '_' + table_id_map[child_id][i][1]).bootstrapTable('load', return_data);
                           table_array.push('#table_id_' + child_id + '_' + table_id_map[child_id][i][1]);
                      }
                 }
                 if (table_array.length > 0) {
                      for (var i = 0; i < table_array.length; i++) {
                           $(table_array[i]).bootstrapTable('resetView');
                           $(table_array[i]).bootstrapTable('resetWidth');
                      }
                 }
            } else {
                 $(this).css('background-color', 'white');
                 $(this).css('color', 'black');
                 if (table_id_map.hasOwnProperty(child_id)) {
                      for (var i = 0; i < table_id_map[child_id].length; i++) {
                           $('#table_id_' + child_id + '_' + table_id_map[child_id][i][1]).bootstrapTable('removeAll');
                      }
                 }
                 $('#Contents_' + child_id).hide();
            }
       });
}

function refresh_level1_pages(tab_id) {
       refresh_ajax_call(tab_id);
       setTab(selected_tab_id);
}

function editMyList(type, sessionid, depID, initials) {
       $.ajax({ type: 'GET', async: false, url: '/service/workmanager/edit_my_list', dataType: 'json',
            data: { 'type': type, 'sessionid': sessionid, 'identifier': depID, 'annotator': initials },
            success: function(jsonOBJ) {
                 if ('map' in jsonOBJ) {
                      update_count(jsonOBJ.map);
                 }
                 setTab(selected_tab_id);
            },
            error: function (data, status, e) { alert(e); }
       });
}

function onchange_function() {
       var val = $('#search_type').val();
       if ((val == 'entry_by_hold_date') || (val == 'entry_by_wfm_unlock')) {
            $('#input_value').html('');
            submit_function();
       } else {
            var input_val = search_label_map[val][1];
            if (enum_map.hasOwnProperty(val)) {
                input_val += '<select id="search_value" name="search_value">';
                for (var i = 0; i < enum_map[val].length; i++) {
                     input_val += '<option value="' + enum_map[val][i][0] + '">' + enum_map[val][i][1] + '</option>';
                }
                input_val += '</select>';
            } else input_val += '<input type="text" id="search_value" name="search_value" size="50" value="" />';
            $('#input_value').html(input_val);
       }
}

function valid_entry_ids(input_ids) {
       var list = input_ids.replace(/\s+/g, '').split(',');
       var pattern_4 = /[1-9][A-Za-z][A-Za-z0-9]{2}/;
       var pattern_4_test = /[A-Za-z0-9]{4}/;
       var pattern_5 = /\d{5}/;
       var pattern_8 = /[Ee][Mm][Dd]-\d{4}/;
       var pattern_9_emd = /[Ee][Mm][Dd]-\d{5}/;
       var pattern_9 = /[Gg]_\d{7}/;
       var pattern_10 = /\d{10}/;
       var pattern_12 = /[Dd]_\d{10}/;
       var found_invalid_id = false;
       output_ids = '';
       for (var i = 0; i < list.length; i++) {
            var is_valid_id = false;
            if (list[i].length == 4) {
                 if (pattern_4.test(list[i]) || pattern_4_test.test(list[i])) {
                      is_valid_id = true;
                      if (output_ids != '') output_ids += ',';
                      output_ids += list[i].toUpperCase();
                 }
            } else if (list[i].length == 5) {
                 if (pattern_5.test(list[i])) {
                      is_valid_id = true;
                      if (output_ids != '') output_ids += ',';
                      output_ids += list[i];
                 }
            } else if (list[i].length == 8) {
                 if (pattern_8.test(list[i])) {
                      is_valid_id = true;
                      if (output_ids != '') output_ids += ',';
                      output_ids += list[i].toUpperCase();
                 }
            } else if (list[i].length == 9) {
                 if (pattern_9_emd.test(list[i]) || pattern_9.test(list[i])) {
                      is_valid_id = true;
                      if (output_ids != '') output_ids += ',';
                      output_ids += list[i].toUpperCase();
                 }
            } else if (list[i].length == 10) {
                 if (pattern_10.test(list[i])) {
                      is_valid_id = true;
                      if (output_ids != '') output_ids += ',';
                      output_ids += 'D_' + list[i];
                 }
            } else if (list[i].length == 12) {
                 if (pattern_12.test(list[i])) {
                      is_valid_id = true;
                      if (output_ids != '') output_ids += ',';
                      output_ids += list[i].toUpperCase();
                 }
            }
            if (!is_valid_id) {
                 alert('ID: "' + list[i] + '" is not valid!');
                 found_invalid_id = true;
            }
       }
       if (found_invalid_id) return '';
       return output_ids;
}

function submit_function() {
       var search_type = $('#search_type').val();
       var search_value = '';
       if ((search_type != 'entry_by_hold_date') && (search_type != 'entry_by_wfm_unlock')) {
            search_value = $.trim($('#search_value').val());
            if (search_value == '') {
                 if (search_type == 'entry_by_initial' || search_type == 'entry_by_status' || search_type == 'entry_by_sg_center')
                      alert('No value selected for "' + search_label_map[search_type][2] + '"');
                 else alert('No input value for "' + search_label_map[search_type][2] + '"');
                 return;
            }
            if (search_type == 'entry_by_ids' || search_type == 'user_by_ids' || search_type == 'dep_by_ids' || search_type == 'group_by_ids') {
                 search_value = valid_entry_ids(search_value);
                 if (search_value == '') return;
            }
       }
  
       $.ajax({ type: 'GET', async: false, url: '/service/workmanager/search', dataType: 'json',
            data: { 'sessionid' : session_ID, 'annotator' : annotator, 'search_type' : search_type, 'value' : search_value,
                    'index' : selected_tab_id + '_' + search_label_map[search_type][0] },
            success: function(jsonOBJ) {
                 if (table_id_map.hasOwnProperty(selected_tab_id)) {
                      for (var i = 0; i < table_id_map[selected_tab_id].length; i++) {
                           if (table_id_map[selected_tab_id][i][1] == search_label_map[search_type][0]) {
                                table_id_map[selected_tab_id][i][0] = true;
                                $('#table_div_' + selected_tab_id + '_' + table_id_map[selected_tab_id][i][1]).show();
                           } else {
                                table_id_map[selected_tab_id][i][0] = false;
                                $('#table_div_' + selected_tab_id + '_' + table_id_map[selected_tab_id][i][1]).hide();
                           }
                      }
                 }
                 setTab(selected_tab_id);
            },
            error: function (data, status, e) { alert(e); }
       });
}

function select_all_entries(tagid) {
       var request = $('#' + tagid).attr('value');
       $('#leader_assign_annotator_form').find('input[name="dep_set_id_checkbox"]').each(function() {
            if (request == 'Select All') $(this).prop('checked', true);
            else $(this).prop('checked', false);
       });
       if (request == 'Select All') {
           $('#' + tagid).attr('value', 'Unselect All');
       } else {
           $('#' + tagid).attr('value', 'Select All');
       }
}

function set_slected_annotator() {
       var top_val = $('#select_top').val();
       if (top_val == '') {
            alert('No annotator selected.');
            return;
       }
       var found_checked = false;
       $('#leader_assign_annotator_form').find('input[name="dep_set_id_checkbox"]').each(function() {
            if ($(this).is(':checked')) {
                 found_checked = true;
                 var id = $(this).attr('value');
                 $('#select_' + id + ' option[value=' + top_val + ']').prop('selected', true);
                 $(this).prop('checked', false);
            }
       });
       if (!found_checked) alert('No Entry selected.');
}

function assign_slected_annotator() {
       var select_data = '';
       $('#leader_assign_annotator_form').find('select[name="dep_set_id_select"]').each(function() {
            var val = $(this).val();
            if (val != '') {
                 var id = $(this).attr('id').replace('select_', '');
                 if (select_data != '') select_data += ',';
                 select_data += id + ':' + val;
            }
       });
       if (select_data == '') {
            alert('No annotator selected.');
            return;
       }

       $.ajax({ type: 'GET', async: false, url: '/service/workmanager/assign', dataType: 'json',
            data: { 'sessionid': session_ID, 'annotator': annotator, 'tab_id': selected_tab_id, 'assigned_data': select_data },
            success: function(jsonOBJ) {
                 if ('map' in jsonOBJ) {
                      update_count(jsonOBJ.map);
                 }
                 setTab(selected_tab_id);
            },
            error: function (data, status, e) { alert(e); }
       });
}

function change_privilege(code) {
       var user_names = '';
       $('#edit_privilege_form').find('input[type=checkbox]').each(function() {
            if ($(this).is(':checked')) {
                 var value = $(this).attr('value');
                 if (value == code) {
                      var id = $(this).attr('id');
                      if (user_names != '') user_names += ',';
                      user_names += id;
                 }
            }
       });
       if (user_names == '') return;

       $.ajax({ type: 'GET', async: false, url: '/service/workmanager/changeprivilege', dataType: 'json',
            data: { 'sessionid': session_ID, 'annotator': annotator, 'return_page': 'privilege_page_tmplt', 'user_names': user_names, 'code': code },
            success: function(jsonOBJ) {
                 if (!jsonOBJ.errorflag) {
                      $('#Contents_' + selected_tab_id).html(jsonOBJ.textcontent);
                      ('#Contents_' + selected_tab_id).show();
                 } else alert(jsonOBJ.errortext);
            },
            error: function (data, status, e) { alert(e); }
       });
}

function add_new_user() {
       var user_info = { 'user_name': 'Username', 'password': 'Password', 'email': 'Email', 'initials': 'Initials', 'first_name': 'First Name', 'last_name': 'Last Name', 'da_group_id': 'Group' };
       var found_missing_value = false;
       var input_data = { 'sessionid': session_ID, 'annotator': annotator, 'tab_id': selected_tab_id };
       for (name in user_info) {
            var val = $('#add_new_user_form #' + name).val();
            if (val == '') {
                 found_missing_value = true;
                 alert('Missing value for "' + user_info[name] + '" field.');
            }
            input_data[name] = val;
       }
       if (found_missing_value) return;

       $.ajax({ type: 'GET', async: false, url: '/service/workmanager/saveuserdata', dataType: 'json', data: input_data,
            success: function(jsonOBJ) {
                 if (!jsonOBJ.errorflag) {
                      alert('Added user "' + input_data['user_name'] + '"');
                      $('#add_new_user_form select, input[type=text], input[type=password]').val('');
                 } else alert(jsonOBJ.errortext);
            },
            error: function (data, status, e) { alert(e); }
       });
}

function active_user() {
       var input_data = { 'sessionid': session_ID, 'annotator': annotator, 'return_page': 'active_user_page_tmplt' };
       var user_names = '';
       $('#active_user_form').find('input[type=checkbox]').each(function() {
            var id = $(this).attr('id');
            if (user_names != '') user_names += ',';
            user_names += id;
            if ($(this).is(':checked')) {
                 input_data[id] = '0';
            } else {
                 input_data[id] = '1';
            }
       });
       input_data['user_names'] = user_names;

       $.ajax({ type: 'GET', async: false, url: '/service/workmanager/changeactiveuser', dataType: 'json', data: input_data,
            success: function(jsonOBJ) {
                 if (!jsonOBJ.errorflag) {
                      $('#Contents_' + selected_tab_id).html(jsonOBJ.textcontent);
                      ('#Contents_' + selected_tab_id).show();
                 } else alert(jsonOBJ.errortext);
            },
            error: function (data, status, e) { alert(e); }
       });
}

function make_ajax_call(confirm_message, call_type, input_data, Url, return_flag)
{
       var return_value = '';
       if (confirm_message != '') {
            if (!confirm(confirm_message)) return return_value;
       }

       $.ajax({
            type: call_type, data: input_data, async: false, url: Url, dataType: 'json',
            success: function(jsonOBJ) {
                 if (!jsonOBJ.errorflag) {
                      if (return_flag)
                           return_value = jsonOBJ.textcontent;
                      else alert(jsonOBJ.textcontent);
                 } else alert(jsonOBJ.errortext);
            },
            error: function (data, status, e) { alert(e); }
       });

       return return_value;
}

function getpasswordcall(sessionid, depID) {
       var data = { 'sessionid': sessionid, 'identifier': depID };
       var url  = '/service/workmanager/getpassword';
       return make_ajax_call('', 'GET', data, url, true);
}

function getpassword(sessionid, depID) {
       var token = getpasswordcall(sessionid, depID);
       if (token != '')
            alert("The password for " + depID + " is " + token);
       else alert("Failed to get password for entry " + depID);
}

function domilestone(sessionid, depID) {
       var data = { 'sessionid': sessionid, 'identifier': depID };
       var url  = '/service/workmanager/milestonearchive';
       make_ajax_call('', 'POST', data, url, false);
}

function allowUpload(sessionid, depID, initials) {
       var confirm_message = 'Are you sure you want to do this, it will allow a depositor to upload bad data';
       var data = { 'sessionid': sessionid, 'identifier': depID, 'annotator': initials };
       var url  = '/service/workmanager/allowupload';
       make_ajax_call(confirm_message, 'GET', data, url, false); 
}

function preventUpload(sessionid, depID, initials) {
       var confirm_message = 'Are you sure you want to do this, it will prevent a depositor to upload bad data';
       var data = { 'sessionid': sessionid, 'identifier': depID, 'annotator': initials };
       var url  = '/service/workmanager/preventupload';
       make_ajax_call(confirm_message, 'GET', data, url, false); 
}

function enableFtp(sessionid, depID, initials) {
       var confirm_message = 'Are you sure you want to do this, it will email FTP instructions to a depositor';
       var data = { 'sessionid': sessionid, 'identifier': depID, 'annotator': initials };
       var url  = '/service/workmanager/enableftpupload';
       make_ajax_call(confirm_message, 'GET', data, url, false);
}

function allowSubmit(sessionid, depID, initials) {
       var confirm_message = 'Are you sure you want to do this, it will allow a depositor to submit incomplete data';
       var data = { 'sessionid': sessionid, 'identifier': depID, 'annotator': initials };
       var url  = '/service/workmanager/allowsubmit';
       make_ajax_call(confirm_message, 'GET', data, url, false); 
}

function preventSubmit(sessionid, depID, initials) {
       var confirm_message = 'Are you sure you want to do this, it will block submission if incomplete (this is normal)';
       var data = { 'sessionid': sessionid, 'identifier': depID, 'annotator': initials };
       var url  = '/service/workmanager/preventsubmit';
       make_ajax_call(confirm_message, 'GET', data, url, false); 
}

function rerunWF(sessionid, depID, initials) {
       var confirm_message = 'Are you sure you want to do this, it will restart the deposition WF (it will not work for annotation)';
       var data = { 'sessionid': sessionid, 'identifier': depID, 'annotator': initials };
       var url  = '/service/workmanager/rerunworkflow';
       make_ajax_call(confirm_message, 'GET', data, url, false); 
}

function editCif(sessionid, depID, instID, classID, method, initials) {
       var confirm_message = 'Viewing the CIF file will kill the WF for ' + depID + '. You will have to restart the WF youself - '
                           + 'do you want to continue ?';
       var data = { 'sessionid': sessionid, 'identifier': depID, 'annotator': initials };
       var url  = '/service/workmanager/killworkflow';
       var return_status = make_ajax_call(confirm_message, 'GET', data, url, true);
       if (return_status == 'OK') {
            url = '/service/editor/new_session/wf?identifier=' + depID + '&instance=' + instID + '&filesource=archive&classID=' + classID
                + '&context=summaryreport&expmethod=' + method + '&annotator=' + initials;
            window.open(url, '_blank');
       }
}

function RunAnnotateWF(sessionid, initials, type, depID, instID, classID, command, version, method, warning_msg) {
       if (warning_msg != '') {
            if (!confirm(warning_msg)) return;
       }
       var data = { 'sessionid': sessionid, 'annotator': initials, 'type': type, 'identifier': depID, 'instance': instID,
                    'classID': classID, 'command': command, 'version': version, 'method': method };
       var ret = make_ajax_call('', 'GET', data, '/service/workmanager/runengine', true);
       if (ret == 'OK') alert('Started a Workflow OK');
}

function select_entry(formid, tagid) {
       var request = $('#' + tagid).attr('value');
       $('#' + formid).find('input[name="entry_id"]').each(function() {
           if (request == 'Select All')
                $(this).prop('checked', true);
           else $(this).prop('checked', false);
       });
       if (request == 'Select All') {
           $('#' + tagid).attr('value', 'Unselect All');
       } else {
           $('#' + tagid).attr('value', 'Select All');
       }
}

function check_entry(formid) {
       var found_checked_entry = false;
       $('#' + formid).find('input[name="entry_id"]').each(function() {
            if ($(this).is(':checked')) {
                 found_checked_entry = true;
            }
       });
       return found_checked_entry;
}

function ajax_submit_form(formid, url, option_value) {
       $('#' + formid).ajaxSubmit({ /* async: false, */ clearForm: false, url: url, dataType: 'json',
            beforeSubmit: function (arr, $form, options) {
                 progressStart();
                 arr.push({ "name": "sessionid",  "value": session_ID });
                 arr.push({ "name": "annotator",  "value": annotator  });
                 arr.push({ "name": "option", "value": option_value   });
            },
            success: function (jsonObj) {
                progressEnd();
                if (jsonObj.errorflag) {
                     alert(jsonObj.errortext);
                } else {
                     if (option_value == 'cifcheck' || option_value == 'sequence') {
                         var myWindow = window.open('', '_blank');
                         myWindow.document.write('<pre>\n' + jsonObj.textcontent + '\n</pre>\n');
                         myWindow.document.close();
                         myWindow.focus();
                     } else {
                          alert(jsonObj.textcontent);
                     }
                     if (option_value == 'status') {
                          $("#status-identifier-dialog").addClass("displaynone");
                     } else if (option_value == 'sequence') {
                          $("#merge-sequence-dialog").addClass("displaynone");
                     }
                }
            },
            error: function (data, status, e) {
                progressEnd();
                alert(e);
            }
       });
}

function show_merge_sequence_panel() {
       $("#status-identifier-dialog").addClass("displaynone");
       $("#merge-sequence-dialog").removeClass("displaynone");
}

function show_status_selection_panel() {
       $("#merge-sequence-dialog").addClass("displaynone");
       $("#status-identifier-dialog").removeClass("displaynone");
       var myDate1 = new Date();
       var myDate2 = new Date();
       var dayOfMonth = myDate2.getDate();
       myDate2.setDate(dayOfMonth + 500);
       $(".form_date").datetimepicker({
            startDate: myDate1,
            endDate: myDate2,
            weekStart: 1,
            autoclose: 1,
            startView: 2,
            minView: 2,
            forceParse: 0
       });
}

function run_update_status_task() {
       var status_tokens = [ 'status_code', 'author_approval_type', 'author_release_status_code', 
                             'date_hold_coordinates', 'pdbx_annotator', 'process_site' ];
       var found_value = false;
       for (var i = 0; i < status_tokens.length; i++) {
            var val = $('#' + status_tokens[i]).val();
            if (val != '') {
                 found_value = true;
                 break;
            }
       }
       if (!found_value) {
            alert('No status info. selected.');
            return;
       }
       var found_checked_entry = check_entry('run_select_worktask');
       if (!found_checked_entry) {
            alert('No entry selected.');
            return;
       }

       ajax_submit_form('run_select_worktask', '/service/workmanager/run_group_tasks', 'status');
}

function run_selected_workflow() {
       var radio_button_selected = false;
       var found_error = false;
       if ($('#run_select_workflow input[type=radio]:checked').size() > 0) radio_button_selected = true;
       if (!radio_button_selected) {
            alert('No workflow selected.');
            found_error = true;
       }

       var found_checked_entry = check_entry('run_select_workflow');
       if (!found_checked_entry) {
            alert('No entry selected.');
            found_error = true;
       }
       if (found_error) return;

       ajax_submit_form('run_select_workflow', '/service/workmanager/run_group_engine', '');
}

function run_selected_task(option) {
       var error_msg = '';

       var found_checked_entry = check_entry('run_select_worktask');
       if (!found_checked_entry) error_msg = 'No entry selected.';

       if (option == 'sequence') {
            var val_id = $('#template_identifier').val();
            var val_file = $('#template_file').val();
            if (val_id == '' && val_file == '') {
                 if (error_msg != '') error_msg += '\n';
                 error_msg += "No template deposition ID or model file name defined.";
            }
       }
       if (error_msg != '') {
            alert(error_msg);
            return;
       }

       ajax_submit_form('run_select_worktask', '/service/workmanager/run_group_tasks', option);
}

function send_notification(identifier, sessionid, initial) {
       $.ajax({ type: 'GET', /* async: false, */ url: '/service/groupdeposit/send_notification', dataType: 'json',
            data: { 'identifier': identifier, 'sessionid': sessionid, 'annotator': initial },
            beforeSend: function() {
                 progressStart();
            },
            success: function (jsonObj) {
                progressEnd();
                if (jsonObj.errorflag) {
                     alert(jsonObj.errortext);
                } else {
                     alert(jsonObj.textcontent);
                }
            },
            error: function (data, status, e) {
                progressEnd();
                alert(e);
            }
       });
}
