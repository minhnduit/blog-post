require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const _ = require("lodash");
const { xss } = require("express-xss-sanitizer");
var sanitize = require('mongo-sanitize');

var cookieParser = require('cookie-parser');
const csrf = require('csurf');


var csrfProtection = csrf({ cookie: true });

const options = {
  allowedTags: ['']
}



var userrr ="";
var user_id ="";
var post_id ="";
var test_id ="";

const startingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const app = express();

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use(xss(options));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
// app.use(csrf());
mongoose.connect("mongodb://localhost:27017/injection", {useNewUrlParser: true});




//--------------------schema------------

const userSchema = new mongoose.Schema({
  userID: String,
  email: String,
  password: String,
  googleId: String,
  secret: String	
});
const postSchema = new mongoose.Schema({
  postID: String,
  content: String,
  user: {
    userID: String,
    email: String,
  },
comment: [{
  postID: String,
  email: String,
  content: String	
}],
report: [{
  postID: String,
  email: String,
  reason: String	
}]
});



//---------------------------------------


userSchema.plugin(passportLocalMongoose);







userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Post = mongoose.model("Post", postSchema);
//-----------------------------------------
passport.use(User.createStrategy());
//-----------------------------------------
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// ------------------------------------------


app.get("/", function(req, res){
    res.render("home");
  });

  app.get("/https:/1", function(req, res) {
    res.redirect('/');
});
  
  app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
  );
  
  app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
      // Successful authentication, redirect to secrets.
      res.redirect("/homeblog");
    });
  

    app.get("/login", function(req, res){
        res.render("login");
      });

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/homeblog",csrfProtection, function (req, res) {
  Post.find({}, function(err, posts) {
    User.find({})
  res.render("homeblog",{
    csrfToken: req.csrfToken(),
    userrr: userrr,
    startingContent: startingContent,
    // posts:  JSON.stringify(posts)
    posts: posts
    });
  })
});




app.get("/secrets", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});


app.get("/edit/:postID", function(req, res){
  const requestedPostId = req.params.postID;
  post_id = requestedPostId;
  Post.findOne({postID: requestedPostId}, function(err,post){

    res.render("edit", {

      editContent: post.content,
      editID:requestedPostId
    

    });

  });
  
});


// app.get("/delete/:postID", function(req, res){
//   const deletePostId = req.params.postID;
//   post_id = deletePostId;
  // Post.findOne({postID: requestedPostId}, function(err,post){

  //   res.render("edit", {

  //     editContent: post.content,
  //     editID:requestedPostId
    

  //   });

  // });
  
// });

// -----------------------------------------------------------------
app.get("/search", function(req, res){
  res.render("search");
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});
app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});
// --------------------------------------------------------------------------------------------------------------

// -----------------register----------------------

app.post("/register", function (req, res) {
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  };
    user_id = getRandomInt(10000000000);
    User.register({
        userID: user_id,       
        username: req.body.username
    }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                
                res.redirect("/homeblog");
                userrr=req.body.username;
            });
        }
    });
});

// app.post("/register", function (req, res) {
//   function getRandomInt(max) {
//     return Math.floor(Math.random() * max);
//   };
//     user_id = getRandomInt(10000000000);
//     const user = new User({
//       userID : user_id,
//       email: req.body.username,
//       password: req.body.password
//     });
//     user.save(function(err){  
//       if (!err){
//         res.redirect("/homeblog");
//          userrr=req.body.username;
//       }
//     });
// });




// --------------------------------------login--------------------------------------
app.post("/login",xss(), function(req, res){

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
  
    req.login(user, function(err){
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/homeblog");
         userrr=req.user.username;
         console.log(userrr);




          // -------------------------
          User.findById(req.user._id,function(err, foundUser){
                if (err){
                    console.log(err)
                 } else {
                     if(foundUser){
                        user_id = foundUser.userID;
                        console.log(user_id);
                      
                    };
                };
            });
// ----------------------------------
        });
      }
    });
  
  });

// app.post("/login", function(req, res){

//           User.find({email: req.body.username,password: req.body.password },function(err, foundUser){
//                 if (err){
//                     console.log(err)
//                  } else {
//                      if(foundUser){
//                       userrr=req.body.username;
//                         user_id = foundUser.userID;
//                         console.log(user_id);
//                         res.redirect("/homeblog");
                      
//                     };
//                 };
//             });
// // ----------------------------------
//         });
      
   
  
  



// -------------------------------homeblog--------------------------------

  app.post("/homeblog",xss(options), function(req, res) {
    function getRandomInt(max) {
      return Math.floor(Math.random() * max);
    };
    
    var uss ={
      userID: "",
      email: ""
    };
    User.find({userID: user_id},function(err,result){
      uss = {
        userID: result[0].userID,
        email: result[0].username
      };
      console.log(result[0]);
      console.log(uss);
      const post = new Post({
        postID: getRandomInt(10000000000),
        content: sanitize(req.body.postBody),
        user: uss
      });
      post.save(function(err){  
        if (!err){
          res.redirect("/homeblog");
        }
      });
    });
      
  });
// ------------------------------edit--------------------------------
  app.post("/edit", function(req, res) {
    const requestedId = post_id;
    const updateEdit = req.body.postBodyEdit;
    Post.findOne({postID: requestedId},function(err,post){

     console.log(requestedId);
     console.log(updateEdit);
      post.content = updateEdit;
      post.save(function(err,post){

      });
   
    res.redirect("/homeblog");
   
 
    });
  
  });
// -------------------------delete-------------------------------------
app.get("/cmt/:postID",function(req,res){
  post_id= req.params.postID;
  console.log("success!!!!!!");

  });
// ---------------------------------------------------
  app.get("/post/:postID", function(req, res) {
    const requestedPostId = req.params.postID;
    post_id = requestedPostId;
    Post.find({postID: requestedPostId }, function(err, posts) {
      
    res.render("post",{
      posts: posts
      });
    })
  
  });

app.post("/cmt",function(req,res){
  var userCmt = "";
  User.find({userID: user_id},function(err,result){
      userCmt = result[0].username;
      console.log(userCmt);

      var commentContent ={
        postID: post_id,
        email: userCmt,
        content: req.body.cmtContent
      };
      console.log(post_id);
      Post.findOneAndUpdate({postID: post_id},{ $push:{
        comment: [commentContent]
      
        
      } } ,function(err,result){});
      });

      

//   {$push: 
  
// }


  // post.comment.postID=post_id;
  // post.comment.postID = post_id;

  // User.find({userID: user_id},function(err,result){
  //   post.comment.email = result[0].username;
  //   });
  // post.comment.content = cmtContent;
  // post.save(function(err,post){

  // });
  const link = /post/+post_id;

res.redirect(link);

});


app.post('/delete', (req, res) => {
  // Post.findOneAndRemove(
  //   {postID: post_id},
  //   (err) => {
  //   if (err) {return res.send(500, err)} else {
  //     console.log(post_id);
  //     console.log( 'The message has been deleted');
  //     Post.deleteMany({content: null});
  //   res.redirect("/homeblog");}
  // })
console.log(post_id);
console.log(post_id);
console.log(post_id);
console.log(post_id);
 
  Post.findOneAndDelete({postID: post_id},function(err){});
  res.redirect("/homeblog");
})
 

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    console.log(req.user);

    // User.findById(req.user._id,function(err, foundUser){
    //     if (err){
    //         console.log(err)
    //     } else {
    //         if(foundUser){
    //             foundUser.secret = submittedSecret;
    //             foundUser.save(function(){
    //                 res.redirect("/secrets");
    //             });
    //         };
    //     };
    // });
});
// ----------------search--------------------------
app.post("/search", function(req, res) {
  let keyWordCap = sanitize(req.body.searchContent);
  let keyWord = _.lowerCase(keyWordCap);
  console.log(keyWord);
  var data = '/'+keyWord+'/';
  console.log(data);
  Post.find({content: { $regex: keyWord,$options:'i'}}, function(err, posts) {
    console.log("querry sucess!");
    console.log(posts);
    res.render("search",{
      userrr:userrr,
      posts: posts
      });
    })
});


// ------------------------------------------
app.listen(process.env.PORT || 3000, function () {
    console.log("connected successfully!! u r in port 3000!"); })

//  app.listen(process.env.PORT);
