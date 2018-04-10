
$(document).ready(function(){

	var lv = new LoginValidator();
	var lc = new LoginController();

// main login form //
	$('#create').ajaxForm({
		beforeSubmit : function(formData, jqForm, options){
			if (lv.validateForm() == false){
				return false;
			} 	else{
				return true;
			}
		},
		success	: function(responseText, status, xhr, $form){
			if (status == 'success') window.location.href = '/article';
		},
		error : function(e){
			lv.showLoginError('Article create Failure', 'Please try after some time.');
		}
	}); 
	$('#user-tf').focus();
	
});