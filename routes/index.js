var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Vendor = require("../models/vendor");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//root route
router.get("/", function(req, res){
    res.render("landing");
});

//show register form
router.get("/register", function(req, res){
   res.render("register", {page:"register"}); 
});

//signup logic
router.post("/register", function(req, res){
    var newUser = new User({
            username: req.body.username, 
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            avatar: req.body.avatar,
            email: req.body.email
            
        });
    if(req.body.adminCode === 'secretcode123'){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
       if(err){
           console.log(err);
           return res.render("register",{error: err.message});
       } 
       passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + user.username);
           res.redirect("/vendors");
       });
    });
});

//show login form
router.get("/login", function(req, res){
    res.render("login", {page: 'login'});
});

// handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/vendors",
        failureRedirect: "/login"
        
    }), function(req, res){
    
});

//logout route
router.get("/logout", function(req, res){
   req.logout(); 
   req.flash("success","Logged you out!");
   res.redirect("/");
});

router.get("/forgot", function(req, res){
   res.render('forgot'); 
});

router.post("/forgot", function(req, res){
    async.waterfall([
        function(done){
            crypto.randomBytes(20, function(err, buf){
                var token=buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done){
            User.findOne({email: req.body.email}, function(err, user){
                if(!user || err){
                    req.flash("error", "No account with that email address exists.");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1hour
                
                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function(token, user, done){
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "joowebtutorial@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: "joowebtutorial@gmail.com",
                subject: "Node.js Password Reset",
                text: "You are receiving this because you (or someone else) have requested the reset of the passowrd."+
                  "Please click on the following link, or paste this into your browser to complete the process."+
                  "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                  "If you did not request this, please ignore this email and your password will remain unchanged."
            };
            smtpTransport.sendMail(mailOptions, function(err){
                console.log("mail sent");
                req.flash("success", "An e-mail has been set to "+user.email + " with further instructions.");
                done(err, "done");
            });
        }
        ], function(err){
            if(err) return next(err);
            res.redirect("/forgot");
        });
});


router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'joowebtutorial@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'joowebtutorial@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/vendors');
  });
});


// USER PROFILES
router.get("/users/:id", function(req, res){
   User.findById(req.params.id, function(err, foundUser){
      if(err){
          req.flash("error","Something went wrong");
          res.redirect("/");
      } 
      Vendor.find().where("author.id").equals(foundUser._id).exec(function(err, vendors){
          if(err){
              req.flash("error","Something went wrong");
              res.redirect("/");
          } 
          res.render("users/show", {user: foundUser, vendors: vendors});

      });
   });
});

// EDIT USER PROFILES
router.get("/users/:id/edit", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        res.render("users/edit",{user: foundUser});
    });
});


// UPDATE USER PROFILE
router.put("/users/:id",  function(req, res){
    User.findByIdAndUpdate(req.params.id, req.body.user, function(err, updatedUser){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/users/" + updatedUser._id);
        }
    });
  });

module.exports = router;