let rating = 0;

function viewHome(){
  window.location.href = '/';
}

function viewGameDevs(){
  window.location.href = '/gamedevlist';
}

function viewGameDev(devCompany_title){

  window.location.href  = '/gamedevlist/'+devCompany_title;
  
}

function viewGames(){
  window.location.href = '/gamelist';
}

function viewGame(game_title){


  window.location.href  = '/gamelist/'+game_title;

}

function viewProfile(){

  window.location.href = '/userprofile';
}

function viewOtherUser(_id){
  window.location.href = '/userprofile/'+_id;
}

function viewGameDevProfile(){
  window.location.href = '/gamedevprofile';
}

function viewRegLogin(){
  window.location.href = '/login';
}

function viewRegister(){
  window.location.href = '/register';
}

function viewAdmin(){
  window.location.href = '/adminlogin';
}

function submitNewAccount(){
  document.getElementById('createUser').submit();
}

function submitLogin(){
  document.getElementById('login').submit();
}

function submitAdminLogin(){
  document.getElementById('admin-login').submit();
}

function submitSearch(formId){

  // $('#' + formId).submit();

  document.getElementById('#'+formId).submit();


}

function displayProfile(){

  fetch('/checkprofile', {
    method: 'POST',
  }).then(response => response.json()).then(function(redirect){

    console.log('check');
    if (redirect.redirectTo) {
      window.location.href = redirect.redirectTo; // Redirect the client to the specified URL
    }
  })
}

function deleteReview(_id){
  fetch('/deletereview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body : JSON.stringify({review_id : _id})
  }).then(response => response.json()).then(function(redirect){
    if(redirect.redirectTo){
      window.location.href = redirect.redirectTo;
    }
  })
}

function upvoteReview(_id){
  fetch('/upvote-review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body : JSON.stringify({review_id : _id})
  })
}

function downvoteReview(_id){
  fetch('/downvote-review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body : JSON.stringify({review_id : _id})
  })
}

function logout(){
  fetch('/logout', {
    method: 'GET',
  }).then(response => response.json()).then(function(redirect){
    if(redirect.redirectTo){
      window.location.href = redirect.redirectTo;
    }
  })
}




function reviewRating(star){

  rating = star.getAttribute('value');

  document.getElementById('starRating').value = rating;

}


function submitReview(){
  document.getElementById('writereviewbox').submit();
}

function submitEditDev(){
  document.getElementById('gamedevprofileedit').submit();
}

function submitEditUser(){
  document.getElementById('usereditprofile').submit();
}

//when edit profile is clicked on regular user profile
function editProfile(){
  window.location.href = '/edituserprofile';
}

function submitEditProfile(){
  document.getElementById('usereditprofile').submit();
}

function submitEditGameDevProfile(){
  document.getElementById('gamedevprofileedit').submit();
}

function editGameDevProfile(){
  window.location.href = '/editgamedevprofile';
}

function viewReplyWindow(review_id){
  window.location.href = '/devresponse/'+review_id;
}

function submitReply(){
  document.getElementById('replyform').submit();
}

function submitDevResponse(){
  document.getElementById('replycomment').submit();
}