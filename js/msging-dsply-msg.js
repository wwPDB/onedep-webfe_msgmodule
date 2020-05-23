/***********************************************************************************************************
File:		msging-dsply-msg.js
Author:		rsala (rsala@rcsb.rutgers.edu)
Date:		2012-04-29
Version:	0.0.1

JavaScript supporting wwPDB Messaging Module web interface

2014-12-02, RPS: Created
2015-01-28, RPS: Replacing closeWindow() with closeWndw() to help monitor, troubleshoot possible
					erratic behavior of this function call.
				 Decoupling successful return of submitNewMsg() from call to dodepuresetmessage()
				 Inserting missing import of /workmanager/media/js/depui.js
2015-02-06, RPS: Providing spinner display while sending message.
2015-02-11, RPS: Fixing bug that occurs in cases wherein user closes parent message listing window before
					replying to message opened in a child window.
2015-03-02, RPS: Updates per introduction of sanity check safeguards on writes to messaging cif data files.
2015-05-06, RPS: Updates per updates to jQuery 2.1.3, and associated javascript plugin updates.
*************************************************************************************************************/
//"MsgingMod" namespacing for any globals
var MsgingMod = {
	////////////////////////////////////////////////////////////////////////////
	// use information dynamically populated in dsply_msg_tmplt.html file
	// to initialize some of the crucial properties for MsgingMod
	sSessionId : SESSION_ID,
	sDepId : DEPID,
	sPdbId : PDBID,
	sSessionPathPrefix : SESS_PATH_PREFIX,
	sFileSource : FILE_SOURCE,
	bEmbeddedView : EMBEDDED_VW,
	sCrrntMsgId : MSGID,
	sCrrntDataSetID : DEPID,
	sCrrntContentType : CONTENT_TYPE,  // i.e. "msgs" vs. "notes" vs. "commhstry"
	////////////////////////////////////////////////////////////////////////////
	iAjaxTimeout : 60000,
	sAdminContact : 'Send comments to: <a href="mailto:rsala@rcsb.rutgers.edu">help@wwpdb-dev.rutgers.edu</a>',
	sInfoStyle : '<span class="ui-icon ui-icon-info fltlft"></span> ',
	sErrStyle : '<span class="ui-icon ui-icon-alert fltlft"></span> ',
	bDebug : true,
	oDataTable : undefined,
	oFilesRfrncd : new Object(),
	iCnt_DrawBackCalledOnCurrentTbl : 0,
	bResetDisplay : true,
	iCrrntMsgsHwm : MSGS_HWM,
	iCrrntNotesHwm : NOTES_HWM,
	sCrrntRowSlctd : "",
	sUseServerSidePrcssing : "false", //string b/c also used as query param
	sUseThreaded : "false", //string b/c also used as query param
	bAllowSorting : false,
	sViewContext	: "sentmsgs",
	bNewDraftContext : false,
	iMsgCmpsHtMin : 775,
	iMsgCmpsHtWthParentContent : 875,
	//iMsgDisplHtMin : 600,
	iMsgDisplWdthMin : 1200,
	iMsgDisplHtMin : 800,
	//iMsgDisplHtWthParentContent : 800,
	iMsgDisplHtWthParentContent : 850,
	iNoteCmpsHt : 600,
	arrAvailFiles : [],
	arrColDisplOrderCorrHx : [5,1,3,15,14,16,17,18,8,4,7,0,2,6,9,10,11,12,13],
	bNotesExist : false,
	// URL constants
	URL: {
		WFLAUNCH: '/service/messaging/new_session/wf',
		DEVLAUNCH: '/service/messaging/launch',
		SEE_RAW_JSON_FOR_DTBL : '/service/messaging/test_see_json',
		DTBL_GET_TMPLT : '/service/messaging/get_dtbl_config_dtls',
		DTBL_AJAX_LOAD : '/service/messaging/get_dtbl_data',
		DTBL_DELETE_ROW : '/service/messaging/delete_row',
		SUBMIT_MSG : '/service/messaging/submit_msg',
		ARCHIVE_MSG : '/service/messaging/archive_msg',
		FORWARD_MSG : '/service/messaging/forward_msg',
		UPDATE_DRAFT_STATE : '/service/messaging/update_draft_state',
		MARK_MSG_READ : '/service/messaging/mark_msg_read',
		TAG_MSG : '/service/messaging/tag_msg',
		EXIT_NOT_FINISHED : '/service/messaging/exit_not_finished', //currently not used
		EXIT_FINISHED : '/service/messaging/exit_finished',  //currently not used
		GET_MSG	:	'/service/messaging/get_msg',
		CHECK_AVAIL_FILES : '/service/messaging/check_avail_files',
		GET_FILES_RFRNCD : '/service/messaging/get_files_rfrncd',
		CHECK_GLBL_MSG_STATUS : '/service/messaging/check_global_msg_status',
		DISPLAY_MSG: '/service/messaging/display_msg'
	},
	LABEL: {
		MSG_THREAD_VIEW: "Switch to Message Thread View",
		STD_SORT_VIEW: "Switch to Standard Sorting View"
	}
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////BEGIN: adding customizations to javascript prototypes///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//need the below in cases of IE where indexOf is not defined for Array datatypes
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}
//adding convenience function to String prototype for checking if given string startsWith given string
String.prototype.startsWith = function(str){return (this.match("^"+str)==str);};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////END: adding customizations to javascript prototypes///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


$(document).ready(function() {
	$(document).ajaxError(function(e, x, settings, exception) {
	    try {
	        if (x.status == 0) {
	            $('.errmsg.glblerr').html(MsgingMod.sErrStyle + 'You are offline!!<br />Please Check Your Network.').show().fadeOut(4000);
	        } else if (x.status == 404) {
	            $('.errmsg.glblerr').html(MsgingMod.sErrStyle + 'Requested URL "' + settings.url + '" not found.<br />').show().fadeOut(4000);
	        } else if (x.status == 500) {
	            $('.errmsg.glblerr').html(MsgingMod.sErrStyle + 'Internel Server Error.<br />').show().fadeOut(4000);
	        } else if (e == 'parsererror') {
	            $('.errmsg.glblerr').html(MsgingMod.sErrStyle + 'Error.\nParsing JSON Request failed.<br />').show().fadeOut(4000);
	        } else if (e == 'timeout') {
	            $('.errmsg.glblerr').html(MsgingMod.sErrStyle + 'Request Time out.<br />').show().fadeOut(4000);
	        } else {
	            $('.errmsg.glblerr').html(MsgingMod.sErrStyle + x.status + ' : ' + exception + '<br />\n').show().fadeOut(4000);
	        }
	    } catch (err) {
			$('.loading').hide();
	        var errtxt = 'There was an error while processing your request.\n';
	        errtxt += 'Error description: ' + err.description + '\n';
	        errtxt += 'Click OK to continue.\n';
	        alert(errtxt);
	    }
	});
	$.ajax({url: '/msgmodule/js/jquery/ui/jquery-ui.custom.min.js', async: false, dataType: 'script'});
	$.ajax({url: '/js/jquery/plugins/jquery.form.min.js', async: false, dataType: 'script'});
	$.ajax({url: '/msgmodule/js/jquery/plugins-src/jquery.bt-0.9.7.wwpdb.min.js', async: false, dataType: 'script'});
	$.ajax({url: '/msgmodule/js/depui.js', async: false, dataType: 'script'}); //evenutally needed for Annot-to-DepUI "RESET" comm
	$.ajax({url: '/msgmodule/js/wfm.js', async: false, dataType: 'script'}); //evenutally needed for Annot-to-DepUI "RESET" comm
	$.ajax({url: '/msgmodule/js/jquery/plugins-src/spin.js', async: false, dataType: 'script'});
	$.ajax({url: '/msgmodule/js/jquery/plugins-src/jquery.spin.js', async: false, dataType: 'script'});

	/**
	$.ajax({url: '/msgmodule/js/jquery/plugins/jquery.ba-postmessage.js', async: false, dataType: 'script'});
	$.postMessage(
	'hello world',
	'http://wwpdb-deploy-test-2.wwpdb.org/service/messaging/launch',
	parent
	);
	***/

	$('#reply').button();
	$('#archive').button();
	$('#close').button();

	if( MsgingMod.sCrrntContentType == "commhstry" ){
		$("#msg_actions .write").hide();
	}

	//if( MsgingMod.sCrrntContentType == "notes" ){
	//	$("#archive").hide();
	//}

	// initialize Archive Message dialog as jQuery UI dialog box
	$( "#archive_msg" ).dialog({
		autoOpen: false,
		height: 400,
		width: 400,
		modal: true,
		buttons: {
			"Archive": function() {
				//var msgId = $('#msg_id').val();
				var msgId = MsgingMod.sCrrntMsgId;
				var oMsg = new Message();
				getMsgDict(msgId,oMsg);
				propagateMsg( oMsg.message_subject, oMsg.message_id, oMsg.message_text, oMsg.sender, oMsg.timestamp, "archive" );
				closeWndw();
			},
			"Cancel" : function() {
				$( "#archive_msg" ).dialog( "close" );
			}
			/*** DEBUG
			"Test": function() {
				var msgId = $('#msg_id').val();
				var oMsg = new Message();
				getMsgDict(msgId,oMsg);

				alert("message_text is: "+oMsg['message_text']);
				alert("Msg Subject is: "+jsonData.msg_dict['message_subject']);
				alert("Msg ID is: "+jsonData.msg_dict['message_id']);
				alert("Msg Body is: "+jsonData.msg_dict['message_text']);
				alert("Msg Sender is: "+jsonData.msg_dict['sender']);
				alert("Msg Timestamp is: "+jsonData.msg_dict['timestamp']);
				alert("parent_message_id is: "+jsonData.msg_dict['parent_message_id']);
			}
			***/
		},
		close: function() {
			// any clean-up actions required
		}
	});

	// initialize Compose Message form as jQuery UI dialog box
	$( "#msg_compose" ).dialog({
		autoOpen: false,
		height: $(window).height() - 50,
		width: $(window).width() - 50,
		modal: true,
		buttons: {
			"Send": function() {
				progressStart();
				setTimeout(function(){
					if( $('#msg_compose_subject').val().length > 1 ){
						var bSuccess = submitNewMsg('Y');
						if( bSuccess ){
							$( "#msg_compose" ).dialog( "close" );
							if( MsgingMod.sViewContext	== "sentmsgs" ){
								if( window.opener != null ){
									$(".get_msgs",window.opener.document).trigger('click');
								}
								closeWndw();
							}
							else{
								if( window.opener != null ){
									$(".get_drafts",window.opener.document).trigger('click');
								}
								closeWndw();
							}
						}
					}else{
						alert( "Please supply a message 'Subject'.");
					}
					progressEnd();
				},1100);
			},
			"Save Draft": function() {
				var bSuccess = submitNewMsg('N');
				if( bSuccess ){
					$( "#msg_compose" ).dialog( "close" );
					if( MsgingMod.sViewContext	== "sentmsgs" ){
						if( window.opener != null ){
							$(".get_msgs",window.opener.document).trigger('click');
						}
						closeWndw();
					}
					else{
						if( window.opener != null ){
							$(".get_drafts",window.opener.document).trigger('click');
						}
						closeWndw();
					}
				}
			},
			"Cancel": function() {
				$( "#msg_compose" ).dialog( "close" );
			}
		},
		close: function() {
			// any clean-up actions required
		}
	});

	$( "#tag_msg" ).dialog({
		autoOpen: false,
		height: 200,
		width: 300,
		modal: true,
		buttons: {
			"OK": function() {
				var actionRqd = 'Y'; //defaults to 'Y' on assumption that msg by default requires action unless manually cleared by annotator
				var readStatus = 'Y'; //defaults to 'Y' on assumption that msg cannot be selected for tagging unless already "read"
				var forRelease = 'N'; //defaults to 'N' on assumption that msg cannot be selected for tagging unless already "read"
				$('#tag_msg :checkbox:checked').each(function() {
			    	value = $(this).val();

			    	if( value == "no_action_reqd" ){
			    		actionRqd = "N";
			    	}
			    	if( value == "unread" ){
			    		readStatus = "N";
			    	}
			    	if( value == "for_release" ){
			    		forRelease = "Y";
			    	}
			    });

				tagMsg(actionRqd,readStatus,forRelease);
				$( "#tag_msg" ).dialog( "close" );
				if( MsgingMod.sCrrntContentType == "msgs" ){
					$('.get_msgs').trigger('click');
				}
				else{
					$('.get_drafts').trigger('click');
				}

			},
			Cancel: function() {
				$( "#tag_msg" ).dialog( "close" );
				$("#context_menu").hide();
			}
		},
		close: function() {
			// any clean-up actions required
		}
	});

	confirmAvailFiles();

	getFilesReferenced();

	if( MsgingMod.sCrrntContentType == "notes"){
		$('h2').css("color","purple");
		$('h3').css("color","purple");
	}
	if( MsgingMod.sCrrntContentType == "commhstry"){
		$('h2').css("color","blue");
		$('h3').css("color","blue");
	}
	//window.opener.alert("hello");
	//$(".get_drafts",window.opener.document).trigger('click');

	// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// //////////////////BEGIN: EVENT HANDLERS ////////////////////////////////////////////////////////////////////////////////
	// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	$('#reply').click( function() {
		var oMsg = new Message();
		getMsgDict(MsgingMod.sCrrntMsgId,oMsg);
		composeMsg("RE: "+oMsg.message_subject, oMsg.message_id, oMsg.message_text, oMsg.sender, oMsg.timestamp, undefined );
	});

	$('#archive').click( function() {
		$('#archive_msg_target_depid').val(MsgingMod.sDepId);
		$('#archive_msg').dialog("open");
	});

	$('#close').click( function() {
		closeWndw();
	});

	$('.compose').click(function() {
		if( MsgingMod.sViewContext == "drafts" ){
			MsgingMod.bNewDraftContext = true;
		}else{
			MsgingMod.bNewDraftContext = false;
		}
		var tmpltStyle = ($(this).attr('id').split("_"))[1];
		composeMsg(undefined,undefined,undefined,undefined,undefined,tmpltStyle);
	});

    $(".clearfile").on("click", function(event){
    	var indx = $(this).attr('id').split("clear")[1];
		clearFileUpload(indx);
    });

    $(".addanother").on("click", function(event){
    	var indx = $(this).attr('id').split("addanother")[1];
    	$("#aux-file-span"+(parseInt(indx)+1)).show();
    });


	// Below fix found necessary to address issue with [ENTER] key reloading entire page when jQuery UI modal dialog active.
	// Code sourced from: http://codingrecipes.com/jquery-ui-dialog-and-the-enter-return-key-problem
	$("#other-value-form").find('input').keypress(function(e) {
		if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
			$(this).parent().parent().parent().parent().find('.ui-dialog-buttonpane').find('button:first').click(); /* Assuming the first one is the action button */
			return false;
		}
	});


    $('#select_all_file_references').on("click", function() {
    	//alert(this.checked);
    	$('#msg_compose_assoc_files').find('input[type=checkbox]:visible').prop('checked', this.checked);
    });
    $('.assoc_files_chckbox input[type=checkbox]').on("click", function(){
    	//alert('Captured click event');
    	var checked = this.checked;
    	if( !checked ){
    		$('#select_all_file_references').prop('checked', this.checked);
    	}
    });

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////END: EVENT HANDLERS ////////////////////////////////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /***
     if( MsgingMod.sPdbId == "[NOT AVAILABLE]" || MsgingMod.sPdbId == "[none listed]"){
    	if( MsgingMod.bEmbeddedView ){
    		alert("WARNING: the PDB ID was not found in the model file.");
    	}
    }
    */
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////END: jQuery document ready function ////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////BEGIN: FUNCTION DEFINITIONS /////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function closeWndw() {
	var browserFlavor = navigator.appName;
	var indexIEflavor = browserFlavor.indexOf('Explorer');

	if( indexIEflavor > 0 ) { // if this is an IE browser
		var indexIEvrsn = navigator.userAgent.indexOf('MSIE') + 5;
	    var IEversion = navigator.userAgent.substring(indexIEvrsn, indexIEvrsn + 1);

	    if (IEversion >= 7) {
	    	window.open('', '_self', '');
	        window.close();
	    }
	    else if (IEversion == 6) {
	        window.opener = null;
	        window.close();
	    }
	    else {
	        window.opener = '';
	        window.close();
	    }

	}
	else{
	    window.close();
	}
}

function constrainTagChoices(){
	var selectedVal = "";
	var selected = $("input[name='tag_msg']:checked");
	if (selected.length > 0){
	    selectedVal = selected.val();
    	//alert(selectedVal);
	}

    if( selectedVal.length > 0 ){
    	$("input[name='tag_msg'][value='"+selectedVal+"']").prop("disabled",false);
    	$("input[name='tag_msg'][value!='"+selectedVal+"']").prop("disabled",true);
    }else{
    	$('#tag_msg :checkbox').each(function() {
	    	$(this).prop("disabled",false);
	    });
    }
}

function promptForMsgTags(thisRow){

	if( MsgingMod.sCrrntContentType == "msgs"){
		// do stuff here instead of normal context menu
		var readStatus = 'N';
		// alert("TEST: capturing right-click event");
		if( $(thisRow).hasClass("row_selected") ){
			// alert("This row has been selected.");
			if( $(thisRow).hasClass("msg_read")){
				$('#chckbx_unread').prop("checked",false);
				// alert("This row has been read already.");
				readStatus = 'Y';
				/**var iPos = MsgingMod.oDataTable.fnGetPosition(thisRow);
				var sMsgId = MsgingMod.oDataTable.fnGetData(iPos).message_id;
				MsgingMod.sCrrntMsgId = sMsgId;
				**/
				if( $(thisRow).hasClass("no_action_reqd")){
					$('#chckbx_no_action_reqd').prop("checked",true);
				}else{
					$('#chckbx_no_action_reqd').prop("checked",false);
				}
				if( $(thisRow).hasClass("for_release")){
					$('#chckbx_for_release').prop("checked",true);
				}else{
					$('#chckbx_for_release').prop("checked",false);
				}
				if( $(thisRow).hasClass("frm_annotator")){
					$('#checkbox_no_action_reqd').hide();
				}else{
					$('#checkbox_no_action_reqd').show();
				}
				// DEBUG: alert("MsgingMod.sCrrntMsgId: "+MsgingMod.sCrrntMsgId);
				//constrainTagChoices();
				$("#tag_msg").dialog( "open" );
			}
		}
	}

}

function getFilesReferenced(){
	/***
	 * Retrieve list of files referenced by any messages for this dataset ID
	 * so that we can link to these files as necessary when reviewing sent messages from this UI
	 */
	$('#hlprfrm').ajaxSubmit({url: MsgingMod.URL.GET_FILES_RFRNCD, async: false, clearForm: false,
        success: function(jsonData) {
        	if( jsonData ){
        		MsgingMod.oFilesRfrncd = jsonData.files_rfrncd;

        		/*** FOR DEBUGGING
        		var names = "";
        		for(var property in MsgingMod.oFilesRfrncd){
        			names += property + "\n";
        			alert("MsgingMod.oFilesRfrncd["+property+"] = "+MsgingMod.oFilesRfrncd[property]);
        		}
        		alert(names);
        		**/

        	}
        }
    });
    return false;
}

function confirmAvailFiles(){
	$('#hlprfrm').ajaxSubmit({url: MsgingMod.URL.CHECK_AVAIL_FILES, async: false, clearForm: false,
        success: function(jsonData) {
        	if( jsonData ){
        		MsgingMod.arrAvailFiles = jsonData.file_list;
        		//alert('MsgingMod.arrAvailFiles is: '+MsgingMod.arrAvailFiles);
        		//alert('MsgingMod.arrAvailFiles[0] is: '+MsgingMod.arrAvailFiles[0]);
        	}
        }
    });
    return false;
}

function Message(){

	this.loadFromJson = function(json){
		this.message_subject = json.message_subject;
		this.message_id = json.message_id;
		this.message_text = json.message_text;
		this.sender = json.sender;
		this.timestamp = json.timestamp;
		this.parent_message_id = json.parent_message_id;
	};

}


function clearFileUpload(index){
	//<input type='file' size='50' id="aux-file2" name="aux-file2" class="c_%(identifier)s file_upload fltlft"/>
	if( index == "all" ){
		for( var iNum=1; iNum<4; iNum++){
			$("#aux-file"+iNum).replaceWith('<input type="file" size="50" id="aux-file'+iNum+'" name="aux-file'+iNum+'" class="c_'+MsgingMod.sDepId+' file_upload fltlft"/>');
		}
	}else{
		$("#aux-file"+index).replaceWith('<input type="file" size="50" id="aux-file'+index+'" name="aux-file'+index+'" class="c_'+MsgingMod.sDepId+' file_upload fltlft"/>');
	}
}


function resetTextArea(tmpltStyle){

	$("#msg_compose_body").replaceWith( $("#msg_compose_body_tmplt_"+tmpltStyle).clone().attr('id', 'msg_compose_body').removeClass("displaynone") );
}

function composeMsg( msgSubject, parentMsgId, parentMsg, parentMsgSnder, parentMsgDateTime, tmpltStyle ){

	if( MsgingMod.sCrrntContentType == "notes"){
		$('#msg_compose_body').val("");
	}
	else{ // current content type is "msgs"
		if( typeof(tmpltStyle) != "undefined" ){
			resetTextArea(tmpltStyle);
		}else{
			$('#msg_compose_body').val("");
		}
		confirmAvailFiles();
	}

	if( parentMsgId && (typeof(parentMsgId) != "undefined") ){
		$('#msg_compose_parent_msg_id').val(parentMsgId);
	}
	else{
		$('#msg_compose_parent_msg_id').val("");
	}
	if( msgSubject && (typeof(msgSubject) != "undefined") ){
		$('#msg_compose_subject').val(msgSubject);
	}
	else if( typeof(tmpltStyle) != "undefined" && tmpltStyle == 'vldtn' ){
		$('#msg_compose_subject').val('PDB ID '+MsgingMod.sPdbId+' - Validation report and processed files are ready for your review');
	}else if( typeof(tmpltStyle) != "undefined" && tmpltStyle == 'approval-expl' ){
		$('#msg_compose_subject').val('Acknowledgement of Structure Approval');
	}else if( typeof(tmpltStyle) != "undefined" && tmpltStyle == 'approval-impl' ){
		$('#msg_compose_subject').val('Implicit Approval of Your Structure');
	}else if( typeof(tmpltStyle) != "undefined" && ['release-publ','release-nopubl'].indexOf(tmpltStyle) > -1 ){
		$('#msg_compose_subject').val('Release of PDB ID '+MsgingMod.sPdbId);
	}else if( typeof(tmpltStyle) != "undefined" && tmpltStyle == 'reminder' ){
		$('#msg_compose_subject').val('Still awaiting feedback for PDB ID '+MsgingMod.sPdbId);
	}else if( typeof(tmpltStyle) != "undefined" && tmpltStyle == 'system-unlocked' ){
		$('#msg_compose_subject').val('System Unlocked');
	}else if( MsgingMod.sCrrntContentType != "notes"){
		$('#msg_compose_subject').val('Communication regarding PDB ID '+MsgingMod.sPdbId);
	}

	if( parentMsg && (typeof(parentMsg) != "undefined") ){
		$('#msg_compose_parent_msg_div').show();
		$('#msg_compose_parent_msg').html('<p><span class="strong">SENDER:</span> '+parentMsgSnder+'</p><p><span class="strong">DATE/TIME:</span> '+parentMsgDateTime+'</p><p>'+parentMsg+'</p>');
	}
	else{
		$('#msg_compose_parent_msg').html("");
		$('#msg_compose_parent_msg_div').hide();
	}
	if( MsgingMod.sCrrntContentType == "notes"){
		$('#msg_compose_assoc_files').hide();
		$('#msg_compose_attch_aux_file').hide();

	}else{
		$('#msg_compose_assoc_files').show();
		$('#msg_compose_attch_aux_file').show();
	}

	$('#msg_compose_dep_id').val(MsgingMod.sCrrntDataSetID);

	$('#msg_compose_assoc_files input:checkbox').prop('checked',false);
	$("#msg_compose").dialog( "open" );
	$("#msg_compose_body").width($("#msg_compose").width() - 25);

	$("#msg_compose").dialog({
		resize: function() {
			$("#msg_compose_body").width($("#msg_compose").width() - 25);
		}
	});

	for( var x=0; x < MsgingMod.arrAvailFiles.length; x++){
		$('#checkbox_'+MsgingMod.arrAvailFiles[x]).show();
	}

	$('#msg_compose_subject').focus();

	$('span.ui-dialog-title').css("color","white");
	$('#msg_compose_body').scrollTop( 0 );
	clearFileUpload("all");
	$("#aux-file-span2").hide();
	$("#aux-file-span3").hide();

	/**
	if( AUTO_CHECK_ALL_FILE_REFS == 'y' ){
		//alert("auto referencing all files");
		$('#msg_compose_assoc_files').find('input[type=checkbox]').prop('checked', true);
	}
	**/
	if( typeof(tmpltStyle) != "undefined" && ['vldtn','release-publ','release-nopubl'].indexOf(tmpltStyle) > -1 ){
		$('#msg_compose_assoc_files').find('input[type=checkbox]:visible:not(.nmr)').prop('checked', true);
	}


}

function displayDraftMsg(thisRow){
	MsgingMod.bNewDraftContext = false;
	var nTds = $('td', thisRow);
    //below we are using indices as per display not as per absolute order of fields in database
    var sSubject = $(nTds[0]).text();
    var sSender = $(nTds[1]).text();
    var sTimeStamp = $(nTds[2]).text();
    var iPos = MsgingMod.oDataTable.fnGetPosition(thisRow); // getting the clicked row position
    // for below fields which are hidden, we need to use DataTables API function, fnGetData(iPos) to access hidden fields by javascript property name
    // e.g. for message body we get the value of the 6th (invisible) column, which we reference by property name of "message_text",
    var sMsgBody = MsgingMod.oDataTable.fnGetData(iPos).message_text;
    var sMsgId = MsgingMod.oDataTable.fnGetData(iPos).message_id;
    var sOrdinalId = MsgingMod.oDataTable.fnGetData(iPos).ordinal_id;
    var sParentMsgId = MsgingMod.oDataTable.fnGetData(iPos).parent_message_id;

    /**
    alert("iPos is: "+iPos);
    alert("sMsgBody is: "+sMsgBody);
    var names = "";
	for(var prop in MsgingMod.oDataTable.fnGetData(iPos) ){
		names += prop + "\n";
	}
	alert(names);
	alert( sOrdinalId );
    alert( $(nTds[2]).text() ); //column index is "visible" column index
    **/
    $('#msg_compose_msg_id').val(sMsgId);

    if( sParentMsgId != sMsgId ){
    	var prntMsg = new Message();
        getMsgDict(sParentMsgId,prntMsg);
		composeMsg(sSubject, prntMsg.message_id, prntMsg.message_text, prntMsg.sender, prntMsg.timestamp, undefined );
    }else{
    	composeMsg(sSubject, undefined, undefined, undefined, undefined, undefined );
    }

    markMsgAsRead(sMsgId);
    $('#msg_compose_body').val( sMsgBody.replace(/<br \/>/g,"\n") );
}

function getFileReferences(sMsgId){
    var arrFilesRfrncd = [];
    var returnObjList = [];

    for(var property in MsgingMod.oFilesRfrncd){
    	//alert("MsgingMod.oFilesRfrncd["+property+"] = "+MsgingMod.oFilesRfrncd[property]);

		if( property == sMsgId ){
			arrFilesRfrncd = MsgingMod.oFilesRfrncd[property];
			break;
		}
	}

    if( arrFilesRfrncd.length > 0 ){
    	for(var i=0; i < arrFilesRfrncd.length; i++ ){
    		var fileRefObj = arrFilesRfrncd[i];
    		var filePathSplitArr = fileRefObj.relative_file_url.split("/");
    		var fileName = filePathSplitArr[filePathSplitArr.length-1];
    		fileRefObj.file_name = fileName;
    		returnObjList.push(fileRefObj);
    	}
    }
    return returnObjList;
}

function getMsgDict(msgId,oMsg){

	$('#hlprfrm').ajaxSubmit({url: MsgingMod.URL.GET_MSG, async: false, clearForm: false,
        dataType: 'json',
        beforeSubmit: function (formData, jqForm, options) {
        	formData.push( {"name": "msg_id", "value": msgId } );
        },
        success: function(jsonData) {
        	if( jsonData.msg_dict ){
				//('#msg_subject').html(), $('#msg_id').val(), $('#msg_body').html(), $('#msg_sender').html(), $('#msg_timestamp').html() );
				/***
				alert("Msg Subject is: "+jsonData.msg_dict['message_subject']);
				alert("Msg ID is: "+jsonData.msg_dict['message_id']);
				alert("Msg Body is: "+jsonData.msg_dict['message_text']);
				alert("Msg Sender is: "+jsonData.msg_dict['sender']);
				alert("Msg Timestamp is: "+jsonData.msg_dict['timestamp']);
				alert("parent_message_id is: "+jsonData.msg_dict['parent_message_id']);
				***/
				oMsg.loadFromJson(jsonData.msg_dict);
			}
        }
    });
	return false;
}

function tagMsg(actionReqd,readStatus,forRelease) {
	// user tagging message as "action required" or "unread"
	$('#hlprfrm').ajaxSubmit({url: MsgingMod.URL.TAG_MSG, async: false, clearForm: false,
        beforeSubmit: function (formData, jqForm, options) {
        	formData.push({"name": "msg_id", "value": MsgingMod.sCrrntMsgId});
        	formData.push({"name": "action_reqd", "value": actionReqd});
        	formData.push({"name": "read_status", "value": readStatus});
        	formData.push({"name": "for_release", "value": forRelease});
        },
        success: function() {
        	checkGlobalMsgStatus();
        }
    });
    return false;
}
function progressStart() {
	$("#loading").fadeIn('slow').spin("large", "black");
}
function progressEnd() {
    $("#loading").fadeOut('fast').spin(false);
}
function submitNewMsg(sendStatusToUse) {
	var sUrl;
	// alert("sendStatusToUse: "+sendStatusToUse);
	if( MsgingMod.sViewContext == 'sentmsgs' || MsgingMod.bNewDraftContext == true ){
		sUrl = MsgingMod.URL.SUBMIT_MSG;
	}else{
		sUrl = MsgingMod.URL.UPDATE_DRAFT_STATE;
	}
	var hostname = document.location.hostname;
	//hostname being captured and sent to server so that server-side code can determine whether in production vs. staging vs. testing environments
	//DEBUG: alert(hostname);

	var bSuccess = false;
	$('#msg_compose_frm').ajaxSubmit({url: sUrl, async: false, clearForm: false,
		beforeSubmit: function( formData, jqForm, options ){
			//formData.push({"name": "parent_msg", "value": $('#msg_compose_parent_msg').html()});
			formData.push({"name": "send_status", "value": sendStatusToUse});
			formData.push({"name": "filesource", "value": MsgingMod.sFileSource} );
			formData.push({"name": "content_type", "value": MsgingMod.sCrrntContentType} );
			formData.push({"name": "hostname", "value": hostname} );
			formData.push({"name": "msgs_high_watermark", "value": MsgingMod.iCrrntMsgsHwm} );
			formData.push({"name": "notes_high_watermark", "value": MsgingMod.iCrrntNotesHwm} );
		},
		success: function(jsonObj) {
			// alert('jsonObj.success is: '+jsonObj.success);
			if(jsonObj.success == "true"){
				getFilesReferenced();
				//being called here because action of sending new message may add to list of files referenced
				//and so we should refresh to get latest inventory of files referenced

				bSuccess = true;

				try{
					if( String(jsonObj.pdbx_model_updated) == "true"){
						//if model file was associated with message then we need to ask DEP UI to reset itself
						alert("CKP2");
					        dodepuireset(document, MsgingMod.sDepId, jsonData.depui_pwd, false);
					}else if( String(jsonObj.pdbx_model_updated) == "false"){
						//alert("AnnotCommUI says: no annotate-model file being generated.");
					}
				}
				catch(err){
					alert("Problem when application made request to have DEP UI reset. Error is"+err.message);
				}

        	}
			else{
				var sAlert = "There was a problem submitting the message.";
				var sAppendMsg = "";
				if( jsonObj.append_msg.length > 1 ){
					sAppendMsg = String(jsonObj.append_msg);
				}
				if( sAppendMsg.length > 1 ){
					sAlert = sAlert + " " + sAppendMsg;
				}

				alert(sAlert);

			}

    	}
	});
	return bSuccess;
}

function propagateMsg( msgSubject, parentMsgId, parentMsg, parentMsgSnder, parentMsgDateTime, actionType ){
	var sUrl = (actionType == "archive") ? MsgingMod.URL.ARCHIVE_MSG : MsgingMod.URL.FORWARD_MSG;
	var targetDepId = (actionType == "archive") ? $("#archive_msg_target_depid").val() : $("#forward_msg_target_depid").val();

	var hostname = document.location.hostname;
	//hostname being captured and sent to server so that server-side code can determine whether in production vs. staging vs. testing environments
	//DEBUG: alert(hostname);
	var fileRefsStr = "";
	var arrFileRefObjs = getFileReferences(parentMsgId);
	if( arrFileRefObjs.length > 0 ){
    	var commaSep = "";
    	for(var i=0; i < arrFileRefObjs.length; i++ ){
    		var fileRefObj = arrFileRefObjs[i];
    		var displayUploadFlName = (fileRefObj.upload_file_name.length > 1) ? ' ('+fileRefObj.upload_file_name+')' : "";
    		if( i>0 ){
    			commaSep = ", ";
    		}
    		fileRefsStr += commaSep+fileRefObj.file_name+displayUploadFlName;
    	}
    }

	var message = "ORIG MESSAGE SENDER: "+parentMsgSnder+"\nORIG MESSAGE DATETIME: "+parentMsgDateTime+"\n\nORIG MESSAGE BODY:\n\n"+parentMsg+"\n\nORIG FILE REFERENCES: "+fileRefsStr;
	//alert("#"+actionType+"_msg");
	$('#hlprfrm').ajaxSubmit({url: sUrl, async: false, clearForm: false, type: 'POST',
		beforeSubmit: function( formData, jqForm, options ){
			//formData.push({"name": "parent_msg", "value": $('#msg_compose_parent_msg').html()});
			formData.push({"name": "send_status", "value": "Y"});
			formData.push({"name": "filesource", "value": MsgingMod.sFileSource} );
			formData.push({"name": "content_type", "value": MsgingMod.sCrrntContentType} );
			formData.push({"name": "hostname", "value": hostname} );
			formData.push({"name": "subject", "value": msgSubject} );
			formData.push({"name": "message", "value": message} );
			formData.push({"name": "mode", "value": "manual"} );
			formData.push({"name": "target_identifier", "value": targetDepId } );
			formData.push({"name": "orig_sender", "value": parentMsgSnder} );
			formData.push({"name": "orig_recipient", "value": "MessagingModule"} );
			formData.push({"name": "orig_date", "value": parentMsgDateTime} );
			formData.push({"name": "orig_subject", "value": msgSubject} );
			formData.push({"name": "orig_attachments", "value": fileRefsStr} );

		},
		success: function(jsonObj) {
			//alert('jsonObj.success is: '+jsonObj.success);
			var bPrblmFound = false;
			if(jsonObj.success){
				//getFilesReferenced();
				//alert("In success block.");
				for( property in jsonObj.success ){
					if( property == 'job' ){
						// if here then property represents whether or not the 'job' execution errored out
						if( jsonObj.success[property] == "error" ){
							alert("An application error has occurred while executing this request.");
							bPrblmFound = true;
						}
					}else{
						// if here then current property represents success status for a given dep ID
						if( jsonObj.success[property] == "false" ){
								alert("Problem on attempt to "+actionType+" message for dep ID: "+property+". Please verify that this is a valid dep ID.");
								bPrblmFound = true;
						}
					}
				}
				if( !bPrblmFound ){
					//alert("In sucess block. No problem found for any Dep IDs.");
					$("#"+actionType+"_msg").dialog("close");
					$("#msg_body_display").dialog("close");
				}
        	}

    	}
	});

}
