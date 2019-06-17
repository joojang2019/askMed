var express = require("express");
var router = express.Router();
var middleware = require("../middleware");    //will require index.js automatically
var User = require("../models/user");
var Prescription = require("../models/prescription");

//Show User's Prescriptions Route
router.get("/users/:id/prescriptions", function(req, res){
   User.findById(req.params.id).populate("prescriptions").exec(function(err, prescription){
      if(err){
          req.flash("error","Something went wrong");
          res.redirect("/");
      } 
      res.render("prescriptions/show",{prescriptions:prescription});
                
   
   });
   
});


// Get a new diagnosis
router.get("/users/:id/prescriptions/new", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            console.log(err);
        } else{
            res.render("prescriptions/new", {currentUser: foundUser});
        }
    });
   
});


router.post("/users/:id/prescriptions", function(req, res){
   User.findById(req.params.id).populate("prescriptions").exec(function (err, foundUser) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Prescription.create(req.body.prescription, function (err, prescription) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated vendor to the review
            prescription.medication = req.body.medication;

            //save prescription
            prescription.save();
            foundUser.prescriptions.push(prescription);
              //save vendor
            foundUser.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/vendors/');
        });
    });
});



module.exports = router;
