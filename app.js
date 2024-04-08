// npm i express express-handlebars express-session body-parser mongoose bcrpyt connect-mongodb-session

const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));

const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs',
}));

server.use(express.static('public'));

const mongoose = require('mongoose');
const mongo_uri = 'mongodb://127.0.0.1:27017/r_colludium';
mongoose.connect(mongo_uri);

const bcrypt = require('bcrypt');
const saltRounds = 10;

const session = require('express-session');
const mongoStore = require('connect-mongodb-session')(session);

server.use(session({
  secret: 'a secret cookie',
  saveUninitialized: true,
  resave: false,
  store: new mongoStore({
    uri: mongo_uri,
    collection: 'sessions',
    expires: 1000*60*60
  }),
  cookie : {
    httpOnly : true
  }
}));

let logged_in = false;

const userSchema = new mongoose.Schema({
  user_email : { type: String },
  user_password : { type: String },
  user_name : { type : String },
  user_desc : {type : String },
  user_profilepic : {type : String},
  user_reviews_upvoted : {type : [String]},
  user_reviews_downvoted : {type : [String]}
}, {versionKey: false});

const userModel = mongoose.model('user', userSchema);

const devCompanySchema = new mongoose.Schema({
  devCompany_email : {type : String},
  devCompany_password : {type : String},
  devCompany_title : { type : String },
  devCompany_rating : { type : Number },
  devCompany_desc : {type : String},
  devCompany_logo : {type : String},
  devCompany_show :  { type : Boolean},
  devCompany_responded : { type : [String]}
}, {versionKey : false}); 

const devCompanyModel = mongoose.model('devCompany', devCompanySchema);

const gameSchema = new mongoose.Schema({
  devCompany_id : { type : String },
  game_title : { type : String },
  game_desc : { type : String},
  game_rating : { type : Number },
  game_images : { type : String},
  game_show : { type : Boolean}
}, {versionKey : false});

const gameModel = mongoose.model('game', gameSchema);

const reviewSchema = new mongoose.Schema({
  game_id : { type : String},
  user_id : { type : String},
  review_title : {type : String},
  review_rating : { type : Number},
  review_desc : { type : String},
  review_upvotes : { type : Number},
  review_downvotes : { type : Number},
  review_response : {type : String},
  review_show : { type : Boolean}
}, {versionKey : false});

const reviewModel = mongoose.model('review', reviewSchema);

const responseSchema = new mongoose.Schema({
  review_id : { type : String},
  devCompany_id : {type : String },
  response_desc : {type : String}
});

const responseModel = mongoose.model('response', responseSchema);

//posts the main page 
server.get('/', function(req, resp){
  console.log(req.session.logged_user);
    resp.render('main',{
      layout: 'index',
      title: 'R-Colludium',
      login : isLoggedIn()
    });
});


//posts the game-devs page
server.get('/gamedevlist', function(req, resp){

  let game_devs = new Array();

  devCompanyModel.find({devCompany_show : true}).then(function(devCompany){
    for(const devs of devCompany){
      game_devs.push({
        devCompany_title : devs.devCompany_title,
        devCompany_logo : devs.devCompany_logo,
        devCompany_rating : devs.devCompany_rating,
        devCompany_desc : devs.devCompany_desc
      });
    }

    resp.render('gamedevlist',{
      layout: 'index',
      title: 'R-Colludium Game Developers',
      gamedevs: game_devs,
      login : isLoggedIn()
    });
  }).catch(errorFn);
});

//posts the game-list page
server.get('/gamelist', function(req, resp){

  
  let game_list = new Array();

  gameModel.find({game_show : true}).then( function(game){
    for(const videogame of game){

      game_list.push({
        game_title : videogame.game_title,
        game_desc : videogame.game_desc,
        game_rating : videogame.game_rating,
        game_images : videogame.game_images
      });
    }

    resp.render('gamelist',{
      layout: 'index',
      title: 'R-Colludium Games',
      game_list : game_list,
      login : isLoggedIn()
    });
  }).catch(errorFn);
});

//posts the developers info page
// needs to change
server.get('/gamedevlist/:dev', function(req, resp){

  const title = req.params.dev;
  let company = new Array();

  devCompanyModel.findOne({devCompany_title : title}).then(function(document) {
    company  = {
        devCompany_id : document._id,
        devCompany_title : document.devCompany_title,
        devCompany_logo : document.devCompany_logo,
        devCompany_rating : document.devCompany_rating,
        devCompany_desc : document.devCompany_desc
    };

    gameModel.find({devCompany_id : company.devCompany_id}).then( function(game){
      let game_list = new Array();
      for(const videogame of game){
        game_list.push({
          devCompany_id : videogame.devCompany_id,
          game_title : videogame.game_title,
          game_desc : videogame.game_desc,
          game_rating : videogame.game_rating,
          game_images : videogame.game_images
        });
      }


      resp.render('devcontent',{
        layout: 'index',
        title: req.params.devname,
        devCompany : company,
        devGames : game_list,
        login : isLoggedIn()
      });

    });
  }).catch(errorFn);
});

//posts the game info page
// needs to change
server.get('/gamelist/:title', function(req, resp){


  const title = req.params.title;
  let videogame = new Array();
  let game_owner = false;
  let is_developer = false;

  gameModel.findOne({game_title : title}).then(function(document){
    videogame = {
        game_id : document._id,
        devCompany_id : document.devCompany_id,
        game_title : document.game_title,
        game_desc : document.game_desc,
        game_rating : document.game_rating,
        game_images : document.game_images
    }


    if(isLoggedIn()){
      if(req.session.logged_user.toString() === videogame.devCompany_id.toString()){
        game_owner = true;
        is_developer = true;
  
        renderPage();
      } else {
        devCompanyModel.find({_id : req.session.logged_user}).lean().then(function(found){
  
          if(found.length > 0){
            is_developer = true;
          }
  
          renderPage();
        });
      }
    } else {
      renderPage();
    }
    

    function renderPage(){

      console.log('triggered function', game_owner, is_developer);

      reviewModel.find({ game_id: videogame.game_id, review_show : true}).then(function(review) {
        const promises = review.map(function(feedback) {
            return userModel.findOne({ _id : feedback.user_id }).then(function(user) {
     
                const find_username = user.user_name;
                const find_profilepic = user.user_profilepic;
                return responseModel.findOne({ review_id: feedback._id }).lean().then(function(response) {
                  if(response){
                    return devCompanyModel.findOne({ _id : response.devCompany_id}).lean().then(function(owner){
                      return {
                        game_id: feedback.game_id,
                        user_id: feedback.user_id,
                        review_id : feedback._id.toString(),
                        user_name: find_username,
                        user_profilepic: find_profilepic,
                        review_title : feedback.review_title,
                        review_rating: feedback.review_rating,
                        review_desc: feedback.review_desc,
                        review_upvotes : feedback.review_upvotes,
                        review_downvotes : feedback.review_downvotes,
                        review_response : feedback.review_response,
                        hasResponse : true,
                        response_desc : response.response_desc,
                        devCompany_logo : owner.devCompany_logo,
                        devCompany_title : owner.devCompany_title,
                        devCompany_id : owner._id
                      }
                    });
                  } else { 
                    return{
                      game_id: feedback.game_id,
                        user_id: feedback.user_id,
                        review_id : feedback._id.toString(),
                        user_name: find_username,
                        user_profilepic: find_profilepic,
                        review_title : feedback.review_title,
                        review_rating: feedback.review_rating,
                        review_desc: feedback.review_desc,
                        review_upvotes : feedback.review_upvotes,
                        review_downvotes : feedback.review_downvotes,
                        review_response : feedback.review_response,
                        hasResponse : false
                    }
                  }
                });
            });
        });
  
        Promise.all(promises).then(function (review_list){
          let logged_in = isLoggedIn();

          resp.render('gameinfopage',{
            layout: 'index',
            title: 'Game Info Page',
            gameinfo : videogame,
            reviews : review_list,
            login : logged_in,
            owner : game_owner,
            is_dev : is_developer,
          });
        });

     
          
        }).catch(errorFn);
    }

  });
});


server.get('/userprofile', function(req, resp){

  if(!req.session.logged_user){
    console.log('cannot access profile, not logged in');
    resp.redirect('/login');
    return;
  }

  userModel.findById(req.session.logged_user).then(function(document){
    profileuser = {
      user_id : document._id,
      user_email : document.user_email,
      user_pass : document.user_password,
      user_desc : document.user_desc,
      user_name : document.user_name,
      user_profilepic : document.user_profilepic
    };
    

    
    reviewModel.find({ user_id: profileuser.user_id, review_show : true}).then(function(review) {
      const promises = review.map(function(feedback) {
          return userModel.findOne({ _id : feedback.user_id }).then(function(user) {
              const find_username = user.user_name;
              const find_profilepic = user.user_profilepic;
              return {
                  game_id: feedback.game_id,
                  user_id: feedback.user_id,
                  user_name: find_username,
                  user_profilepic: find_profilepic,
                  review_id : feedback._id.toString(),
                  review_title : feedback.review_title,
                  review_rating: feedback.review_rating,
                  review_desc: feedback.review_desc,
                  same_user : true
              };
          });
      });

      
      Promise.all(promises).then(function (review_list){

        console.log(review_list);

        resp.render('userprofile',{
          layout: 'index',
          title: 'User Profile',
          user_info : profileuser,
          reviews : review_list,
          login : isLoggedIn()
        });
      }).catch(errorFn);
    }).catch(errorFn);
  }).catch(errorFn);
  });


server.get('/userprofile/:id', function(req, resp){


    otheruser_id = req.params.id;

    let same_user = false;
  
    userModel.findById(otheruser_id).then(function(document){
      profileuser = {
        user_id : document._id,
        user_email : document.user_email,
        user_pass : document.user_password,
        user_desc : document.user_desc,
        user_name : document.user_name,
        user_profilepic : document.user_profilepic
      };
      
      
      
      reviewModel.find({ user_id: profileuser.user_id, review_show : true}).then(function(review) {
        const promises = review.map(function(feedback) {
            return userModel.findOne({ _id : feedback.user_id }).then(function(user) {
                const find_username = user.user_name;
                const find_profilepic = user.user_profilepic;
                
                if(isLoggedIn()){
                  if(otheruser_id === req.session.logged_user.toString()){
                    same_user = true;
                  } 
                }

                return {
                  game_id: feedback.game_id,
                  user_id: feedback.user_id,
                  user_name: find_username,
                  user_profilepic: find_profilepic,
                  review_id : feedback._id.toString(),
                  review_title : feedback.review_title,
                  review_rating: feedback.review_rating,
                  review_desc: feedback.review_desc,
                  same_user : same_user
                };

                
            });
        });
  
        
        Promise.all(promises).then(function (review_list){
  
          console.log(review_list);
  
          resp.render('userprofile',{
            layout: 'index',
            title: 'User Profile',
            user_info : profileuser,
            reviews : review_list,
            login : isLoggedIn()
          });
        }).catch(errorFn);
      }).catch(errorFn);
    }).catch(errorFn);
    });

server.get('/gamedevprofile', function(req, resp){

  let found_company = new Array();
  const videogames = new Array();

  devCompanyModel.findOne({_id : req.session.logged_user}).lean().then(function(company){
    found_company = {
      devCompany_id : company._id,
      devCompany_title : company.devCompany_title,
      devCompany_logo : company.devCompany_logo,
      devCompany_rating : company.devCompany_rating,
      devCompany_desc : company.devCompany_desc
    }

    gameModel.find({devCompany_id : found_company.devCompany_id}).lean().then(function(games){
      for(const data of games){
        videogames.push({
            game_id : data._id,
            devCompany_id : data.devCompany_id,
            game_title : data.game_title,
            game_desc : data.game_desc,
            game_rating : data.game_rating,
            game_images : data.game_images
        })

        resp.render('gamedevprofile',{
          layout : 'index',
          title : 'Game Dev Profile',
          devCompany : found_company,
          devGames : videogames
        });
      }

      //resp.render()
    }).catch(errorFn);
  }).catch(errorFn);

  
});
//regular login page
server.get('/login', function(req, resp){
  resp.render('login',{
    layout: 'index',
    title: 'R-Colludium User Login'
  });
});


//register page
server.get('/register', function(req, resp){
  resp.render('register',{
    layout: 'index',
    title: 'R-Colludium Register'
  });
});


server.post('/update-user', function(req, resp){

  const update_info ={
    user_name : req.body.edited_username,
    user_profilepic : req.body.edited_photo,
    user_desc : req.body.edited_desc
  }

  userModel.findOneAndUpdate({_id : req.session.logged_user}, update_info,  {new : true}).lean().then(function(document){
    if(document){
      console.log('success ', document);
      resp.redirect('/userprofile');
    } else {
      console.log('fail? ', document)
    }
  });
});



server.get('/update-dev', function(req, resp){
  const update_info ={
    devCompany_title : req.body.edited_devname,
    devCompany_logo : req.body.edited_devphoto,
    devCompany_desc : req.body.edited_devdesc
  }

  console.log(update_info);

  devCompanyModel.findOneAndUpdate({_id : req.session.logged_user}, update_info,  {new : true}).lean().then(function(document){
    if(document){
      console.log('success ', document);
      resp.redirect('/gamedevprofile');
    } else {
      console.log('fail? ', document)
    }
  });
});

server.post('/checkprofile', function(req, resp){

  userModel.findOne({_id : req.session.logged_user}).lean().then(function(user){
    if(user){
      resp.json({ redirectTo: '/userprofile' });
    } else {
      resp.json({ redirectTo: '/gamedevprofile' });
    }
  }).catch(errorFn);
});

server.post('/deletereview', function(req, resp){

  reviewModel.findOneAndUpdate({_id : req.body.review_id}, {review_show : false}, {new : true}).lean().then(function(review){
    if(review){
      console.log(review)
      resp.json({ redirectTo: '/userprofile' });
    }
  });
});

server.post('/upvote-review', function(req, resp){

  console.log('login : ', req.session.logged_user, ' review_id : ', req.body.review_id);

  userModel.findOne({_id : req.session.logged_user, user_reviews_upvoted: {$elemMatch: {$eq: req.body.review_id}}}).lean().then(function(upvote_found){
    if(!upvote_found){

      userModel.findOne({_id : req.session.logged_user, user_reviews_downvoted: {$elemMatch: {$eq: req.body.review_id}}}).lean().then(function(downvote_found){
        if(!downvote_found){

          // no votes found, add upvote to logged in user's user_review_upvoted array of review ids

          console.log('NOT FOUND BOTH');

          reviewModel.findOneAndUpdate({_id : req.body.review_id}, {$inc : {review_upvotes : 1}}, {new : true}).lean().then(function(review){
            if(review){
              userModel.findOneAndUpdate({_id : req.session.logged_user}, 
                {$push : {user_reviews_upvoted : req.body.review_id}},
                {new : true}).lean().then(function(updated_user){
                  if(updated_user){
                    console.log(review, updated_user);
                  }
                });
            }


          });
        } 
      });
    } else {

      console.log('FOUND UP');
      reviewModel.findOneAndUpdate({_id : req.body.review_id}, {$inc : {review_upvotes : -1}}, {new : true}).lean().then(function(review){
        // find the review_id and remove it from the user array of one of the logged in user
        userModel.findOneAndUpdate({_id : req.session.logged_user}, {$pull : {user_reviews_upvoted : req.body.review_id}}, {new : true}).lean()
        .then(function(updated_user){
          if(updated_user){
            console.log(review, updated_user);
          }
        });
      });
    }
    
  });
  
});

server.post('/downvote-review', function(req, resp){

  userModel.findOne({_id : req.session.logged_user, user_reviews_downvoted: {$elemMatch: {$eq: req.body.review_id}}}).lean().then(function(downvote_found){
    if(!downvote_found){

      userModel.findOne({_id : req.session.logged_user, user_reviews_upvoted: {$elemMatch: {$eq: req.body.review_id}}}).lean().then(function(upvote_found){
        if(!upvote_found){
          
          // no votes found, add upvote to logged in user's user_review_upvoted array of review ids

          console.log('NOT FOUND BOTH');

          reviewModel.findOneAndUpdate({_id : req.body.review_id}, {$inc : {review_downvotes : 1}}, {new : true}).lean().then(function(review){
            if(review){
              userModel.findOneAndUpdate({_id : req.session.logged_user}, 
                {$push : {user_reviews_downvoted : req.body.review_id}},
                {new : true}).lean().then(function(updated_user){
                  if(updated_user){
                    console.log(review, updated_user);
                  }
                });
            }


          })
        }

      });
    } else {

      console.log('FOUND DOWN');
      reviewModel.findOneAndUpdate({_id : req.body.review_id}, {$inc : {review_downvotes : -1}}, {new : true}).lean().then(function(review){
        // find the review_id and remove it from the user array of one of the logged in user
        userModel.findOneAndUpdate({_id : req.session.logged_user}, {$pull : {user_reviews_downvoted : req.body.review_id}}, {new : true}).lean()
        .then(function(updated_user){
          if(updated_user){
            console.log(review, updated_user);
          }
        });
      });
    }
    
  })
})

// TO ADD NEW ACCOUNT
server.post('/add-user', function(req, resp){

  let hashedpass;

  bcrypt.hash(req.body.new_password, saltRounds, function(err, hash) {
    hashedpass = hash;
    console.log("Encrypted pass: "+hashedpass);

    const userInstance = userModel({
      user_email : req.body.new_email,
      user_password : hashedpass,
      user_name : req.body.new_username, 
      user_desc : "Hello! This is Placeholder text for your description! You may edit this with the edit profile button :)",
      user_profilepic : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
      user_show : true,
      user_reviews_upvoted : [],
      user_reviews_downvoted : []
    });
  
  
    userInstance.save().then( function(login) {
      console.log('success');
      resp.redirect('/register?=true');
      // redirect to confirm page
    }).catch(errorFn);
  });
});

// TO LOGIN 
server.post('/verify_user', function(req, resp){
  const searchQuery = {
    user_name : req.body.login_username,
    user_password : req.body.login_pass,
  };

  userModel.findOne({user_name : searchQuery.user_name}).lean().then((user) => {
    console.log('Processing...');
    console.log('Inside : ' + JSON.stringify(user));

    if(user){
      bcrypt.compare(searchQuery.user_password, user.user_password, function(err, found){
        console.log('Comparing passwords:');
        console.log('Input password:', searchQuery.user_password);
        console.log('Hashed password from database:', user.user_password);
        console.log('Comparison result:', found);
        

        if(found){
          console.log("User Account Found!");

          logged_in = true
          
          req.session.logged_user = user._id;

          console.log(isLoggedIn());

          resp.redirect('/');
          //  , function(renderErr, html){

          //   resp.render('/', {
          //     layout : 'index',
          //     nav_header : html
          //   })
          //  }

          //  resp.redirect('/');


          //logged in message and redirect somewhere
          
          
        } else {
          console.log("Wrong Password!");
          resp.redirect('/login');
          // wrong password message 
        }

        
      })
      

    } else {
      console.log("User Account not Found!")
    }
  }).catch(errorFn);
});

server.get('/edituserprofile', function(req, resp){
  userModel.findOne({_id : req.session.logged_user}).then(function(document){
    profileuser = {
      user_id : document._id,
      user_email : document.user_email,
      user_pass : document.user_password,
      user_desc : document.user_desc,
      user_name : document.user_name,
      user_profilepic : document.user_profilepic
    };
  resp.render('edituserprofile', {
    layout: 'index',
    title: 'Profile Edit page',
    user_info: profileuser
    });
  }).catch(errorFn);
});

server.get('/editgamedevprofile', function(req, resp){
  devCompanyModel.findOne({_id : req.session.logged_user}).then(function(document){
    company = {
      devCompany_id : document._id,
      devCompany_email : document.devCompany_email,
      devCompany_password : document.devCompany_password,
      devCompany_desc : document.devCompany_desc,
      devCompany_rating : document.devCompany_rating,
      devCompany_logo : document.devCompany_logo
    };
  resp.render('editgamedevprofile', {
    layout: 'index',
    title: 'Profile Edit page',
    devCompany: company
  });
}).catch(errorFn);
});


//adming login page
server.get('/adminlogin', function(req, resp){
  resp.render('adminlogin',{
    layout: 'index',
    title: 'R-Colludium Admin Login'
  });
});

server.post('/verify_admin', function(req, resp){
  const searchQuery = {
    devCompany_email : req.body.admin_username,
    devCompany_password : req.body.admin_password,
  };

  console.log(searchQuery);

  devCompanyModel.findOne({devCompany_email : searchQuery.devCompany_email}).lean().then((devCompany) => {
    console.log(devCompany);
    console.log('Processing...');
    console.log('Inside : ' + JSON.stringify(devCompany));

    if(devCompany){

      bcrypt.compare(searchQuery.devCompany_password, devCompany.devCompany_password, function(err, found){
        console.log('Comparing passwords:');
        console.log('Input password:', searchQuery.devCompany_password);
        console.log('Hashed password from database:', devCompany.devCompany_password);
        console.log('Comparison result:', found);
        
        
        if(found){
          console.log("User Account Found!");

          logged_in = true;
          
          req.session.logged_user = devCompany._id;

          console.log(isLoggedIn());
    
          resp.redirect('/');
          //  , function(renderErr, html){

          //   resp.render('/', {
          //     layout : 'index',
          //     nav_header : html
          //   })
          //  }
          
    
          //  resp.redirect('/');
        } else {
          console.log("Wrong Password!");
          resp.redirect('/login');
        }

      })



      //logged in message and redirect somewhere
      
    } else {
      console.log("Company cannot be found!");
      resp.redirect('/login');
      // wrong password message 
    }
  }).catch(errorFn);
});

server.post('/search', function(req, resp){
 
  
  const searchQuery = new RegExp(req.body.search_bar, 'i');

  console.log(searchQuery);

  Promise.all([
    devCompanyModel.findOne({ devCompany_title: { $regex: searchQuery }, devCompany_show: true }).lean(),
    gameModel.findOne({ game_title: { $regex: searchQuery }, game_show: true }).lean()
  ]).then(function([devCompany, game]) {
    if (devCompany) {
        console.log('Company found:', devCompany);
        company_name = devCompany.devCompany_title;
        resp.redirect('/gamedevlist/'+company_name);
    } else if (game) {
        console.log('Game found:', game);
        game_title = game.game_title
        resp.redirect('/gamelist/'+game_title);
    } else {
        console.log('Not found');
    }
}).catch(errorFn)

});

server.post('/create-review', function(req, resp){


  const reviewInstance = reviewModel({
    game_id : req.body.gameid,
    user_id : req.session.logged_user,
    review_title : req.body.reviewtitle,
    review_rating : req.body.starRating,
    review_desc : req.body.review,
    review_upvotes : 0,
    review_downvotes : 0,
    review_show : true
  });

  reviewInstance.save().then(function(){
    console.log('success');
    resp.redirect('/gamelist/'+req.body.gamename);    
  }).catch(errorFn);

});


server.get('/reply', function(req, resp){

  resp.render('devresponse', {
    layout: 'index',
    title: 'Reply to Review',
    review_id : req.body.reviewid
  });
});

server.post('/create_response', function(req, resp){
  
  const responseInstance = responseModel({
    review_id : req.body.response_reviewid,
    devCompany_id : req.session.logged_user,
    response_desc : req.body.responsedesc
  });

  responseInstance.save().then(function(){
    console.log('success');
  });
});

server.get('/logout', function(req, resp){
  req.session.destroy(function(err) {
      logged_in = false;
      resp.json({redirectTo : '/'});
  });
});

function errorFn(err){
  console.log('Error found. Please trace!');
  console.error(err);
}



function isLoggedIn(){
  return logged_in === true;
}


const port = process.env.PORT | 3000;
server.listen(port, function(){
    console.log('Listening at port '+port);
});

  