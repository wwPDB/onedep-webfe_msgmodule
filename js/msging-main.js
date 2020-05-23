/***********************************************************************************************************
File:		msging-main.js
Author:		rsala (rsala@rcsb.rutgers.edu)
Date:		2012-04-29
Version:	0.0.1

JavaScript supporting wwPDB Messaging Module web interface

2012-04-29, RPS: Created
2012-07-27, RPS: Improved handling for nested display of threaded discussions.
2012-08-13, RPS: Cosmetic updates.
2013-09-12, RPS: Improved DataTable behavior with browser resizes. "No messages for display" now shown.
2013-09-13, RPS: "Associate Files" checkboxes now only appear for files that actually are available on serverside.
					Displaying confirmation of files referenced on display of a message.
2013-09-23, RPS: Confirmation listing of files referenced on display of a message are now linked to provide download.
					Fixed bug where confirmation of files referenced would not be shown when displaying a message just sent.
					Checking for avail files to reference at beginning of each call to composeMsg().
2013-10-04, RPS: Providing file upload input on Compose Message, to accommodate attachment of auxiliary file.
2013-10-31, RPS: Support for "Notes" interface and for marking messages as "action required" or "unread".
					Also, introduced use of canned starter template when composing messages.
2013-12-03, RPS: Introduced support for different message templates. Sending hostname back to server on message
					submission to support variations in hostname when sending URL for Dep UI in email notifications
					to depositor.
2013-12-03, RPS: Resolved bug with "Reply" handling (input textarea for replay message was missing).
2014-01-14, RPS: Modifications for "action required" and "read/unread" message tagging. Updates to support notifications
					to WFM for global "action required" and "read/unread" message status.
2014-02-05, RPS: Adjusting column width to accommodate "wwpdb Annotator" value as sender when login account is "dep" user
2014-02-07, RPS: Updated so that "action required" feature not applied to "notes" content type
2014-02-25, RPS: Now requiring Subject field of message/note to be populated on 'Send'
2014-03-04, RPS: Fixed bug affecting viewing/sending of previously composed draft messages.
2014-03-04, RPS: Updates to allow tracking of instances wherein new "-annotate" version of cif model file is being propagated
					to Deposition side so that DepUI can be notified of need to reset based on new info.
2014-03-13, RPS: Ensuring alert is shown when message not successfully submitted.
2014-03-31, RPS: Fix bug with display of newlines when displaying previously saved drafts.
2014-05-07, RPS: Added functionality for allowing selection of all file references for a msg and defaulting to select all
					when certain message templates are chosen.
2014-05-19, RPS: Fixed bug of unwanted default SUBJECT for "notes"
2014-07-15, RPS: Updates to support upload of more than one auxilary file in annot messaging UI.
2014-12-04, RPS: Updates for: "archive" of messages, switching from threaded to multi-sort view,
					new "Complete Correspondence History" view, tagging messages "for Release", message template updates,
					help text pop-ups for buttons.
2014-12-05, RPS: Eliminating display of default "TODO" flags on "note" entries in "Complete Correspondence View"
2014-12-09, RPS: Display of a message's content now via separate browser window.
2015-01-28, RPS: Decoupling successful return of submitNewMsg() from call to dodepuiresetmessage()
2015-01-29, RPS: Added control for clearing '*' indicator shown in WFM UI that signals presence of annotator-authored notes.
2015-02-06, RPS: Providing spinner display while sending message.
2015-02-10, RPS: Restoring strategy of viewing message contents in same browser window (via dialog), and introducing
					support for viewing in different window via right-click but which will currently be a hidden functionality
					until cleared for use
2015-03-02, RPS: Updates per introduction of sanity check safeguards on writes to messaging cif data files.
2015-05-06, RPS: Updates per updates to jQuery 2.1.3, and associated javascript plugin updates.
2015-06-22, RPS: Updated per revamp of UI, involves integration of bootstrap.
2015-10-22, RPS: Added tooltip to indicate supported file types for attachment. Tweaked column widths to increase size of "Sender" column
2015-10-28, RPS: More updates to support EM specific message templates.
2015-12-02, RPS: Updates to optimize response time to user by running template processing in background.
2016-01-05, RPS: Updated with call to dodepuistatusmessage() in order to "unlock" dep UI as well as "reset" when "Unlock DepUI" button is clicked
2016-01-13, RPS: Updating subject line for "Withdrawn" message template to be "PDB ID [xxxx] has been withdrawn"
2016-01-19, RPS: Fixed bug affecting EM entries related map vs map-only processing
2016-01-24, RPS: Updated to support template for EM map-only, post-annotation letter
2016-02-26, RPS: Updated with improvements for dealing with ordering of columns.
2016-04-01, RPS: Converted all ajax calls using "async: false" to "async: true".
2016-04-26, RPS: Updated to safeguard against situation where "Compose Message" dialog fails to show all available checkboxes for files to attach.
 					And also providing alert box to warn annotator about possibility of not checking all required files.
2016-05-03, RPS: Fixed bug preventing display of message body when revisiting a draft messages that was a Reply to a depositor message.
2016-06-08, RPS: Changes to improve sizing of message preview pane, so that it is sized optimally to facilitate viewing of message body.
				 Introducing support for standalone correspondence viewer. Updates to EM letter templates in order to correctly distinguish
				 between map-only and map+model releases. Providing feature for tagging a message from display dialogs/panes used for reading that message.
2016-09-13, RPS: Updates to support dedicated enabling/disabling of flag for note/emails flagged from BMRB
					Allowing option of tagging message as read/unread from tag pop-up menu available from message view panel and message view dialog.
2017-08-18, RPS: Accommodating updates in behavior for "withdrawn" letter template
*************************************************************************************************************/
//"MsgingMod" namespacing for any globals
var MsgingMod = {
    ////////////////////////////////////////////////////////////////////////////
    // using information dynamically populated in msging_launch_tmplt.html file
    // to initialize some of the crucial properties for MsgingMod
    sSessionId: SESSION_ID,
    sDepId: DEPID,
    sDisplayId: DISPLAYID,
    sPdbId: "[PDBID]",
    sAccessionIdString: "[ACCESSION_ID_STRING]",
    sAccessionIdStringEmRel: "[ACCESSION_ID_STRING_EM_REL]",
    sSessionPathPrefix: SESS_PATH_PREFIX,
    sFileSource: FILE_SOURCE,
    //sAnnotator : ANNOTATOR,
    sDefaultMsgType: "vldtn",
    bEmbeddedView: EMBEDDED_VW,
    bEmEntry: EM_ENTRY,
    bEmMapOnly: EM_MAP_ONLY,
    bEmMapAndModel: EM_MAP_AND_MODEL,
    ////////////////////////////////////////////////////////////////////////////
    iAjaxTimeout: 60000,
    sAdminContact: 'Send comments to: <a href="mailto:rsala@rcsb.rutgers.edu">help@wwpdb-dev.rutgers.edu</a>',
    sInfoStyle: '<span class="ui-icon ui-icon-info fltlft"></span> ',
    sErrStyle: '<span class="ui-icon ui-icon-alert fltlft"></span> ',
    bDebug: true,
    oDataTable: undefined,
    oFilesRfrncd: {},
    iCnt_DrawBackCalledOnCurrentTbl: 0,
    bResetDisplay: true,
    iCrrntMsgsHwm: null,
    iCrrntNotesHwm: null,
    sCrrntRowSlctd: "",
    sCrrntMsgIdSlctd: "",
    sCrrntDataSetID: "D_000000", // default being set for testing
    sCrrntContentType: "msgs", // i.e. "msgs" vs. "notes", initial default to msgs
    sUseServerSidePrcssing: "true", //string b/c also used as query param
    sUseThreaded: "false", //string b/c also used as query param
    sNotesFlagActive: "true",
    sNotesFlagActiveBmrb: "true",
    bAllowSorting: false,
    sViewContext: "sentmsgs",
    bNewDraftContext: false,
    iMsgCmpsHtMin: 775,
    iMsgCmpsHtWthParentContent: 875,
    //iMsgDisplHtMin : 600,
    iMsgDisplWdthMin: 1200,
    iMsgDisplHtMin: 800,
    //iMsgDisplHtWthParentContent : 800,
    iMsgDisplHtWthParentContent: 850,
    iNoteCmpsHt: 600,
    sCrrntCmpsMsgTmplt: "",
    iCmpsTotalFilesAvail: 0,
    arrAvailFiles: [],
    arrMsgsAlreadyRead: [],
    arrMsgsForRelease: [],
    arrMsgsNoActionReqd: [],
    arrOrderedColumnList: [],
    arrColDisplOrderCorrHx: [],
    bNotesExist: false,
    bTurnOffDTmDataConversion: false,
    bMsgPanelShown: false,
    iDTscrollTopSaved: 0,
    iRsltsResizeContainerInitHt_Msgs: 275,
    iBottomDTpaddingHt_Msgs: 100,
    iScrollY_Msgs: 175,
    iRsltsResizeContainerInitHt_CommHstry: 385,
    iBottomDTpaddingHt_CommHstry: 220,
    iScrollY_CommHstry: 175,
    iRsltsResizeContainerHtPrePrint_CommHstry: 385,
    bCorrspndncHstryStndaln: false,
    sStatusCode: "",
    // URL constants
    URL: {
        WFLAUNCH: '/service/messaging/new_session/wf',
        DEVLAUNCH: '/service/messaging/launch',
        SEE_RAW_JSON_FOR_DTBL: '/service/messaging/test_see_json',
        DTBL_GET_TMPLT: '/service/messaging/get_dtbl_config_dtls',
        DTBL_AJAX_LOAD: '/service/messaging/get_dtbl_data',
        DTBL_DELETE_ROW: '/service/messaging/delete_row',
        SUBMIT_MSG: '/service/messaging/submit_msg',
        ARCHIVE_MSG: '/service/messaging/archive_msg',
        FORWARD_MSG: '/service/messaging/forward_msg',
        UPDATE_DRAFT_STATE: '/service/messaging/update_draft_state',
        MARK_MSG_READ: '/service/messaging/mark_msg_read',
        TAG_MSG: '/service/messaging/tag_msg',
        EXIT_NOT_FINISHED: '/service/messaging/exit_not_finished', //currently not used
        EXIT_FINISHED: '/service/messaging/exit_finished', //currently not used
        GET_MSG: '/service/messaging/get_msg',
        CHECK_AVAIL_FILES: '/service/messaging/check_avail_files',
        GET_FILES_RFRNCD: '/service/messaging/get_files_rfrncd',
        CHECK_GLBL_MSG_STATUS: '/service/messaging/check_global_msg_status',
        DISPLAY_MSG: '/service/messaging/display_msg',
        TOGGLE_NOTES_FLAGGING: '/service/messaging/toggle_notes_flagging',
        GET_DEPUI_PWD: '/service/messaging/get_depui_pwd',
        GET_MSG_TMPLTS: '/service/messaging/get_msg_tmplts',
        VERIFY_DEPID: '/service/messaging/verify_depid',
    },
    LABEL: {
        MSG_THREAD_VIEW: "Switch to Message Thread View",
        STD_SORT_VIEW: "Switch to Standard Sorting View",
        TURN_OFF_NOTES_FLAG: "Disable Notes Flag in WFM UI",
        TURN_ON_NOTES_FLAG: "Enable Notes Flag in WFM UI",
        TURN_OFF_NOTES_FLAG_BMRB: "Disable BMRB Notes Flag in WFM UI",
        TURN_ON_NOTES_FLAG_BMRB: "Enable BMRB Notes Flag in WFM UI",
        SHOW_MSG_PNL: "Show Message View Panel",
        HIDE_MSG_PNL: "Hide Message View Panel"
    },
    STYLE: {
        COLOR_NOTES: "purple",
        COLOR_MSGS: "black",
        COLOR_COMMHSTRY: "blue"
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////BEGIN: adding customizations to javascript prototypes///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//need the below in cases of IE where indexOf is not defined for Array datatypes
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}
//adding convenience function to String prototype for checking if given string startsWith given string
String.prototype.startsWith = function(str) {
    return (this.match("^" + str) == str);
};

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

    $("#context_menu").menu();
    $('#context_menu_content').show();
    $('[data-toggle="tooltip"]').tooltip();

    MsgingMod.sCrrntContentType = CONTENT_TYPE; // sourcing value from global variable defined in msging_launch_tmplt

    // initialize Forward Message dialog as jQuery UI dialog box
    $("#forward_msg").dialog({
        autoOpen: false,
        height: 400,
        width: 400,
        modal: true,
        buttons: {
            "Forward": function() {
                var msgId = MsgingMod.sCrrntMsgIdSlctd;
                var opts = {
                    context: "propagate",
                    propagate_type: "forward",
                    callback: propagateMsg
                };
                getMsgDict(msgId, opts);
            },
            "Cancel": function() {
                $("#forward_msg").dialog("close");
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

    if (typeof CORRSPNDNC_HSTRY_STNDALN === "undefined" || CORRSPNDNC_HSTRY_STNDALN === null || CORRSPNDNC_HSTRY_STNDALN === false) {
        getMsgTemplates();
        autoLoadMsgs();
        confirmAvailFiles();
        getFilesReferenced();
        checkGlobalMsgStatus();
    } else if (CORRSPNDNC_HSTRY_STNDALN === true) {
        MsgingMod.bCorrspndncHstryStndaln = true;
        loadCommHstry();
    }


    $('#threaded_view_toggle').bt({
        contentSelector: "$('#threaded_view_toggle_help').html()",
        positions: ['right', 'top'],
        trigger: 'hoverIntent',
        width: '350px',
        hoverIntentOpts: {
            interval: 850
        }
    });
    $('#notes_flag_toggle').bt({
        contentSelector: "$('#notes_flag_toggle_help').html()",
        positions: ['right', 'top'],
        trigger: 'hoverIntent',
        width: '350px',
        hoverIntentOpts: {
            interval: 850
        }
    });
    $('#notes_flag_bmrb_toggle').bt({
        contentSelector: "$('#notes_flag_bmrb_toggle_help').html()",
        positions: ['right', 'top'],
        trigger: 'hoverIntent',
        width: '350px',
        hoverIntentOpts: {
            interval: 850
        }
    });

    // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // //////////////////BEGIN: EVENT HANDLERS ////////////////////////////////////////////////////////////////////////////////
    // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    $('.tag_msg').on('click', function() {
        var selectedRow = $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + MsgingMod.sCrrntRowSlctd)[0];
        promptForMsgTags(selectedRow, "msgbody_visible");
    });


    $('#archive_msg_ok').on('click', function() {
        var msgId = MsgingMod.sCrrntMsgIdSlctd;
        var opts = {
            context: "propagate",
            propagate_type: "archive",
            callback: propagateMsg
        };
        getMsgDict(msgId, opts);
    });

    $('#tag_msg_ok').on('click', function() {
        var actionRqd = 'Y'; //defaults to 'Y' on assumption that msg by default requires action unless manually cleared by annotator
        var readStatus = 'Y'; //defaults to 'Y' on assumption that msg cannot be selected for tagging unless already "read"
        var forRelease = 'N'; //defaults to 'N' on assumption that msg cannot be selected for tagging unless already "read"
        $('#tag_msg :checkbox:checked').each(function() {
            value = $(this).val();

            if (value == "no_action_reqd") {
                actionRqd = "N";
            }
            if (value == "unread") {
                readStatus = "N";
            }
            if (value == "for_release") {
                forRelease = "Y";
            }
        });

        tagMsg(actionRqd, readStatus, forRelease);
        if (MsgingMod.sCrrntContentType == "msgs") { //may no longer need this check, as we are currently only allowing tagging of sent messages (i.e. no drafts, no notes content being tagged)s
            MsgingMod.iDTscrollTopSaved = $('#rslts #' + MsgingMod.sDepId + '_tbl_wrapper .dataTables_scroll .dataTables_scrollBody').scrollTop();
            redrawTable();
        }

    });

    $('#tag_msg_cancel').on('click', function() {
        $("#context_menu").hide();
    });

    $("#unlock_depui").on("click", function() {
        // Open modal
        if (MsgingMod.sStatusCode == 'REL') {
            $("#dialog-unlock-body").html("<p style='color:red;text-align:center;'>WARNING -- WARNING -- WARNING -- WARNING -- WARNING</p><p>This entry has already been <span style='color:red;'>RELEASED</span>!!!</p><p>Click on OK to confirm that you do wish to reset and unlock the Dep UI for this entry.</p>")
        } else {
            $("#dialog-unlock-body").html("<p>Click on OK to confirm that you do wish to reset and unlock the Dep UI for this entry.</p>");
        }
        $("#dialog-unlock-confirm").modal("show");
    });


    $('#tag_unlock_ok').on('click', function() {
        progressStart();
        setTimeout(function() {
            $('#hlprfrm').ajaxSubmit({
                url: MsgingMod.URL.GET_DEPUI_PWD,
                async: true,
                clearForm: false,
                success: function(jsonData) {
                    if (jsonData) {
                        try {
                            if (jsonData.depui_pwd.length > 0) {
                                dodepuistatus(MsgingMod.sSessionId, MsgingMod.sDepId, 'unlock_with_rest');
                                progressEnd();
                                MsgingMod.sViewContext = "sentmsgs";
                                MsgingMod.sCrrntContentType = "msgs";
                                reLoadMsgs();
                                composeMsg(undefined, undefined, undefined, undefined, undefined, 'system-unlocked');
                            } else {
                                alert("Problem obtaining access to Dep UI");
                            }
                        } catch (err) {
                            alert("Problem when application made request to have DEP UI reset. err=" + err.message);
                        }
                    }
                }
            });
            progressEnd();

        }, 1100);
    });

    $(".modal-wide").on("show.bs.modal", function() {
        var height = $(window).height() - 100;
        $(this).find(".modal-body").css("max-height", height);
    });

    $('#msg_compose').on('shown.bs.modal', function(e) {
        $("#msg_compose_body").width($("#msg_compose_frm").width() - 25);
        $('#msg_compose .modal-body').scrollTop(0);


    });

    function startSend() {
        $("#msg_compose").modal("hide");
        progressStart();
        submitNewMsg('Y');
    }

    $('.send').on('click', function(e) {
        var msgSubj = $('#msg_compose_subject').val();

        if (msgSubj.length > 1) { // i.e.this msg had content in Message field
            if (MsgingMod.sCrrntCmpsMsgTmplt == 'vldtn' || MsgingMod.sCrrntCmpsMsgTmplt == 'maponly-authstatus-em' || msgSubj.indexOf("Validation report") >= 0 || msgSubj.indexOf("are ready for your review") >= 0) {
                var numAttchmnts = $('#msg_compose_assoc_files').find('.checkbox-inline input[type=checkbox]:checked').length;
                if (numAttchmnts < MsgingMod.iCmpsTotalFilesAvail) { // i.e. all avail files were NOT selected for attachment
                    var doSend = confirm("WARNING: Only " + numAttchmnts + " file(s) selected for attachment. Click 'Cancel' if you wish to abort. Click 'OK' if you wish to send.");
                    if (doSend == true) {
                        startSend();
                    }
                } else { // all avail files were selected for attachment
                    startSend();
                }
            } else { // this msg was not regarding validation report
                startSend();
            }
        } else { // this msg had no content in Message field
            alert("Please supply a message 'Subject'.");
        }

    });


    $('.reply').on('click', function() {
        var viewOrigin = ($(this).attr('id').split("_"))[1];
        var preFix = "";
        if (viewOrigin == "preview") preFix = "preview_";
        var msgId = $('#' + preFix + 'msg_id').val();
        var opts = {
            context: "compose",
            msg_prefix: "RE: ",
            callback: composeMsg
        };
        getMsgDict(msgId, opts);
    });

    $('.save_draft').on('click', function() {
        submitNewMsg('N');
    });

    $('.archive').on('click', function() {
        $('#archive_msg_target_depid').val(MsgingMod.sDepId);
        $('#archive_msg').modal("show");
    });

    $('#collapse_msg_preview').on('show.bs.collapse', function() {
        MsgingMod.bMsgPanelShown = true;
        var selectedRow = $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + MsgingMod.sCrrntRowSlctd)[0];
        if (typeof(selectedRow) == "undefined") {
            //if no row currently selected in current view (e.g. after paging to different page) then default to first visible row
            selectedRow = $('#rslts #' + MsgingMod.sDepId + '_tbl.dataTable tbody tr.dt_row:first')[0];
        }
        if (typeof(selectedRow) != "undefined") {
            $('#btn_collapse_msg_preview').text(MsgingMod.LABEL.HIDE_MSG_PNL);
            markRowAsSelected(selectedRow, false);
            previewMsg(selectedRow);
        } else {
            $("#collapse_msg_preview").collapse('hide');
        }

    });

    $('#collapse_msg_preview').on('shown.bs.collapse', function() {
        /***
		var topOfPanePx = $("#collapse_msg_preview").offset();
	    //console.log("topOfPanePx: "+topOfPanePx.top);

	    var windowHeightPx = $(window).height();
	    //console.log("windowHeightPx: "+windowHeightPx);

	    var navbarHeightPx = $('#msging-navbar').height();
	    //console.log("navbarHeightPx: "+navbarHeightPx);

	    var newResizableHeightPx = Math.floor(windowHeightPx-topOfPanePx.top) - 4*(navbarHeightPx);

	    //console.log("newResizableHeight: "+newResizableHeightPx);

	    //$("#resize_container").css('height', newResizableHeightPx);
	    ***/

        //console.log("#preview_msg_body.height: "+$("#preview_msg_body").height());
        $("#resize_container").css('height', $("#preview_msg_body").height() + 70);

    });

    $('#collapse_msg_preview').on('hide.bs.collapse', function() {
        $('#btn_collapse_msg_preview').text(MsgingMod.LABEL.SHOW_MSG_PNL);
        MsgingMod.bMsgPanelShown = false;
    });

    $(".get_content_type").click(function() {
        var id = $(this).attr('id');
        //alert("triggered");
        $('.navbar li').removeClass("active");
        //$(this).parent().addClass("active");
        var selectedVal = $(this).attr("name");

        $('#hlprfrm_content_type').val(selectedVal);
        CONTENT_TYPE = selectedVal;
        MsgingMod.sCrrntContentType = CONTENT_TYPE;

        $('#hlprfrm_auto_launch_compose').val('false');

        if (selectedVal == 'commhstry') {
            loadCommHstry();
        } else {
            if (id == "get_draft_msgs" || id == "get_draft_notes") {
                loadDrafts();
            } else {
                MsgingMod.sViewContext = "sentmsgs";
                reLoadMsgs();
            }
        }

    });

    $('.test_getmsgs_see_json').click(function() {
        var depDataSetId = $(this).attr('name');
        MsgingMod.sCrrntDataSetID = depDataSetId;
        loadTestExampleSeeJson(depDataSetId);
    });

    $('#threaded_view_toggle').click(function() {
        // alert("button clicked");
        //var depDataSetId = $(this).attr('name');
        var rqstdView = $(this).text();
        var depDataSetId = MsgingMod.sDepId;
        var newLabel = (rqstdView == MsgingMod.LABEL.MSG_THREAD_VIEW) ? MsgingMod.LABEL.STD_SORT_VIEW : MsgingMod.LABEL.MSG_THREAD_VIEW;

        $(this).text(newLabel);

        // MsgingMod.sUseServerSidePrcssing = "false";
        //MsgingMod.sUseServerSidePrcssing = "true";
        MsgingMod.sUseThreaded = (rqstdView == MsgingMod.LABEL.MSG_THREAD_VIEW) ? "true" : "false";
        //MsgingMod.bAllowSorting = true;
        MsgingMod.bAllowSorting = (rqstdView == MsgingMod.LABEL.MSG_THREAD_VIEW) ? false : true;

        // below we reset count for # times DataTables fnDrawCallBack was called
        MsgingMod.iCnt_DrawBackCalledOnCurrentTbl = 0;
        loadMsgsDT('Y');
    });

    $('#notes_flag_toggle').click(function() {
        // alert("button clicked");
        //var depDataSetId = $(this).attr('name');
        var rqstd = $(this).text();
        var depDataSetId = MsgingMod.sCrrntDataSetID;
        var newLabel = (rqstd == MsgingMod.LABEL.TURN_OFF_NOTES_FLAG) ? MsgingMod.LABEL.TURN_ON_NOTES_FLAG : MsgingMod.LABEL.TURN_OFF_NOTES_FLAG;

        $(this).text(newLabel);

        MsgingMod.sNotesFlagActive = (rqstd == MsgingMod.LABEL.TURN_OFF_NOTES_FLAG) ? "false" : "true";

        toggleNotesFlagging();
    });

    $('#notes_flag_bmrb_toggle').click(function() {
        // alert("button clicked");
        //var depDataSetId = $(this).attr('name');
        var rqstd = $(this).text();
        var depDataSetId = MsgingMod.sCrrntDataSetID;
        var newLabel = (rqstd == MsgingMod.LABEL.TURN_OFF_NOTES_FLAG_BMRB) ? MsgingMod.LABEL.TURN_ON_NOTES_FLAG_BMRB : MsgingMod.LABEL.TURN_OFF_NOTES_FLAG_BMRB;

        $(this).text(newLabel);

        MsgingMod.sNotesFlagActiveBmrb = (rqstd == MsgingMod.LABEL.TURN_OFF_NOTES_FLAG_BMRB) ? "false" : "true";

        toggleNotesFlagging("bmrb");
    });

    $('#msging-navbar').on("click", ".compose", function() {
        if (MsgingMod.sViewContext == "drafts") {
            MsgingMod.bNewDraftContext = true;
        } else {
            MsgingMod.bNewDraftContext = false;
        }
        var tmpltStyle = ($(this).attr('id').split("_"))[1];
        composeMsg(undefined, undefined, undefined, undefined, undefined, tmpltStyle);
    });

    $('.edit').click(function() {
        var selectedRow = $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + MsgingMod.sCrrntRowSlctd)[0];

        displayDraftMsg(selectedRow);
    });

    $('#rslts').on("click", 'tbody tr', function(event) {
        var thisRow = this;

        if (event.ctrlKey || event.metaKey) {
            if (MsgingMod.sCrrntContentType != "commhstry" && MsgingMod.sViewContext != "drafts") {

                markRowAsSelected(thisRow, true);
                contextMenuHandler(thisRow, event);
            }
            return false;
        } else {
            markRowAsSelected(thisRow, false);
            //if( MsgingMod.sCrrntDataSetID == "D_000000" || MsgingMod.sCrrntDataSetID == "D_8000200335" || MsgingMod.sCrrntDataSetID == "D_8000200292" || MsgingMod.sCrrntDataSetID == "D_8000200626"){
            //previewMsg(thisRow);  // PREVIEW MSG modification
            //}
            if (MsgingMod.bMsgPanelShown) previewMsg(thisRow);
        }
    });

    $('#rslts').on("contextmenu", 'tbody tr', function(event) {
        if (MsgingMod.sCrrntContentType != "commhstry" && MsgingMod.sViewContext != "drafts") {
            var thisRow = this;
            markRowAsSelected(thisRow, true);

            contextMenuHandler(thisRow, event);

        }
        return false;
    });

    function contextMenuHandler(thisRow, event) {

        if ($(thisRow).hasClass("msg_read")) {
            if (MsgingMod.sCrrntContentType == "msgs") {
                $('#tag_msg_choice').removeClass('ui-state-disabled');
            }
            $("#archv_msg").removeClass('ui-state-disabled');
        } else {
            $('#tag_msg_choice').addClass('ui-state-disabled');
            $("#archv_msg").addClass('ui-state-disabled');
        }

        $("#context_menu").show();

        $("#context_menu").position({
            my: "left-2 top-2",
            of: event
        });

        $(document).on('click', function(event) {
            // this block of code allows us to hide the context menu when user clicks on any portion of the screen outside of the context menu
            if (!$(event.target).closest('#context_menu').length) {
                $("#context_menu").hide();
            }
        });
    }

    $('.msg_context_menu_choice').click(function() {
        var action = $(this).attr('id');
        var selectedRow = $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + MsgingMod.sCrrntRowSlctd)[0];
        if (action == 'tag_msg_choice') {
            //alert("tag_msg_choice selected and selected row's ID is: "+MsgingMod.sCrrntRowSlctd+" and it is a: "+selectedRow.prop('tagName'));
            if ($(selectedRow).hasClass("msg_read")) {
                promptForMsgTags(selectedRow, "msgbody_hidden");
            }
        } else if (action == 'archv_msg') {
            if ($(selectedRow).hasClass("msg_read")) {
                $('#archive_msg_target_depid').val(MsgingMod.sDepId);
                $('#archive_msg').modal("show");
            }
        } else if (action == 'fwd_msg') {
            $('#forward_msg_target_depid').val("");
            $('#forward_msg').dialog("open");
        } else if (action == "view_msg_nw_wndw") {
            displayMsg(selectedRow, true);
            var rowId = $(selectedRow).attr("id");
            $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + rowId).addClass('msg_read');
        }
        $("#context_menu").hide();

    });

    $("#rslts").on("dblclick", "tbody tr", function(e) {
        // alert("DT_RowId is: "+$(this).attr("id"));
        var rowId = $(this).attr("id");
        if ($('#rslts table.DTFC_Cloned #' + rowId).hasClass('row_selected') || $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + rowId).hasClass('row_selected')) {
            /**$('#rslts table.DTFC_Cloned #'+rowId).removeClass('row_selected');
        	$('#rslts #'+MsgingMod.sCrrntDataSetID+'_tbl #'+rowId).removeClass('row_selected');
        	$('#'+MsgingMod.sCrrntDataSetID+'_delete_row').hide();
        	$('.help.unselect').hide();
            $('.help.select_to_delete').show();
        	MsgingMod.sCrrntRowSlctd = "";***/
        } else {
            $('#rslts tbody tr.row_selected').removeClass('row_selected');
            $('#rslts table.DTFC_Cloned #' + rowId).addClass('row_selected');
            $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + rowId).addClass('row_selected');
            $('#' + MsgingMod.sCrrntDataSetID + '_delete_row').show();
            $('.help.unselect').show();
            $('.help.select_to_delete').hide();
            MsgingMod.sCrrntRowSlctd = rowId;
        }
        if (!(MsgingMod.bCorrspndncHstryStndaln)) {
            $('#rslts table.DTFC_Cloned #' + rowId).addClass('msg_read');
            $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + rowId).addClass('msg_read');
        }

        if (MsgingMod.sViewContext != "drafts") {
            displayMsg(this, false);
        } else {
            displayDraftMsg(this);
        }

    });

    $(".clearfile").on("click", function(event) {
        var indx = $(this).attr('id').split("clear")[1];
        clearFileUpload(indx);
    });

    $(".addanother").on("click", function(event) {
        var indx = $(this).attr('id').split("addanother")[1];
        $("#aux-file-span" + (parseInt(indx) + 1)).removeClass("hidden");
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
    $('.assoc_files_chckbox input[type=checkbox]').on("click", function() {
        //alert('Captured click event');
        var checked = this.checked;
        if (!checked) {
            $('#select_all_file_references').prop('checked', this.checked);
        }
    });

    $("#msglist_panel").on("click", '.DTTT_button_print', function() {
        $("#rslts_resize_container").height($("#" + MsgingMod.sDepId + "_tbl").height() + 10);

    });
    //////////////////////////////////SCRIPTING TO PROTOTYPE USE OF SELECTION CHECKBOXES 2012-04-23 //////////////////////////////////////////////////////
    $('#testcheckboxes').click(function() {
        var rowIds = '';
        var rowCount = 0;
        $('#rslts :checkbox:checked').each(function() {
            rowCount++;
            rowIds += ((rowIds.length > 0) ? ',' : '') + $(this).parents('td').attr('true_row_idx');
            //alert("Value of 'name' #"+ rowCount + ": " + $(this).attr('name') );
        });
        $('#rowids').val(rowIds);

        if (rowCount > 0) {
            alert("List of row IDs currently selected for cif category '" + MsgingMod.sCrrntDataSetID + "' is: " + rowIds);
        } else {
            alert("Currently no row(s) selected for cif category '" + MsgingMod.sCrrntDataSetID + "'");
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
function getMsgTemplates() {
    //submit ajax call to get starter template that will ultimately be populated with data
    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.GET_MSG_TMPLTS,
        clearForm: false,
        dataType: 'json',
        success: function(jsonData) {
            $('#msg_compose_frm').after(jsonData.html); //populate target div with markup representing the "skeleton" starter table

            if ('status_code' in jsonData) {
                MsgingMod.sStatusCode = jsonData.status_code;
            }

            MsgingMod.bEmEntry = ($("#em_entry").text() === "true") ? true : false;
            $('#msg_compose_input_em_entry').val($("#em_entry").text());

            MsgingMod.bEmMapOnly = ($("#maponly").text() === "true") ? true : false;
            $('#msg_compose_input_em_map_only').val($("#maponly").text());
            if (MsgingMod.bEmMapOnly) {
                $('#cmps_default').parent().after('<li id="li_maponly-authstatus-em"><a href="#" class="compose" id="cmps_maponly-authstatus-em">EM Map-Only Post-Annotation</a></li>');
            }

            MsgingMod.bEmMapAndModel = ($("#mapandmodel").text() === "true") ? true : false;
            $('#msg_compose_input_em_map_and_model').val($("#mapandmodel").text());

            MsgingMod.sAccessionIdString = $("#accession_ids").text();
            MsgingMod.sAccessionIdStringEmRel = $("#accession_ids_em_rel").text();
            MsgingMod.sPdbId = $("#pdb_id").text();
            MsgingMod.sDefaultMsgType = $("#default_msg_tmplt").text();
            $("#new_msg_menu").removeClass("disabled").addClass("hoveractivate");
            //$("#new_msg_menu").addClass("hoveractivate");
            $("#new_msg_menu_link").removeClass("disabled");
            $("#tmplts_loading_prompt_a").removeClass("bg-warning").addClass("bg-success").html("<strong>Message templates now loaded</strong>");
            $("#tmplts_loading_prompt").fadeOut(4000, function() {
                $("#tmplts_loading_prompt").addClass("hidden");
            });
            // here if in "embedded view" of added annotation, we have the UI automatically launch the "Compose" dialog if indicated by AUTO_LAUNCH_COMPOSE global var
            if (MsgingMod.bEmbeddedView == true && MsgingMod.sCrrntContentType == "msgs" && AUTO_LAUNCH_COMPOSE == true) {
                composeMsg(undefined, undefined, undefined, undefined, undefined, MsgingMod.sDefaultMsgType);
                AUTO_LAUNCH_COMPOSE = false;
            }
            //$("#tmplts_loading_prompt").hide();

        }
    });
    return false;

}

function loadDrafts() {
    MsgingMod.sCrrntDataSetID = MsgingMod.sDepId;
    MsgingMod.sUseThreaded = "false";
    MsgingMod.bAllowSorting = true;
    // below we reset count for # times DataTables fnDrawCallBack was called
    MsgingMod.iCnt_DrawBackCalledOnCurrentTbl = 0;
    loadMsgsDT('N');
}

function redrawTable(holdPosition) {
    /***************************************************************************
     * ask given cif DataTable to redraw itself
     *		params:
     *				cifCtgry --> cif category name
     *				holdPosition --> boolean indicating whether or not table should
     *									reposition at first page of data or maintain
     *									position at current page/record.
     *									defaults to true
     *****************************************************************************/
    holdPosition = typeof holdPosition !== 'undefined' ? holdPosition : true;
    var table = $('#' + MsgingMod.sDepId + '_tbl').DataTable();
    var resetPosition = !holdPosition;
    //table.ajax.reload( null, resetPosition );
    table.draw(resetPosition);

}

function loadCommHstry() {
    //MsgingMod.sUseServerSidePrcssing = "true";
    MsgingMod.sUseThreaded = "false";
    MsgingMod.bAllowSorting = true;
    $('#depdatasetid').show().html("Deposition Dataset ID: " + MsgingMod.sCrrntDataSetID);
    // below we reset count for # times DataTables fnDrawCallBack was called
    MsgingMod.iCnt_DrawBackCalledOnCurrentTbl = 0;
    MsgingMod.sCrrntContentType = "commhstry";
    loadCommHstryDT(MsgingMod.sCrrntDataSetID);
}

function markRowAsSelected(thisRow, bCntxtMenuFlag) {
    //bCntxtMenuFlag : boolean indicating whether current "select row" event is for launch of context menu

    var rowId = $(thisRow).attr("id");
    if ($('#rslts table.DTFC_Cloned #' + rowId).hasClass('row_selected') || $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + rowId).hasClass('row_selected')) {
        if (!bCntxtMenuFlag) {
            $('#rslts table.DTFC_Cloned #' + rowId).removeClass('row_selected');
            $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + rowId).removeClass('row_selected');
            MsgingMod.sCrrntRowSlctd = "";
        }
    } else {
        $('#rslts tbody tr.row_selected').removeClass('row_selected');
    }

    $('#rslts table.DTFC_Cloned #' + rowId).addClass('row_selected');
    $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + rowId).addClass('row_selected');
    MsgingMod.sCrrntRowSlctd = rowId;

    var iPos = MsgingMod.oDataTable.fnGetPosition(thisRow);
    var sMsgId = MsgingMod.oDataTable.fnGetData(iPos).message_id;
    MsgingMod.sCrrntMsgIdSlctd = sMsgId;

}

function promptForMsgTags(thisRow, context) {

    if (MsgingMod.sCrrntContentType == "msgs") {

        if ($(thisRow).hasClass("row_selected")) {

            if ($(thisRow).hasClass("msg_read")) {
                // alert("This row has been read already.");

                $('#chckbx_unread input').prop("checked", false);

                if ($(thisRow).hasClass("frm_annotator")) {
                    $('#chckbx_no_action_reqd input').prop("checked", true);
                    $('#chckbx_no_action_reqd').addClass("hidden");
                } else {
                    $('#chckbx_no_action_reqd').removeClass("hidden");

                    if ($(thisRow).hasClass("no_action_reqd")) {
                        //alert("row has 'no_action_reqd'");
                        $('#chckbx_no_action_reqd input').prop("checked", true);
                    } else {
                        $('#chckbx_no_action_reqd input').prop("checked", false);
                    }
                }

                if ($(thisRow).hasClass("for_release")) {
                    $('#chckbx_for_release input').prop("checked", true);
                } else {
                    $('#chckbx_for_release input').prop("checked", false);
                }
                $("#tag_msg").modal("show");
            }
        }
    }

}

function closeWindow() {
    //uncomment to open a new window and close this parent window without warning
    //var newwin=window.open("popUp.htm",'popup','');
    if (navigator.appName == "Microsoft Internet Explorer") {
        this.focus();
        self.opener = this;
        self.close();
    } else {
        window.open('', '_parent', '');
        window.close();
    }
}

function iframeCloser() {
    // Check if we are living within an iframe and if so try to invoke the
    // iframe close method in the parent window...
    var isInIFrame = (window.location != window.parent.location) ? true : false;
    if (isInIFrame) {
        var parentWindow = null;
        if (window.parent != window.top) {
            parentWindow = window.top;
        } else {
            parentWindow = window.parent;
        }
        if ($.isFunction(parentWindow.hideEditFrame)) {
            console.log("Invoking iframe close method");
            parentWindow.hideEditFrame();
        } else {
            console.log(">>>WARNING -Can't find iframe destroy method");
        }
    }
}

function checkGlobalMsgStatus() {
    /***************************************************************************
     * Check for global (i.e. as opposed to individual message status) message
     * status for the entire population of messages for current entry.
     * This to allow for corresponding flags, visual prompts of significance to the users.
     *
     * 		types of status checked:
     * 			are all messages read?
     * 			have all messages requiring action addressed
     * 			do any notes exist?
     *
     *****************************************************************************/
    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.CHECK_GLBL_MSG_STATUS,
        async: true,
        clearForm: false,
        success: function(jsonData) {
            if (jsonData) {
                if (jsonData.all_msgs_read == 'true') {
                    //alert("TESTING: All messages *from depositor* are now read for this DepID");
                }
                if (jsonData.all_msgs_actioned == 'true') {
                    //alert("TESTING: All messages *from depositor* have had required actions fulfilled for this DepID");
                }
                if (jsonData.any_notes_exist == 'true') {
                    MsgingMod.bNotesExist = true;
                    //alert("we have notes");
                } else {
                    MsgingMod.bNotesExist = false;
                    //alert("no notes");
                }
                if (typeof(jsonData.num_notes_records) != "undefined" && jsonData.num_notes_records >= 0) {
                    //alert("Current number of notes: "+jsonData.num_notes_records);
                    MsgingMod.iCrrntNotesHwm = jsonData.num_notes_records;
                }
                if (jsonData.notes_flag_active && jsonData.notes_flag_active.length) {
                    MsgingMod.sNotesFlagActive = String(jsonData.notes_flag_active);

                    if (MsgingMod.sNotesFlagActive == "true")
                        $('#notes_flag_toggle').text(MsgingMod.LABEL.TURN_OFF_NOTES_FLAG);
                    else
                        $('#notes_flag_toggle').text(MsgingMod.LABEL.TURN_ON_NOTES_FLAG);
                }
                if (jsonData.notes_flag_active_bmrb && jsonData.notes_flag_active_bmrb.length) {
                    $('#notes_flag_bmrb_toggle').removeClass("hidden");

                    MsgingMod.sNotesFlagActiveBmrb = String(jsonData.notes_flag_active_bmrb);

                    if (MsgingMod.sNotesFlagActiveBmrb == "true")
                        $('#notes_flag_bmrb_toggle').text(MsgingMod.LABEL.TURN_OFF_NOTES_FLAG_BMRB);
                    else
                        $('#notes_flag_bmrb_toggle').text(MsgingMod.LABEL.TURN_ON_NOTES_FLAG_BMRB);
                }

                if (MsgingMod.bNotesExist) {
                    //alert("we have notes");
                    //$("#radio_content_type_notes_lbl").css("background","purple");
                    var styles = {
                        //color : "#9900CC",
                        color: "#FF0000",
                        borderColor: "#FF0000 rgb(82, 82, 82)",
                        fontWeight: "bold"
                        //fontSize: "98%"
                    };
                    $("#get_content_type_notes").css(styles);
                    $("#get_content_type_notes").bt('There are notes present for this deposition.', {
                        positions: ['top', 'right'],
                        trigger: 'hoverIntent',
                        hoverIntentOpts: {
                            interval: 850
                        }
                    });
                } else {
                    $("#get_content_type_notes").bt('There are currently no notes for this deposition.', {
                        positions: ['top', 'right'],
                        trigger: 'hoverIntent',
                        hoverIntentOpts: {
                            interval: 850
                        }
                    });
                }

            }
        }
    });
    return false;
}

function toggleNotesFlagging(subtype) {
    /***************************************************************************
     * Allows users to enable/disable flag shown in Workflow Manager UI to bring
     * attention to existing notes for the entry.
     *
     *****************************************************************************/
    var subTypeRqstd = subtype || "";
    var paramName = subTypeRqstd.length > 1 ? "activate_notes_flagging_" + subTypeRqstd : "activate_notes_flagging";
    var paramValue = subTypeRqstd.length > 1 ? MsgingMod.sNotesFlagActiveBmrb : MsgingMod.sNotesFlagActive;

    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.TOGGLE_NOTES_FLAGGING,
        async: true,
        clearForm: false,
        beforeSubmit: function(formData, jqForm, options) {
            formData.push({
                "name": paramName,
                "value": paramValue
            });
            if (subTypeRqstd) {
                formData.push({
                    "name": "subtype",
                    "value": "bmrb"
                });
            }
        },
        success: function(jsonData) {
            checkGlobalMsgStatus();
        }
    });
    return false;
}

function getFilesReferenced() {
    /***
     * Retrieve list of files referenced by any messages for this dataset ID
     * so that we can link to these files as necessary when reviewing sent messages from this UI
     */
    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.GET_FILES_RFRNCD,
        async: true,
        clearForm: false,
        success: function(jsonData) {
            if (jsonData) {
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

function confirmAvailFiles(callbackFn) {
    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.CHECK_AVAIL_FILES,
        async: true,
        clearForm: false,
        success: function(jsonData) {
            if (jsonData) {
                MsgingMod.arrAvailFiles = jsonData.file_list;
                //alert('MsgingMod.arrAvailFiles is: '+MsgingMod.arrAvailFiles);
                //alert('MsgingMod.arrAvailFiles[0] is: '+MsgingMod.arrAvailFiles[0]);
            }
            if (typeof callbackFn === "function") {
                callbackFn();
            }
        }
    });
    return false;
}

function autoLoadMsgs() {
    MsgingMod.sCrrntDataSetID = MsgingMod.sDepId;
    //MsgingMod.sUseServerSidePrcssing = "true";
    MsgingMod.sUseThreaded = "false";
    MsgingMod.bAllowSorting = true;
    $('#depdatasetid').show().html("Deposition Dataset ID: " + MsgingMod.sDepId);
    // below we reset count for # times DataTables fnDrawCallBack was called
    MsgingMod.iCnt_DrawBackCalledOnCurrentTbl = 0;
    loadMsgsDT('Y');
}

function Message() {
    this.message_subject;
    this.message_id;
    this.ordinal_id;
    this.message_text;
    this.sender;
    this.timestamp;
    this.parent_message_id;

    this.loadFromJson = function(json) {
        this.message_subject = json.message_subject;
        this.message_id = json.message_id;
        this.message_text = json.message_text;
        this.sender = json.sender;
        this.timestamp = json.timestamp;
        this.parent_message_id = json.parent_message_id;
    };

    this.loadFromDTrow = function(thisRow) {
        var nTds = $('td', thisRow);

        var iPos = MsgingMod.oDataTable.fnGetPosition(thisRow); // getting position of the clicked row

        // below we use DataTables API function, fnGetData(iPos) to access contents for both visible and hidden fields by javascript property name
        // e.g. for message body we get the value of the (invisible) column by referencing the property name of "message_text",
        this.message_subject = MsgingMod.oDataTable.fnGetData(iPos).message_subject;
        this.sender = MsgingMod.oDataTable.fnGetData(iPos).sender;
        this.timestamp = MsgingMod.oDataTable.fnGetData(iPos).timestamp;
        this.message_text = MsgingMod.oDataTable.fnGetData(iPos).message_text;
        this.message_id = MsgingMod.oDataTable.fnGetData(iPos).message_id;
        this.ordinal_id = MsgingMod.oDataTable.fnGetData(iPos).ordinal_id;
        this.parent_message_id = MsgingMod.oDataTable.fnGetData(iPos).parent_message_id;
    };

}

var calcDataTableHeight = function() {
    var bottomPaddingForDT = (MsgingMod.sCrrntContentType == "commhstry") ? MsgingMod.iBottomDTpaddingHt_CommHstry : MsgingMod.iBottomDTpaddingHt_Msgs;
    var h = Math.floor($("#rslts_resize_container").height());
    return (h - bottomPaddingForDT) + 'px';
};

function reLoadMsgs() {
    var sendStatus = (MsgingMod.sViewContext == "sentmsgs") ? "Y" : "N";
    loadMsgsDT(sendStatus);
}

function loadMsgsDT(sendStatusToUse) {
    /**
     * sendStatusToUse: indicates whether currently viewing successfully sent messages (value is "Y") or drafts (value is "N")
     *
     * = populates session/view variables (content type, view context )
     * = invokes ajax submission of hlprfrm to obtain from the server the:
     * 		= DataTables starter html (which specifies number of columns and header titles in header row)
     * 		= config data dictionary
     * = initializes DataTable
     * = adjusts display of controls
     **/

    if (sendStatusToUse == 'Y') {
        MsgingMod.sViewContext = "sentmsgs";
        $('#tag_msg_choice').removeClass('ui-state-disabled');
    } else {
        MsgingMod.sViewContext = "drafts";
        $('#tag_msg_choice').addClass('ui-state-disabled'); // if viewing drafts, then disallow ability to tag message as "unread", "action required", "for release"
    }
    var sContentType;
    if (MsgingMod.sCrrntContentType == "notes") {
        sContentType = MsgingMod.sCrrntContentType;
        $('#tag_msg_choice').addClass('ui-state-disabled');
    } else if (MsgingMod.sCrrntContentType == "msgs") {
        sContentType = "messages";
    }

    $('#hlprfrm_content_type').val(MsgingMod.sCrrntContentType); //propagate content type to hlprfrm field

    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.DTBL_GET_TMPLT,
        async: true,
        clearForm: false,
        dataType: 'json',
        beforeSubmit: function(formData, jqForm, options) {
            formData.push({
                "name": "serverside",
                "value": MsgingMod.sUseServerSidePrcssing
            });
            formData.push({
                "name": "usethreaded",
                "value": MsgingMod.sUseThreaded
            });
            formData.push({
                "name": "send_status",
                "value": sendStatusToUse
            });
        },
        success: function(jsonData) {
            // $('.rslts.'+depDataSetID).html(jsonData.html);
            MsgingMod.sCrrntDataSetID = MsgingMod.sDepId;
            $('#rslts').html(jsonData.html);
            // $('#'+MsgingMod.sCrrntDataSetID+'_delete_row').hide();
            // $('.help.unselect').hide();
            // $('.help.select_to_delete').show();

            if (jsonData.dtbl_config_dict) {

                if (typeof(jsonData.dtbl_config_dict['CURRENT_NUM_MSGS_TO_DPSTR']) != "undefined" && jsonData.dtbl_config_dict['CURRENT_NUM_MSGS_TO_DPSTR'] != null) {
                    MsgingMod.iCrrntMsgsHwm = jsonData.dtbl_config_dict['CURRENT_NUM_MSGS_TO_DPSTR'];
                }
                if (typeof(jsonData.dtbl_config_dict['CURRENT_NUM_NOTES']) != "undefined" && jsonData.dtbl_config_dict['CURRENT_NUM_NOTES'] != null) {
                    MsgingMod.iCrrntNotesHwm = jsonData.dtbl_config_dict['CURRENT_NUM_NOTES'];
                }
                if (typeof(jsonData.dtbl_config_dict['MSGS_ALREADY_READ']) != "undefined" && jsonData.dtbl_config_dict['MSGS_ALREADY_READ'] != null) {
                    MsgingMod.arrMsgsAlreadyRead = jsonData.dtbl_config_dict['MSGS_ALREADY_READ'];
                }
                if (typeof(jsonData.dtbl_config_dict['MSGS_FOR_RELEASE']) != "undefined" && jsonData.dtbl_config_dict['MSGS_FOR_RELEASE'] != null) {
                    MsgingMod.arrMsgsForRelease = jsonData.dtbl_config_dict['MSGS_FOR_RELEASE'];
                }
                if (typeof(jsonData.dtbl_config_dict['MSGS_NO_ACTION_REQD']) != "undefined" && jsonData.dtbl_config_dict['MSGS_NO_ACTION_REQD'] != null) {
                    MsgingMod.arrMsgsNoActionReqd = jsonData.dtbl_config_dict['MSGS_NO_ACTION_REQD'];
                }
                if (typeof(jsonData.dtbl_config_dict['ORDERED_COLUMN_LIST']) != "undefined" && jsonData.dtbl_config_dict['ORDERED_COLUMN_LIST'] != null) {
                    MsgingMod.arrOrderedColumnList = jsonData.dtbl_config_dict['ORDERED_COLUMN_LIST'];
                }

                /***
                alert("CURRENT_NUM_MSGS_TO_DPSTR is: "+jsonData.dtbl_config_dict['CURRENT_NUM_MSGS_TO_DPSTR']);
                alert("MsgingMod.iCrrntMsgsHwm is: "+MsgingMod.iCrrntMsgsHwm);

                alert("CURRENT_NUM_NOTES is: "+jsonData.dtbl_config_dict['CURRENT_NUM_NOTES']);
                alert("MsgingMod.iCrrntNotesHwm is: "+MsgingMod.iCrrntNotesHwm);

                alert("$('#notes_high_watermark').val() is: "+$('#notes_high_watermark').val() );
                ***/

                var oTable = $('#' + MsgingMod.sDepId + '_tbl').dataTable({
                    // "sDom": 'Rlfrtip',
                    "sDom": 'R<"depdatasetlabel fltlft"><"fltrgt"f>tlip',
                    "oLanguage": {
                        "sSearch": "Search " + sContentType + ":",
                        "sEmptyTable": "No messages to display"
                    },
                    "bProcessing": false,
                    "bServerSide": eval(MsgingMod.sUseServerSidePrcssing),
                    "sAjaxSource": MsgingMod.URL.DTBL_AJAX_LOAD,
                    "fnServerParams": function(aoData) {
                        /**
                        var useThreaded = "false";
                        var sortColIdx = undefined;
                        var sortDir = undefined;
                        $.each(aoData, function(key, val){
                            if( val.name == "iSortCol_0" ){
                            	sortColIdx = val.value;
                            }
                            if( val.name == "sSortDir_0" ){
                            	sortDir = val.value;
                            }
                        });
                        if( sortColIdx == "3" && sortDir == "asc" && MsgingMod.sCrrntContentType == "msgs" ){
                        	useThreaded = "true";
                        }**/
                        aoData.push({
                            "name": "identifier",
                            "value": MsgingMod.sDepId
                        });
                        aoData.push({
                            "name": "sessionid",
                            "value": MsgingMod.sSessionId
                        });
                        aoData.push({
                            "name": "filesource",
                            "value": MsgingMod.sFileSource
                        });
                        aoData.push({
                            "name": "serverside",
                            "value": MsgingMod.sUseServerSidePrcssing
                        });
                        aoData.push({
                            "name": "usethreaded",
                            "value": MsgingMod.sUseThreaded
                        });
                        aoData.push({
                            "name": "send_status",
                            "value": sendStatusToUse
                        });
                        aoData.push({
                            "name": "content_type",
                            "value": MsgingMod.sCrrntContentType
                        });


                    },
                    // "sScrollX": "100%",
                    // "sScrollXInner": "50%",
                    "bScrollCollapse": true, //this was found necessary to allow resizable DT within resizable #rslts
                    //"iDisplayLength": 10,
                    "bPaginate": false,
                    //"sScrollY": calcDataTableHeight(),
                    "sScrollY": MsgingMod.iScrollY_Msgs + "px",

                    /** ///////////////////////////////////////////////////////////////////////////////
                    "bPaginate": true,
					"sPaginationType": "full_numbers",
        			"bLengthChange": true,
        			"lengthMenu": [ [5, 10, 15, 20, 25, 50, -1], [5, 10, 15, 20, 25, 50, "All"] ],
        			/////////////////////////////////////////////////////////////////////////////////   **/

                    "bFilter": true,
                    "bSortCellsTop": MsgingMod.bAllowSorting,
                    //"bSortCellsTop": true,
                    "bSort": MsgingMod.bAllowSorting,
                    "bInfo": true,
                    "bAutoWidth": true,
                    "fnInitComplete": function(oSettings, json) {
                        //$("#rslts_resize_container").height(MsgingMod.iRsltsResizeContainerInitHt_Msgs);
                        $("#rslts_resize_container").height($('#rslts #' + MsgingMod.sDepId + '_tbl_wrapper .dataTables_scroll .dataTables_scrollBody').height() + 110);

                        var contentTypeHeader = (MsgingMod.sCrrntContentType == "notes") ? "Annotator Processing Notes" : "Communications with Depositor";
                        $('.depdatasetlabel').html("<h4>" + MsgingMod.sDisplayId + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + contentTypeHeader + "</h4>");

                        if (MsgingMod.sCrrntContentType == "notes") {
                            $('h2, h3, h4').css("color", MsgingMod.STYLE.COLOR_NOTES);
                        } else {
                            $('h2, h3, h4').css("color", MsgingMod.STYLE.COLOR_MSGS);
                        }
                        $('tr.srch_hdrs').hide();

                        var defaultRow = $('#rslts #' + MsgingMod.sDepId + '_tbl.dataTable tbody tr#row_0.dt_row')[0];

                        if (typeof(defaultRow) != "undefined") {
                            markRowAsSelected(defaultRow, false);
                            if (MsgingMod.bMsgPanelShown == true) {
                                previewMsg(defaultRow);
                            }
                        } else {
                            MsgingMod.sCrrntRowSlctd = "";
                            if (MsgingMod.bMsgPanelShown == true) {
                                $("#collapse_msg_preview").collapse('hide');
                            }
                        }
                    },
                    "fnDrawCallback": function() {
                        MsgingMod.iCnt_DrawBackCalledOnCurrentTbl += 1;
                        //alert("In fnDrawCallback and MsgingMod.iCnt_DrawBackCalledOnCurrentTbl is now: "+MsgingMod.iCnt_DrawBackCalledOnCurrentTbl);

                        if (MsgingMod.iDTscrollTopSaved > 0) {
                            $('#rslts #' + MsgingMod.sDepId + '_tbl_wrapper .dataTables_scroll .dataTables_scrollBody').scrollTop(MsgingMod.iDTscrollTopSaved);
                        }

                        if (MsgingMod.sCrrntRowSlctd.length > 0) {

                            var selectedRow = $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + MsgingMod.sCrrntRowSlctd)[0];

                            if (typeof(selectedRow) != "undefined") {
                                markRowAsSelected(selectedRow, false);
                                var iPos = MsgingMod.oDataTable.fnGetPosition(selectedRow);
                                var sMsgId = MsgingMod.oDataTable.fnGetData(iPos).message_id;
                                var bWasRead = false;
                                var bForRelease = false;
                                var bNoActionReqd = false;

                                for (var idx = 0; idx < MsgingMod.arrMsgsAlreadyRead.length; idx++) {

                                    if (sMsgId == MsgingMod.arrMsgsAlreadyRead[idx]) {
                                        $(selectedRow).addClass('msg_read'); // this works when msg_id col is visible
                                        bWasRead = true;
                                        break;
                                    }

                                }
                                if (!bWasRead) {
                                    $(selectedRow).removeClass('msg_read');
                                }

                                if (MsgingMod.sCrrntContentType == 'msgs') {
                                    for (var idx = 0; idx < MsgingMod.arrMsgsNoActionReqd.length; idx++) {

                                        if (sMsgId == MsgingMod.arrMsgsNoActionReqd[idx]) {
                                            $(selectedRow).addClass('no_action_reqd'); // this works when msg_id col is visible
                                            $(selectedRow).removeClass('action_reqd');
                                            $(selectedRow).find("td:first").css("background", "none");
                                            bNoActionReqd = true;
                                            break;
                                        }

                                    }
                                    if (!bNoActionReqd) {
                                        $(selectedRow).removeClass('no_action_reqd');
                                        $(selectedRow).addClass('action_reqd');
                                        $(selectedRow).find("td:first").css("background", "url('/msgmodule/images/stock_todo.png') no-repeat center left");
                                    }

                                    for (var idx = 0; idx < MsgingMod.arrMsgsForRelease.length; idx++) {

                                        if (sMsgId == MsgingMod.arrMsgsForRelease[idx]) {
                                            $(selectedRow).addClass('for_release'); // this works when msg_id col is visible
                                            $(selectedRow).find("td:first").css("background", "url('/msgmodule/images/release.png') no-repeat center left");
                                            bForRelease = true;
                                            break;
                                        }

                                    }
                                    if (!bForRelease) {
                                        $(selectedRow).removeClass('for_release');
                                        if (bNoActionReqd) {
                                            $(selectedRow).find("td:first").css("background", "none");
                                        }
                                    }
                                }
                            }
                        }
                        $("#rslts_resize_container").resizable({
                            handles: "s",
                            minHeight: MsgingMod.iScrollY_Msgs
                        });
                        $("#rslts_resize_container").resize(function() {
                            var oSettings = MsgingMod.oDataTable.fnSettings();
                            oSettings.oScroll.sY = calcDataTableHeight();
                        });

                    },
                    "aoColumns": jsonData.dtbl_config_dict['DTBL_AOCOLUMNS'],
                    "aaSorting": [
                        [convertColNameToIntIndex('timestamp'), "desc"]
                    ],
                    "aoColumnDefs": [
                        /***
                        {
                            "aTargets": [10], //msg_id column
                            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {

                        	        if ( sData == "f9dd9711-cf7d-4846-832d-8e65e009ff78" ) {
                        	        	//alert(sData);
                        	        	var prntId = $(nTd).parent().attr('id');
                        	        	var prntHtml = $(nTd).parent().html();
                        	        	var html = $(nTd).html();
                        	        	//alert("id: "+id);
                        	        	//alert("prntHtml: "+prntHtml);
                        	        	//alert("html: "+html);
                        	        	$(nTd).parent().addClass('msg_read'); //this works when msg_id col is visible, NOT when hidden though
                        	        	//$("#row_"+iRow).addClass('msg_read');
                        	        }
                            }
                        },
                        ***/
                        {
                            "aTargets": [convertColNameToIntIndex('ordinal_id'),
                                convertColNameToIntIndex('message_id'),
                                convertColNameToIntIndex('deposition_data_set_id'),
                                convertColNameToIntIndex('context_type'),
                                convertColNameToIntIndex('context_value'),
                                convertColNameToIntIndex('parent_message_id'),
                                convertColNameToIntIndex('message_text'),
                                convertColNameToIntIndex('message_type'),
                                convertColNameToIntIndex('send_status')
                            ],
                            "bVisible": false
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('message_subject')],
                            "sWidth": "62%",
                            "fnCreatedCell": function(nTd, sData, oData, iRow, iCol) {
                                var $nTd = $(nTd);
                                var bActionReqd = true;

                                if (jsonData.dtbl_config_dict['INDENT_DICT']) {
                                    $nTd.addClass('indent_' + (jsonData.dtbl_config_dict['INDENT_DICT'][oData.message_id]));
                                } else {
                                    if (MsgingMod.sCrrntContentType == "msgs" && MsgingMod.sViewContext == 'sentmsgs') {
                                        $nTd.addClass('indent_0');
                                    }
                                }
                                for (var idx = 0; idx < jsonData.dtbl_config_dict['MSGS_ALREADY_READ'].length; idx++) {

                                    if (oData.message_id == jsonData.dtbl_config_dict['MSGS_ALREADY_READ'][idx]) {
                                        $nTd.parent().addClass('msg_read'); // this works when msg_id col is visible
                                    }

                                }

                                if (MsgingMod.sCrrntContentType == 'msgs') {

                                    $nTd.parent().addClass('action_reqd'); // this works when msg_id col is visible
                                    $nTd.css("background", "url('/msgmodule/images/stock_todo.png') no-repeat center left");


                                    for (var idx = 0; idx < jsonData.dtbl_config_dict['MSGS_NO_ACTION_REQD'].length; idx++) {
                                        if (oData.message_id == jsonData.dtbl_config_dict['MSGS_NO_ACTION_REQD'][idx]) {
                                            $nTd.parent().addClass('no_action_reqd'); // this works when msg_id col is visible
                                            $nTd.parent().removeClass('action_reqd'); // this works when msg_id col is visible
                                            bActionReqd = false;
                                            $nTd.css("background", "none");
                                            break;
                                        }
                                    }
                                    for (var idx = 0; idx < MsgingMod.arrMsgsNoActionReqd.length; idx++) {
                                        if (oData.message_id == MsgingMod.arrMsgsNoActionReqd[idx]) {
                                            $nTd.parent().addClass('no_action_reqd'); // this works when msg_id col is visible
                                            $nTd.parent().removeClass('action_reqd'); // this works when msg_id col is visible
                                            bActionReqd = false;
                                            $nTd.css("background", "none");
                                            break;
                                        }
                                    }
                                }

                                $nTd.parent().removeClass('for_release');
                                if (!bActionReqd)
                                    $nTd.css("background", "none");
                                for (var idx = 0; idx < jsonData.dtbl_config_dict['MSGS_FOR_RELEASE'].length; idx++) {

                                    if (oData.message_id == jsonData.dtbl_config_dict['MSGS_FOR_RELEASE'][idx]) {
                                        $nTd.parent().addClass('for_release'); // this works when msg_id col is visible
                                        $nTd.css("background", "url('/msgmodule/images/release.png') no-repeat center left");
                                        break;
                                    }

                                }

                            }
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('sender')],
                            "sWidth": "28%",
                            "fnCreatedCell": function(nTd, sData, oData, iRow, iCol) {
                                var $nTd = $(nTd);
                                if (!(sData.startsWith('depositor'))) {
                                    $nTd.parent().addClass('frm_annotator');
                                    //$nTd.parent().removeClass('action_reqd');
                                    //$nTd.parent().addClass('no_action_reqd');
                                }
                                //$nTd.css("background-image", "none");
                            }
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('timestamp')],
                            "sWidth": "10%"
                        }
                    ],

                    "oColReorder": {
                        //this ordering makes use of col index values that reflect absolute position of fields in backend
                        //i.e. prior to any hiding of columns by DataTables and so includes all col indices present in original dataset
                        //so that we can use indices that reflect original names, positions in the ordered column list retrieved from the server

                        "aiOrder": [convertColNameToIntIndex('message_subject'),
                            convertColNameToIntIndex('sender'),
                            convertColNameToIntIndex('timestamp'),
                            convertColNameToIntIndex('ordinal_id'),
                            convertColNameToIntIndex('message_id'),
                            convertColNameToIntIndex('deposition_data_set_id'),
                            convertColNameToIntIndex('context_type'),
                            convertColNameToIntIndex('context_value'),
                            convertColNameToIntIndex('parent_message_id'),
                            convertColNameToIntIndex('message_text'),
                            convertColNameToIntIndex('message_type'),
                            convertColNameToIntIndex('send_status')
                        ]

                        // absolute order of fields from backend is:
                        // ['ordinal_id', 'message_id', 'deposition_data_set_id', 'timestamp', 'sender', 'context_type', 'context_value', 'parent_message_id', 'message_subject', 'message_text', 'message_type', 'send_status']
                    }
                });
                MsgingMod.oDataTable = oTable;
            }
            if (MsgingMod.sCrrntContentType == "notes") {
                $('.notes_view_only').show();
                $('#get_content_type_notes').parent().addClass("active");

                $('.msg_view_only').hide();
            } else {
                $('.msg_view_only').show();
                $('.notes_view_only').hide();

                if (MsgingMod.sViewContext == 'sentmsgs') {
                    $('#threaded_view_toggle').show();
                    $('#get_content_type_msgs').parent().addClass("active");
                } else {
                    $('#threaded_view_toggle').hide();
                    $('#get_draft_msgs').parent().addClass("active");
                }
            }
            $('#archive_display').show();

        }
    });
    return false;

}


function loadCommHstryDT() {
    /**
     * = populates session/view variables (content type, view context )
     * = invokes ajax submission of hlprfrm to obtain from the server the:
     * 		= DataTables starter html (which specifies number of columns and header titles in header row)
     * 		= config data dictionary
     * = initializes DataTable
     * = adjusts display of controls
     **/
    MsgingMod.sViewContext = "sentmsgs";

    $('#hlprfrm_content_type').val(MsgingMod.sCrrntContentType);

    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.DTBL_GET_TMPLT,
        async: true,
        clearForm: false,
        dataType: 'json',
        beforeSubmit: function(formData, jqForm, options) {
            formData.push({
                "name": "serverside",
                "value": MsgingMod.sUseServerSidePrcssing
            });
            formData.push({
                "name": "usethreaded",
                "value": MsgingMod.sUseThreaded
            });
            formData.push({
                "name": "send_status",
                "value": "Y"
            });
        },
        success: function(jsonData) {
            MsgingMod.sCrrntDataSetID = MsgingMod.sDepId;
            $('#rslts').html(jsonData.html);
            // $('#'+MsgingMod.sCrrntDataSetID+'_delete_row').hide();
            // $('.help.unselect').hide();
            // $('.help.select_to_delete').show();

            if (jsonData.dtbl_config_dict) {

                if (typeof(jsonData.dtbl_config_dict['MSGS_ALREADY_READ']) != "undefined" && jsonData.dtbl_config_dict['MSGS_ALREADY_READ'] != null) {
                    MsgingMod.arrMsgsAlreadyRead = jsonData.dtbl_config_dict['MSGS_ALREADY_READ'];
                }

                if (typeof(jsonData.dtbl_config_dict['ORDERED_COLUMN_LIST']) != "undefined" && jsonData.dtbl_config_dict['ORDERED_COLUMN_LIST'] != null) {
                    MsgingMod.arrOrderedColumnList = jsonData.dtbl_config_dict['ORDERED_COLUMN_LIST'];

                    MsgingMod.arrColDisplOrderCorrHx = [convertColNameToIntIndex('message_subject'),
                        convertColNameToIntIndex('sender'),
                        convertColNameToIntIndex('timestamp'),
                        convertColNameToIntIndex('orig_sender'),
                        convertColNameToIntIndex('orig_timestamp'),
                        convertColNameToIntIndex('orig_recipient'),
                        convertColNameToIntIndex('orig_message_subject'),
                        convertColNameToIntIndex('orig_attachments'),
                        convertColNameToIntIndex('ordinal_id'),
                        convertColNameToIntIndex('message_id'),
                        convertColNameToIntIndex('deposition_data_set_id'),
                        convertColNameToIntIndex('context_type'),
                        convertColNameToIntIndex('context_value'),
                        convertColNameToIntIndex('parent_message_id'),
                        convertColNameToIntIndex('message_text'),
                        convertColNameToIntIndex('message_type'),
                        convertColNameToIntIndex('send_status'),
                        convertColNameToIntIndex('orig_message_id'),
                        convertColNameToIntIndex('orig_deposition_data_set_id')
                    ];
                }

                // mColumns is a list of column indices that will be passed to "tableTools" plugin API to
                // indicate those columns to be included in exports to Excel or in copy and paste operations.
                // The numerical indices in the list reflect the order of columns as they are displayed to the user on the webpage
                // and so the indices are consistent with the order of columns specified in MsgingMod.arrColDisplOrderCorrHx aboves
                var mColumns = [0, 1, 2, 3, 4, 5, 6, 7, 10];

                var oTable = $('#' + MsgingMod.sDepId + '_tbl').dataTable({
                    // "sDom": 'Rlfrtip',
                    // for sDom below, "R" indicates use of ColReorder extension
                    // "T" indicates use of tableTools extension
                    "sDom": 'R<"depdatasetlabel fltlft"><"fltrgt"f>tlip<"clearfloat">T',
                    "tableTools": {
                        "sSwfPath": "/msgmodule/swf/copy_csv_xls_pdf.swf",
                        "aButtons": [{
                                "sExtends": "xls",
                                "sButtonText": "Excel (tab delim file)",
                                "mColumns": mColumns
                            },
                            {
                                "sExtends": "copy",
                                "mColumns": mColumns
                            },
                            "print"
                        ]
                    },
                    "oLanguage": {
                        "sSearch": "Search Comm History:",
                        "sEmptyTable": "No messages to display"
                    },
                    "bSortCellsTop": true,
                    "bProcessing": false,
                    "bServerSide": eval(MsgingMod.sUseServerSidePrcssing),
                    "sAjaxSource": MsgingMod.URL.DTBL_AJAX_LOAD,
                    "fnServerParams": function(aoData) {
                        aoData.push({
                            "name": "identifier",
                            "value": MsgingMod.sDepId
                        });
                        aoData.push({
                            "name": "sessionid",
                            "value": MsgingMod.sSessionId
                        });
                        aoData.push({
                            "name": "filesource",
                            "value": MsgingMod.sFileSource
                        });
                        aoData.push({
                            "name": "serverside",
                            "value": MsgingMod.sUseServerSidePrcssing
                        });
                        aoData.push({
                            "name": "usethreaded",
                            "value": MsgingMod.sUseThreaded
                        });
                        aoData.push({
                            "name": "send_status",
                            "value": "Y"
                        });
                        aoData.push({
                            "name": "content_type",
                            "value": MsgingMod.sCrrntContentType
                        });

                    },
                    // "sScrollX": "100%",
                    // "sScrollXInner": "50%",

                    "bScrollCollapse": true, //this was found necessary to allow resizable DT within resizable #rslts
                    //"iDisplayLength": 10,
                    "bPaginate": false,
                    "sScrollY": MsgingMod.iScrollY_CommHstry + "px",

                    /***
            		"bPaginate": true,
					"sPaginationType": "full_numbers",
        			"lengthMenu": [ [5, 10, 15, 20, 25, 50, -1], [5, 10, 15, 20, 25, 50, "All"] ],
        			**/

                    "bFilter": true,
                    "bSort": eval(MsgingMod.bAllowSorting),
                    "bInfo": true,
                    "bAutoWidth": false,
                    "fnInitComplete": function(oSettings, json) {
                        //$("#rslts_resize_container").height(MsgingMod.iRsltsResizeContainerInitHt_CommHstry);
                        $("#rslts_resize_container").height($('#rslts #' + MsgingMod.sDepId + '_tbl_wrapper .dataTables_scroll .dataTables_scrollBody').height() + 220);

                        $(window).resize(function() {
                            MsgingMod.oDataTable.fnAdjustColumnSizing();
                        });

                        $('.depdatasetlabel').html("<h4>" + MsgingMod.sDepId + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Complete Correspondence History</h4>");

                        if (MsgingMod.sCrrntContentType == "commhstry") {
                            $('h2, h3, h4').css("color", MsgingMod.STYLE.COLOR_COMMHSTRY);
                        } else {
                            $('h2, h3, h4').css("color", MsgingMod.STYLE.COLOR_MSGS);
                        }

                        $('tr.srch_hdrs').show();
                        // !!!MUST MAKE THE FOLLOWING TWO CALLS IN THE GIVEN ORDER TO HAVE THE COLUMNS ALIGN/SPACE WITH THE SEARCH HEADERS PROPERLY
                        oTable.fnDraw();
                        oTable.fnAdjustColumnSizing();

                        var defaultRow = $('#rslts #' + MsgingMod.sDepId + '_tbl.dataTable tbody tr#row_0.dt_row')[0];

                        if (typeof(defaultRow) != "undefined") {
                            markRowAsSelected(defaultRow, false);
                            if (MsgingMod.bMsgPanelShown == true) {
                                previewMsg(defaultRow);
                            }
                        } else {
                            if (MsgingMod.bMsgPanelShown == true) {
                                $("#collapse_msg_preview").collapse('hide');
                            }
                        }
                    },
                    "aoColumns": jsonData.dtbl_config_dict['DTBL_AOCOLUMNS'],
                    "aaSorting": [
                        [convertColNameToIntIndex('timestamp'), "desc"]
                    ],
                    "aoColumnDefs": [{
                            "aTargets": [convertColNameToIntIndex('ordinal_id'),
                                convertColNameToIntIndex('message_id'),
                                convertColNameToIntIndex('deposition_data_set_id'),
                                convertColNameToIntIndex('context_type'),
                                convertColNameToIntIndex('context_value'),
                                convertColNameToIntIndex('parent_message_id'),
                                convertColNameToIntIndex('message_text'),
                                convertColNameToIntIndex('message_type'),
                                convertColNameToIntIndex('send_status'),
                                convertColNameToIntIndex('orig_message_id'),
                                convertColNameToIntIndex('orig_deposition_data_set_id')
                            ],
                            "bVisible": false
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('message_subject')], // subject field
                            "sWidth": "25%",
                            "fnCreatedCell": function(nTd, sData, oData, iRow, iCol) {
                                var $nTd = $(nTd);
                                var bActionReqd = true;
                                /***
                                if( iRow%2 != 0 ){
                                	$nTd.addClass('child_msg');
                                }

                                if( oData.parent_message_id != oData.message_id ){
                                	$nTd.addClass('child_msg');
                                }
                                ***/
                                $nTd.addClass('indent_0');

                                for (var idx = 0; idx < jsonData.dtbl_config_dict['MSGS_ALREADY_READ'].length; idx++) {

                                    if (oData.message_id == jsonData.dtbl_config_dict['MSGS_ALREADY_READ'][idx]) {
                                        $nTd.parent().addClass('msg_read'); // this works when msg_id col is visible
                                    }

                                }
                                // below done in cases where fnCreated cell being called without requerying server
                                for (var idx = 0; idx < MsgingMod.arrMsgsAlreadyRead.length; idx++) {

                                    if (oData.message_id == MsgingMod.arrMsgsAlreadyRead[idx]) {
                                        $nTd.parent().addClass('msg_read');
                                    }

                                }

                                $nTd.parent().addClass('action_reqd'); // this works when msg_id col is visible
                                $nTd.css("background", "url('/msgmodule/images/stock_todo.png') no-repeat center left");


                                for (var idx = 0; idx < jsonData.dtbl_config_dict['MSGS_NO_ACTION_REQD'].length; idx++) {
                                    if (oData.message_id == jsonData.dtbl_config_dict['MSGS_NO_ACTION_REQD'][idx]) {
                                        $nTd.parent().addClass('no_action_reqd'); // this works when msg_id col is visible
                                        $nTd.parent().removeClass('action_reqd'); // this works when msg_id col is visible
                                        bActionReqd = false;
                                        $nTd.css("background", "none");
                                        break;
                                    }
                                }

                                // also need to remove action_required flag for "notes" entries
                                for (var idx = 0; idx < jsonData.dtbl_config_dict['NOTES_MSG_IDS'].length; idx++) {

                                    if (oData.message_id == jsonData.dtbl_config_dict['NOTES_MSG_IDS'][idx]) {
                                        $nTd.parent().addClass('no_action_reqd'); // this works when msg_id col is visible
                                        $nTd.parent().removeClass('action_reqd'); // this works when msg_id col is visible
                                        bActionReqd = false;
                                        $nTd.css("background", "none");
                                        break;
                                    }

                                }


                                $nTd.parent().removeClass('for_release');
                                if (!bActionReqd)
                                    $nTd.css("background", "none");
                                for (var idx = 0; idx < jsonData.dtbl_config_dict['MSGS_FOR_RELEASE'].length; idx++) {

                                    if (oData.message_id == jsonData.dtbl_config_dict['MSGS_FOR_RELEASE'][idx]) {
                                        $nTd.parent().addClass('for_release'); // this works when msg_id col is visible
                                        $nTd.css("background", "url('/msgmodule/images/release.png') no-repeat center left");
                                        break;
                                    }

                                }

                            }
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('sender')],
                            "sWidth": "8%"
                            /***,
					                 		"fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
												var $nTd = $(nTd);
												if( sData != 'depositor' ){
													$nTd.parent().addClass('frm_annotator');
													//$nTd.parent().removeClass('action_reqd');
													//$nTd.parent().addClass('no_action_reqd');
												}
							        		}***/
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('timestamp')],
                            "sWidth": "10%"
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('orig_sender')],
                            "sWidth": "8%"
                            /***,
					                 		"fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
												var $nTd = $(nTd);
												if( sData != 'depositor' ){
													$nTd.parent().addClass('frm_annotator');
													//$nTd.parent().removeClass('action_reqd');
													//$nTd.parent().addClass('no_action_reqd');
												}
							        		}***/
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('orig_timestamp')],
                            "sWidth": "10%"
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('orig_recipient')],
                            "sWidth": "8%"
                            /***,
					                 		"fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
												var $nTd = $(nTd);
												if( sData != 'depositor' ){
													$nTd.parent().addClass('frm_annotator');
													//$nTd.parent().removeClass('action_reqd');
													//$nTd.parent().addClass('no_action_reqd');
												}
							        		}***/
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('orig_message_subject')],
                            "sWidth": "25%"
                        },
                        {
                            "aTargets": [convertColNameToIntIndex('orig_attachments')],
                            "sWidth": "5%"
                        }
                    ],
                    "fnDrawCallback": function() {
                        MsgingMod.iCnt_DrawBackCalledOnCurrentTbl += 1;
                        //alert("In fnDrawCallback and MsgingMod.iCnt_DrawBackCalledOnCurrentTbl is now: "+MsgingMod.iCnt_DrawBackCalledOnCurrentTbl);

                        applySearchHeaderFunctions(oTable);

                        if (MsgingMod.iDTscrollTopSaved > 0) {
                            $('#rslts #' + MsgingMod.sDepId + '_tbl_wrapper .dataTables_scroll .dataTables_scrollBody').scrollTop(MsgingMod.iDTscrollTopSaved);
                        }

                        if (MsgingMod.sCrrntRowSlctd.length > 0) {

                            var selectedRow = $('#rslts #' + MsgingMod.sCrrntDataSetID + '_tbl #' + MsgingMod.sCrrntRowSlctd)[0];

                            if (typeof(selectedRow) != "undefined") {
                                markRowAsSelected(selectedRow, false);
                                var iPos = MsgingMod.oDataTable.fnGetPosition(selectedRow);
                                var sMsgId = MsgingMod.oDataTable.fnGetData(iPos).message_id;
                                var bWasRead = false;
                                var bForRelease = false;
                                var bNoActionReqd = false;

                                for (var idx = 0; idx < MsgingMod.arrMsgsAlreadyRead.length; idx++) {

                                    if (sMsgId == MsgingMod.arrMsgsAlreadyRead[idx]) {
                                        $(selectedRow).addClass('msg_read'); // this works when msg_id col is visible
                                        bWasRead = true;
                                        break;
                                    }

                                }
                                if (!bWasRead) {
                                    $(selectedRow).removeClass('msg_read');
                                }

                            }
                        }
                        $("#rslts_resize_container").resizable({
                            handles: "s",
                            minHeight: MsgingMod.iScrollY_CommHstry + 125,
                        });
                        $("#rslts_resize_container").resize(function() {
                            var oSettings = MsgingMod.oDataTable.fnSettings();
                            oSettings.oScroll.sY = calcDataTableHeight();

                            MsgingMod.oDataTable.fnAdjustColumnSizing();

                            //MsgingMod.oDataTable.fnDraw();
                        });

                    },
                    "oColReorder": {
                        //this ordering makes use of col index values that reflect absolute position of fields in backend
                        //i.e. prior to any hiding of columns by DataTables and so includes all col indices present in original dataset
                        //so that we can use indices that reflect original names, positions in the ordered column list retrieved from the server

                        "aiOrder": MsgingMod.arrColDisplOrderCorrHx

                        // absolute order of fields from backend is:
                        // ['ordinal_id', 'message_id', 'deposition_data_set_id', 'timestamp', 'sender', 'context_type', 'context_value', 'parent_message_id', 'message_subject', 'message_text', 'message_type', 'send_status','orig_message_id','orig_deposition_data_set_id','orig_timestamp','orig_sender','orig_recipient','orig_message_subject','orig_attachments']]
                    }
                });
                MsgingMod.oDataTable = oTable;
            }
            $('#get_content_type_commhstry').parent().addClass("active");
            $('.notes_view_only').hide();
            $('.msg_view_only').hide();
            $('#archive_display').hide();
        }
    });
    return false;

}

function clearFileUpload(index) {
    //<input type='file' size='50' id="aux-file2" name="aux-file2" class="c_%(identifier)s file_upload fltlft"/>
    if (index == "all") {
        for (var iNum = 1; iNum < 4; iNum++) {
            $("#aux-file" + iNum).replaceWith('<input type="file" size="50" id="aux-file' + iNum + '" name="aux-file' + iNum + '" class="c_' + MsgingMod.sDepId + ' file_upload fltlft"/>');
        }
    } else {
        $("#aux-file" + index).replaceWith('<input type="file" size="50" id="aux-file' + index + '" name="aux-file' + index + '" class="c_' + MsgingMod.sDepId + ' file_upload fltlft"/>');
    }
}


function resetTextArea(tmpltStyle) {

    $("#msg_compose_body").replaceWith($("#msg_compose_body_tmplt_" + tmpltStyle).clone().attr('id', 'msg_compose_body').removeClass("displaynone"));
}

function composeMsg(msgSubject, parentMsgId, parentMsg, parentMsgSnder, parentMsgDateTime, tmpltStyle) {
    //DEBUG	alert( "tmpltStyle on start of composeMsg is: "+tmpltStyle);

    if (MsgingMod.sCrrntContentType == "notes") {
        $('#msg_compose_body').val("");
    } else { // current content type is "msgs"
        if (typeof(tmpltStyle) != "undefined") {
            resetTextArea(tmpltStyle);
        } else {
            $('#msg_compose_body').val("");
        }
    }

    MsgingMod.sCrrntCmpsMsgTmplt = tmpltStyle;

    if (parentMsgId && (typeof(parentMsgId) != "undefined")) {
        $('#msg_compose_parent_msg_id').val(parentMsgId);
    } else {
        $('#msg_compose_parent_msg_id').val("");
    }
    $('#msg_compose_subject').val("");

    var sStructEntry = MsgingMod.bEmMapOnly ? "Entry" : "Structure";
    var sVldtnFiles = MsgingMod.bEmMapOnly ? "Processed files" : "Validation report and processed files";
    var sReleasedIDs = MsgingMod.bEmEntry ? MsgingMod.sAccessionIdStringEmRel : MsgingMod.sAccessionIdString;

    if (msgSubject && (typeof(msgSubject) != "undefined")) {
        $('#msg_compose_subject').val(msgSubject);
    } else if (typeof(tmpltStyle) != "undefined" && tmpltStyle == 'vldtn') {
        $('#msg_compose_subject').val(MsgingMod.sAccessionIdString + ' - ' + sVldtnFiles + ' are ready for your review');
    } else if (typeof(tmpltStyle) != "undefined" && tmpltStyle == 'approval-expl') {
        $('#msg_compose_subject').val('Acknowledgement of ' + sStructEntry + ' Approval');
    } else if (typeof(tmpltStyle) != "undefined" && tmpltStyle == 'approval-impl') {
        $('#msg_compose_subject').val('Implicit Approval of Your ' + sStructEntry);
    } else if (typeof(tmpltStyle) != "undefined" && ['release-publ', 'release-nopubl'].indexOf(tmpltStyle) > -1) {
        $('#msg_compose_subject').val('Release of ' + sReleasedIDs);
    } else if (typeof(tmpltStyle) != "undefined" && tmpltStyle == 'reminder') {
        $('#msg_compose_subject').val('Still awaiting feedback for ' + MsgingMod.sAccessionIdString);
    } else if (typeof(tmpltStyle) != "undefined" && tmpltStyle == 'system-unlocked') {
        $('#msg_compose_subject').val('System Unlocked');
    } else if (typeof(tmpltStyle) != "undefined" && tmpltStyle == 'withdrawn') {
        $('#msg_compose_subject').val('PDB ID ' + MsgingMod.sPdbId + ' has been withdrawn');
    } else if (typeof(tmpltStyle) != "undefined" && tmpltStyle == 'maponly-authstatus-em') {
        $('#msg_compose_subject').val('Annotation of your ' + MsgingMod.sAccessionIdString);
    } else if (MsgingMod.sCrrntContentType != "notes") {
        $('#msg_compose_subject').val('Communication regarding ' + MsgingMod.sAccessionIdString);
    }

    if (parentMsg && (typeof(parentMsg) != "undefined")) {
        $('#msg_compose_parent_msg_div').removeClass("hidden");
        $('#msg_compose_parent_msg').html('<p><span class="strong">SENDER:</span> ' + parentMsgSnder + '</p><p><span class="strong">DATE/TIME:</span> ' + parentMsgDateTime + '</p><p>' + parentMsg + '</p>');
    } else {
        $('#msg_compose_parent_msg').html("");
        $('#msg_compose_parent_msg_div').addClass("hidden");
    }
    if (MsgingMod.sCrrntContentType == "notes") {
        $('#msg_compose_assoc_files').addClass("hidden");
        $('#msg_compose_attch_aux_file').addClass("hidden");
    } else {
        $('#msg_compose_assoc_files').removeClass("hidden");
        $('#msg_compose_attch_aux_file').removeClass("hidden");
    }

    //$('#msg_compose_dep_id').val(MsgingMod.sCrrntDataSetID);

    /**
    $("#msg_compose").dialog({
    	resize: function() {
    		$("#msg_compose_body").width($("#msg_compose").width() - 25);
    	}
    });
    **/



    $('#msg_compose_subject').focus();

    $('#msg_compose_body').scrollTop(0);
    clearFileUpload("all");
    $("#aux-file-span2").addClass("hidden");
    $("#aux-file-span3").addClass("hidden");

    /**
    if( AUTO_CHECK_ALL_FILE_REFS == 'y' ){
    	//alert("auto referencing all files");
    	$('#msg_compose_assoc_files').find('input[type=checkbox]').prop('checked', true);
    }
    **/
    // DEBUG alert( "tmpltStyle before launch of modal is: "+tmpltStyle);
    $('#msg_compose').on('shown.bs.modal', function(e) {
        if (typeof(tmpltStyle) != "undefined" && ['vldtn', 'release-publ', 'release-nopubl', 'maponly-authstatus-em'].indexOf(tmpltStyle) > -1) {
            $('#msg_compose_assoc_files').find('input[type=checkbox]:visible').prop('checked', true);
            //$('#msg_compose_assoc_files').find('input[type=checkbox]:visible:not(.nmr)').prop('checked', true);
        } else if (typeof(tmpltStyle) != "undefined" && ['withdrawn'].indexOf(tmpltStyle) > -1) {
            $('#checkbox_model').find('input[type=checkbox]:visible').prop('checked', true);
        } else {
            $('#msg_compose_assoc_files input:checkbox').prop('checked', false);
        }
        MsgingMod.iCmpsTotalFilesAvail = $('#msg_compose_assoc_files').find('.checkbox-inline input[type=checkbox]:visible').length;
    });

    if (MsgingMod.sCrrntContentType == "msgs") {
        confirmAvailFiles(function() {

            // Ordered list of items to display
            var mapping = [
                ["val-report", "PDF report"],
                ["val-report-full", "full PDF report"],
                //["Garbage", "Garbage"],
                ["val-data", "XML data"],
                ["val-report-slider", "slider"],
                ["val-report-wwpdb-fo-fc-edmap-coef", "fofc map coef"],
                ["val-report-wwpdb-2fo-fc-edmap-coef", "2fofc map coef"]
            ];


            var valrepfiles = [];
            for (var x = 0; x < mapping.length; x++) {
                key = mapping[x][0];
                val = mapping[x][1];
                for (var y = 0; y < MsgingMod.arrAvailFiles.length; y++) {
                    if (MsgingMod.arrAvailFiles[y] === key) {
                        valrepfiles.push(val)
                    }
                }

            }
            var valrepstring = valrepfiles.join(", ");
            if (valrepstring.length > 0) {
                $('#checkbox_val-report-batch-opttext').html(' (' + valrepstring + ')');
            }

            for (var x = 0; x < MsgingMod.arrAvailFiles.length; x++) {
                //$('#checkbox_'+MsgingMod.arrAvailFiles[x]).show();
                if (!(MsgingMod.bEmEntry && MsgingMod.bEmMapOnly && (MsgingMod.arrAvailFiles[x] === "model" || MsgingMod.arrAvailFiles[x] === "model_pdb"))) {
                    $('#checkbox_' + MsgingMod.arrAvailFiles[x]).removeClass("hidden");
                }

            }
            $("#msg_compose").modal("show");
        });
    } else {
        $("#msg_compose").modal("show");
    }

}

function displayDraftMsg(thisRow) {
    MsgingMod.bNewDraftContext = false;
    var oDraftMsg = new Message();
    oDraftMsg.loadFromDTrow(thisRow);
    var sMsgText = oDraftMsg.message_text.replace(/<br \/>/g, "\n");

    $('#msg_compose_msg_id').val(oDraftMsg.message_id);

    if (oDraftMsg.parent_message_id != oDraftMsg.message_id) {
        var opts = {
            context: "compose",
            msg_subject: oDraftMsg.message_subject,
            msg_text: sMsgText,
            callback: composeMsg
        };
        getMsgDict(oDraftMsg.parent_message_id, opts);
    } else {
        composeMsg(oDraftMsg.message_subject, undefined, undefined, undefined, undefined, undefined);
    }

    markMsgAsRead(oDraftMsg.message_id);
    $('#msg_compose_body').val(sMsgText);
}

function getFileReferences(sMsgId) {
    var arrFilesRfrncd = [];
    var returnObjList = [];

    for (var property in MsgingMod.oFilesRfrncd) {
        //alert("MsgingMod.oFilesRfrncd["+property+"] = "+MsgingMod.oFilesRfrncd[property]);

        if (property == sMsgId) {
            arrFilesRfrncd = MsgingMod.oFilesRfrncd[property];
            break;
        }
    }

    if (arrFilesRfrncd.length > 0) {
        for (var i = 0; i < arrFilesRfrncd.length; i++) {
            var fileRefObj = arrFilesRfrncd[i];
            var filePathSplitArr = fileRefObj.relative_file_url.split("/");
            var fileName = filePathSplitArr[filePathSplitArr.length - 1];
            fileRefObj.file_name = fileName;
            returnObjList.push(fileRefObj);
        }
    }
    return returnObjList;
}

function previewMsg(thisRow) {

    var oMsg = new Message();
    oMsg.loadFromDTrow(thisRow);

    if (oMsg.parent_message_id != oMsg.message_id) {
        var opts = {
            context: "display",
            display_type: "preview_pane"
        };
        getMsgDict(oMsg.parent_message_id, opts);
    } else {
        $('#preview_parent_msg').html("");
        $('#preview_parent_msg_div').hide();
    }

    if (MsgingMod.sViewContext == "drafts") {
        $(".preview_msg_action_btn").hide();
        $(".draft_view").show();
    } else {
        if (MsgingMod.sCrrntContentType != "commhstry") {
            if (MsgingMod.sCrrntContentType == "notes") {
                $(".preview_msg_action_btn.archive").show();
            } else {
                $(".preview_msg_action_btn").show();
            }
            $(".draft_view").hide();
        } else {
            $(".preview_msg_action_btn").hide();
        }
    }


    /**************************************************************************************************
     * BEGIN - PROVIDE LINKS TO ASSOC'D FILES
     * In this section we are determining whether a given message has associated file references
     * and if so we create links to copies of the associated files provided in the session directory
     **************************************************************************************************/
    var arrFileRefObjs = getFileReferences(oMsg.message_id);
    if (arrFileRefObjs.length > 0) {
        $('#files_rfrncd_div').show();
        var htmlStr = "";
        for (var i = 0; i < arrFileRefObjs.length; i++) {
            var fileRefObj = arrFileRefObjs[i];
            var displayUploadFlName = (fileRefObj.upload_file_name.length > 1) ? ' (' + fileRefObj.upload_file_name + ')' : "";
            htmlStr += '<p><span class=""><a href="' + fileRefObj.relative_file_url + '" target="_blank">' + fileRefObj.file_name + displayUploadFlName + '</a></span></p>';
        }
        $('#files_rfrncd').html(htmlStr);
        //$("#msg_body_display").dialog( "option", "height", MsgingMod.iMsgDisplHtWthParentContent );

    } else {
        $('#files_rfrncd').html("");
        $('#files_rfrncd_div').hide();
        //$("#msg_body_display").dialog( "option", "height", MsgingMod.iMsgDisplHtMin );
    }
    /**************************************************************************************************
     * END - PROVIDE LINKS TO ASSOC'D FILES
     **************************************************************************************************/

    $('#preview_msg_dep_id').html(MsgingMod.sCrrntDataSetID);
    $('#preview_msg_id').val(oMsg.message_id);
    $('#preview_msg_ordinal_id').html(oMsg.ordinal_id);
    $('#preview_msg_subject').html(oMsg.message_subject);
    $('#preview_msg_sender').html(oMsg.sender);
    $('#preview_msg_timestamp').html(oMsg.timestamp);
    $('#preview_msg_body').html(oMsg.message_text);

    $("#preview_msg").css({
        overflow: 'auto',
        height: '99%'
    });

    $("#resize_container").resizable({
        handles: "s",
        minHeight: 150
    });

    $('#preview_msg').scrollTop(0);

    MsgingMod.iDTscrollTopSaved = $('#rslts #' + MsgingMod.sDepId + '_tbl_wrapper .dataTables_scroll .dataTables_scrollBody').scrollTop();

    if (!(MsgingMod.bCorrspndncHstryStndaln)) {
        markMsgAsRead(oMsg.message_id);
        redrawTable();
    }

    $("#resize_container").css('height', $("#preview_msg_body").height() + 70);
}

function displayMsg(thisRow, bUseNewWindow) {
    var oMsg = new Message();
    oMsg.loadFromDTrow(thisRow);

    if (oMsg.parent_message_id != oMsg.message_id) {
        var opts = {
            context: "display",
            display_type: "dialog"
        };
        getMsgDict(oMsg.parent_message_id, opts);
    } else {
        $('#parent_msg').html("");
        $('#parent_msg_div').hide();
    }

    /**************************************************************************************************
     * BEGIN - PROVIDE LINKS TO ASSOC'D FILES
     * In this section we are determining whether a given message has associated file references
     * and if so we create links to copies of the associated files provided in the session directory
     **************************************************************************************************/
    var arrFileRefObjs = getFileReferences(oMsg.message_id);
    if (arrFileRefObjs.length > 0) {
        $('#files_rfrncd_div_dialog').show();
        var htmlStr = "";
        for (var i = 0; i < arrFileRefObjs.length; i++) {
            var fileRefObj = arrFileRefObjs[i];
            var displayUploadFlName = (fileRefObj.upload_file_name.length > 1) ? ' (' + fileRefObj.upload_file_name + ')' : "";
            htmlStr += '<p><span class=""><a href="' + fileRefObj.relative_file_url + '" target="_blank">' + fileRefObj.file_name + displayUploadFlName + '</a></span></p>';
        }
        $('#files_rfrncd_dialog').html(htmlStr);
        //$("#msg_body_display").dialog( "option", "height", MsgingMod.iMsgDisplHtWthParentContent );

    } else {
        $('#files_rfrncd_dialog').html("");
        $('#files_rfrncd_div_dialog').hide();
        //$("#msg_body_display").dialog( "option", "height", MsgingMod.iMsgDisplHtMin );
    }
    /**************************************************************************************************
     * END - PROVIDE LINKS TO ASSOC'D FILES
     **************************************************************************************************/

    $('#msg_dep_id').html(MsgingMod.sCrrntDataSetID);
    $('#msg_id').val(oMsg.message_id);
    $('#msg_ordinal_id').html(oMsg.ordinal_id);
    $('#msg_subject').html(oMsg.message_subject);
    $('#msg_sender').html(oMsg.sender);
    $('#msg_timestamp').html(oMsg.timestamp);
    $('#msg_body').html(oMsg.message_text);
    //if( MsgingMod.sCrrntDataSetID != "D_000000" && MsgingMod.sCrrntDataSetID != "D_8000200335" && MsgingMod.sCrrntDataSetID != "D_8000200292")
    //	$("#msg_body_display").dialog( "open" );

    if (!(MsgingMod.bCorrspndncHstryStndaln)) {
        markMsgAsRead(oMsg.message_id);
    }


    //if( MsgingMod.sCrrntDataSetID == "D_000000" || MsgingMod.sCrrntDataSetID == "D_8000200335" || MsgingMod.sCrrntDataSetID == "D_8000200292"){
    if (bUseNewWindow) {
        var newWndwWth = screen.width - 100;
        var newWndwHt = screen.height - 200;
        window.open(MsgingMod.URL.DISPLAY_MSG + '?annotator=' + MsgingMod.sAnnotator + '&msg_id=' + oMsg.message_id + '&sessionid=' + MsgingMod.sSessionId + '&identifier=' + MsgingMod.sCrrntDataSetID + '&filesource=' + MsgingMod.sFileSource + '&content_type=' + MsgingMod.sCrrntContentType, 'dsplyMsgWndw' + oMsg.message_id, "width=" + newWndwWth + ", height=" + newWndwHt + ", top=50, left=50, menubar=no, status=no, toolbar=no, titlebar=no, location=no, scrollbars=yes");
        //}
    } else {
        //$("#msg_body_display").dialog( "open" );
        $("#msg_body_display").modal('show');
    }



}

function getMsgDict(msgId, opts) {
    var oMsg = new Message();
    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.GET_MSG,
        async: true,
        clearForm: false,
        dataType: 'json',
        beforeSubmit: function(formData, jqForm, options) {
            formData.push({
                "name": "msg_id",
                "value": msgId
            });
        },
        success: function(jsonData) {

            if (jsonData.msg_dict) {
                //('#msg_subject').html(), $('#msg_id').val(), $('#msg_body').html(), $('#msg_sender').html(), $('#msg_timestamp').html() );
                /*************
                alert("Msg Subject is: "+jsonData.msg_dict['message_subject']);
                alert("Msg ID is: "+jsonData.msg_dict['message_id']);
                alert("Msg Body is: "+jsonData.msg_dict['message_text']);
                alert("Msg Sender is: "+jsonData.msg_dict['sender']);
                alert("Msg Timestamp is: "+jsonData.msg_dict['timestamp']);
                alert("parent_message_id is: "+jsonData.msg_dict['parent_message_id']);
                *****************/
                oMsg.loadFromJson(jsonData.msg_dict);

                if (typeof opts.context !== "undefined") {

                    if (opts.context === "compose") {

                        var sSubject = typeof opts.msg_prefix !== "undefined" ? opts.msg_prefix + oMsg.message_subject : (typeof opts.msg_subject !== "undefined" ? opts.msg_subject : "[SUBJECT PLACHEHOLDER]");
                        var sDraftMsgText = typeof opts.msg_text !== "undefined" ? opts.msg_text : "";
                        opts.callback(sSubject, oMsg.message_id, oMsg.message_text, oMsg.sender, oMsg.timestamp, undefined);

                        $('#msg_compose_body').val(sDraftMsgText);

                    } else if (opts.context === "propagate") {

                        var sPropagateType = typeof opts.propagate_type !== "undefined" ? opts.propagate_type : "error";
                        opts.callback(oMsg.message_subject, oMsg.message_id, oMsg.message_text, oMsg.sender, oMsg.timestamp, sPropagateType);

                    } else if (opts.context === "display") {

                        if (typeof opts.display_type !== "undefined") {

                            if (oMsg.message_text && (typeof(oMsg.message_text) != "undefined")) {

                                if (opts.display_type === "preview_pane") {

                                    $('#preview_parent_msg_div').show();
                                    $('#preview_parent_msg').html('<p><span class="strong">SENDER:</span> ' + oMsg.sender + '</p><p><span class="strong">DATE/TIME:</span> ' + oMsg.timestamp + '</p><p>' + oMsg.message_text + '</p>');

                                } else if (opts.display_type === "dialog") {

                                    $('#parent_msg_div').show();
                                    $('#parent_msg').html('<p><span class="strong">SENDER:</span> ' + oMsg.sender + '</p><p><span class="strong">DATE/TIME:</span> ' + oMsg.timestamp + '</p><p>' + oMsg.message_text + '</p>');

                                }
                            }

                        } //end if display_type !== undefined

                    } //end if context === display

                } //end if context !== undefined

            } //end if jsonData.msg_dict

        } //close success function
    });
    return false;
}

function markMsgAsRead(msgId) {

    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.MARK_MSG_READ,
        async: true,
        clearForm: false,
        beforeSubmit: function(formData, jqForm, options) {
            formData.push({
                "name": "msg_id",
                "value": msgId
            });
        },
        success: function() {
            MsgingMod.arrMsgsAlreadyRead.push(msgId);
            checkGlobalMsgStatus();
        }
    });
    return false;
}

function tagMsg(actionReqd, readStatus, forRelease) {
    // user tagging message as "action required" or "unread"
    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.TAG_MSG,
        async: true,
        clearForm: false,
        beforeSubmit: function(formData, jqForm, options) {
            formData.push({
                "name": "msg_id",
                "value": MsgingMod.sCrrntMsgIdSlctd
            });
            formData.push({
                "name": "action_reqd",
                "value": actionReqd
            });
            formData.push({
                "name": "read_status",
                "value": readStatus
            });
            formData.push({
                "name": "for_release",
                "value": forRelease
            });
        },
        success: function() {
            var releaseFindIdx = MsgingMod.arrMsgsForRelease.indexOf(MsgingMod.sCrrntMsgIdSlctd);
            var readFindIdx = MsgingMod.arrMsgsAlreadyRead.indexOf(MsgingMod.sCrrntMsgIdSlctd);
            var noActionFindIdx = MsgingMod.arrMsgsNoActionReqd.indexOf(MsgingMod.sCrrntMsgIdSlctd);

            if (actionReqd == 'N') {
                if (noActionFindIdx < 0) {
                    MsgingMod.arrMsgsNoActionReqd.push(MsgingMod.sCrrntMsgIdSlctd);
                }
            } else {
                if (noActionFindIdx > -1) {
                    MsgingMod.arrMsgsNoActionReqd.splice(noActionFindIdx, 1);
                }
            }


            if (forRelease == 'Y') {
                if (releaseFindIdx < 0) {
                    MsgingMod.arrMsgsForRelease.push(MsgingMod.sCrrntMsgIdSlctd);
                }
            } else {
                if (releaseFindIdx > -1) {
                    MsgingMod.arrMsgsForRelease.splice(releaseFindIdx, 1);
                }
            }

            if (readStatus == 'N') {
                if (readFindIdx > -1) {
                    MsgingMod.arrMsgsAlreadyRead.splice(readFindIdx, 1);
                }
            }

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
    /***
     * this function used for messages that are submitted via "Send" or "Save Draft" (i.e.as opposed to "Archive" (or future implementation of "Forward")
     **/
    var sUrl;
    // alert("sendStatusToUse: "+sendStatusToUse);
    if (MsgingMod.sViewContext == 'sentmsgs' || MsgingMod.bNewDraftContext == true) {
        sUrl = MsgingMod.URL.SUBMIT_MSG;
    } else {
        sUrl = MsgingMod.URL.UPDATE_DRAFT_STATE;
    }
    var hostname = document.location.hostname;
    //hostname being captured and sent to server so that server-side code can determine whether in production vs. staging vs. testing environments
    //DEBUG: alert(hostname);

    $('#msg_compose_frm').ajaxSubmit({
        url: sUrl,
        async: true,
        clearForm: false,
        beforeSubmit: function(formData, jqForm, options) {
            //formData.push({"name": "parent_msg", "value": $('#msg_compose_parent_msg').html()});
            formData.push({
                "name": "send_status",
                "value": sendStatusToUse
            });
            formData.push({
                "name": "filesource",
                "value": MsgingMod.sFileSource
            });
            formData.push({
                "name": "content_type",
                "value": MsgingMod.sCrrntContentType
            });
            formData.push({
                "name": "hostname",
                "value": hostname
            });
            formData.push({
                "name": "msgs_high_watermark",
                "value": MsgingMod.iCrrntMsgsHwm
            });
            formData.push({
                "name": "notes_high_watermark",
                "value": MsgingMod.iCrrntNotesHwm
            });
        },
        success: function(jsonObj) {
            // alert('jsonObj.success is: '+jsonObj.success);
            if (jsonObj.success == "true") {
                getFilesReferenced();
                //being called here because action of sending new message may add to list of files referenced
                //and so we should refresh to get latest inventory of files referenced

                if (sendStatusToUse == 'Y') {
                    checkGlobalMsgStatus();
                }

                if (String(jsonObj.pdbx_model_updated) != "true") {
                    // Otherwise we will keep spinning for dodepuireset
                    progressEnd();
                }

                if (MsgingMod.sViewContext == "sentmsgs") {
                    reLoadMsgs();
                } else {
                    loadDrafts();
                }

                try {
                    if (String(jsonObj.pdbx_model_updated) == "true") {
                        //if model file was associated with message then we need to ask DEP UI to reset itself
                        console.log("about to dodepuireset");
                        // See above progressStart()
                        $.when(promise_dodepuireset(MsgingMod.sSessionId, MsgingMod.sDepId, false))
                            .done(function() {
                                console.log("promise depuireset done");
                                progressEnd();
                            })
                            .fail(function() {
                                console.log("promise depuireset fail done");
                                progressEnd();
                            });

                    } else if (String(jsonObj.pdbx_model_updated) == "false") {
                        //alert("AnnotCommUI says: no annotate-model file being generated.");
                    }
                } catch (err) {
                    alert("Problem when application made request to have DEP UI reset. err=" + err.message);
                }

            } else {
                var sAlert = "There was a problem submitting the message.";
                var sAppendMsg = "";
                if (jsonObj.append_msg.length > 1) {
                    sAppendMsg = String(jsonObj.append_msg);
                }
                if (sAppendMsg.length > 1) {
                    sAlert = sAlert + " " + sAppendMsg;
                }

                alert(sAlert);

            }

        }
    });

    return;
}


function propagateMsg(msgSubject, parentMsgId, parentMsg, parentMsgSnder, parentMsgDateTime, actionType) {
    /***
     * this function used for messages that are "archive"d (and for future implementation of "forward"ing)
     **/
    var sUrl = (actionType == "archive") ? MsgingMod.URL.ARCHIVE_MSG : MsgingMod.URL.FORWARD_MSG;
    var targetDepId = (actionType == "archive") ? $("#archive_msg_target_depid").val() : $("#forward_msg_target_depid").val();

    var hostname = document.location.hostname;
    //hostname being captured and sent to server so that server-side code can determine whether in production vs. staging vs. testing environments
    //DEBUG: alert(hostname);
    var fileRefsStr = "";
    var arrFileRefObjs = getFileReferences(parentMsgId);
    if (arrFileRefObjs.length > 0) {
        var commaSep = "";
        for (var i = 0; i < arrFileRefObjs.length; i++) {
            var fileRefObj = arrFileRefObjs[i];
            var displayUploadFlName = (fileRefObj.upload_file_name.length > 1) ? ' (' + fileRefObj.upload_file_name + ')' : "";
            if (i > 0) {
                commaSep = ", ";
            }
            fileRefsStr += commaSep + fileRefObj.file_name + displayUploadFlName;
        }
    }

    var message = "ORIG MESSAGE SENDER: " + parentMsgSnder + "\nORIG MESSAGE DATETIME: " + parentMsgDateTime + "\n\nORIG MESSAGE BODY:\n\n" + parentMsg + "\n\nORIG FILE REFERENCES: " + fileRefsStr;
    //alert("#"+actionType+"_msg");
    $('#hlprfrm').ajaxSubmit({
        url: sUrl,
        async: true,
        clearForm: false,
        type: 'POST',
        beforeSubmit: function(formData, jqForm, options) {
            //formData.push({"name": "parent_msg", "value": $('#msg_compose_parent_msg').html()});
            formData.push({
                "name": "send_status",
                "value": "Y"
            });
            formData.push({
                "name": "filesource",
                "value": MsgingMod.sFileSource
            });
            formData.push({
                "name": "content_type",
                "value": MsgingMod.sCrrntContentType
            });
            formData.push({
                "name": "hostname",
                "value": hostname
            });
            formData.push({
                "name": "subject",
                "value": msgSubject
            });
            formData.push({
                "name": "message",
                "value": message
            });
            formData.push({
                "name": "mode",
                "value": "manual"
            });
            formData.push({
                "name": "target_identifier",
                "value": targetDepId
            });
            formData.push({
                "name": "orig_sender",
                "value": parentMsgSnder
            });
            formData.push({
                "name": "orig_recipient",
                "value": "MessagingModule"
            });
            formData.push({
                "name": "orig_date",
                "value": parentMsgDateTime
            });
            formData.push({
                "name": "orig_subject",
                "value": msgSubject
            });
            formData.push({
                "name": "orig_attachments",
                "value": fileRefsStr
            });
        },
        success: function(jsonObj) {
            //alert('jsonObj.success is: '+jsonObj.success);
            var bPrblmFound = false;
            if (jsonObj.success) {
                //getFilesReferenced();
                //alert("In success block.");
                for (var property in jsonObj.success) {
                    if (property == 'job') {
                        // if here then property represents whether or not the 'job' execution errored out
                        if (jsonObj.success[property] == "error") {
                            alert("An application error has occurred while executing this request.");
                            bPrblmFound = true;
                        }
                    } else {
                        // if here then current property represents success status for a given dep ID
                        if (jsonObj.success[property] == "false") {
                            alert("Problem on attempt to " + actionType + " message for dep ID: " + property + ". Please verify that this is a valid dep ID.");
                            bPrblmFound = true;
                        }
                    }
                }
                if (!bPrblmFound) {
                    //alert("In sucess block. No problem found for any Dep IDs.");
                    //$("#"+actionType+"_msg").dialog("close");
                    //$("#msg_body_display").dialog("close");
                }
            }

        }
    });

}

function convertColNameToIntIndex(colName) {
    /***************************************************************************
     * convenience function: for given column name, get position index of the
     * given field --> position reflects actual order of fields as delivered from
     * serverside call to get data
     *****************************************************************************/
    var retInt = -1;

    for (x = 0; x < MsgingMod.arrOrderedColumnList.length; x++) {
        if (colName == MsgingMod.arrOrderedColumnList[x]) {
            retInt = x;
        }
    }

    return retInt;
}

function getTrueColIdx(iCol) {
    /***************************************************************************
     * NOTE: currently only used for Correspondence History view
     *
     * Non-ideal means of keeping track of true column index of category field
     * as used server-side (i.e. before client UI reorders columns)
     * But resorting to this due to inability to find more satisfactory strategy
     * at current time for doing so within apparent DataTable plugin constraints.
     *****************************************************************************/

    if (MsgingMod.iCnt_DrawBackCalledOnCurrentTbl == 0) {
        // way DataTables works is that on first call to fnCreatedCell (the callback in which we
        // require knowledge of the "true" column index of the current field), value of iCol is actually
        // equal to true column index, because iCol not yet modified to reflect any reordering
        iTrueColIdx = iCol;
    } else {
        //but on subsequent redraws, DataTables appears to use a modified value of iCol so that
        //in subsequent calls to fnCreatedCell, the value is now equal to index of column as rendered
        //on screen, i.e. after reordering
        iTrueColIdx = MsgingMod.arrColDisplOrderCorrHx[iCol];
    }
    return iTrueColIdx;
}

function applySearchHeaderFunctions(oTable) {
    /***************************************************************************
     * NOTE: currently only used for Correspondence History view
     *****************************************************************************/

    /* Add the events etc before DataTables hides a column */
    var inputSelector = '#' + MsgingMod.sCrrntDataSetID + '_tbl_wrapper div.dataTables_scrollHead thead input';
    //var inputSelector = '#'+MsgingMod.sCrrntDataSetID+'_tbl_wrapper div.dataTables_scrollFoot tfoot input';

    $(inputSelector).keyup(function() {
        /* Filter on the column (the index) of this element */
        oTable.fnFilter(this.value, getTrueColIdx($(inputSelector).index(this)));

    });

    /*
     * Support functions to provide a little bit of 'user friendliness' to the textboxes
     */

    /***$(inputSelector).each( function (i) {
    	this.initVal = this.value;
    } );

    $(inputSelector).focus( function () {
    	if ( this.className == "search_init" )
    	{
    		this.className = "";
    		this.value = "";
    	}
    } );

    $(inputSelector).blur( function (i) {
    	if ( this.value == "" )
    	{
    		this.className = "search_init";
    		this.value = this.initVal;
    	}
    } );
    ***/
}

function loadTestExampleSeeJson(depDataSetID) {
    $('#hlprfrm').ajaxSubmit({
        url: MsgingMod.URL.SEE_RAW_JSON_FOR_DTBL,
        async: true,
        clearForm: false,
        target: '#rslts',
        beforeSubmit: function(formData, jqForm, options) {
            formData.push({
                "name": "identifier",
                "value": depDataSetID
            });
        },
        success: function() {
            // PLACEHOLDER
        }
    });
    return false;
}
