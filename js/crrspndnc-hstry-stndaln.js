/***********************************************************************************************************
File:		crrspndnc-hstry-stndaln.js
Author:		rsala (rsala@rcsb.rutgers.edu)
Date:		2016-07-06
Version:	0.0.1

JavaScript supporting wwPDB Messaging Module web interface -- "View All Correspondence" view 

2016-07-06, RPS: Created
*************************************************************************************************************/
function handleSubmit(){
	var depid = $('#identifier').val();
	
	if( depid && depid.length > 0 ){
		$('#vw_crrspndnc').ajaxSubmit({url: '/service/messaging/verify_depid', async: true, clearForm: false,
	        success: function(jsonData) {
	        	if( jsonData ){
					try{
						if( jsonData.found == "y" ){
							$('#vw_crrspndnc').get(0).setAttribute("action", "/service/messaging/view_correspondence");
							$('#vw_crrspndnc').submit();
						}else{
							alert("Deposition ID is not recognized.");
						}
					}
					catch(err){
						alert("Problem processing deposition ID.");
					}	        		
	        	}
	        }
	    });
	}
	else{
		alert("No Deposition ID specified.");
	}
}

$("#vw_crrspndnc_submit").on("click", handleSubmit);