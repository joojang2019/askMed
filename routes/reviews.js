var express = require("express");
var router = express.Router({mergeParams: true});
var Vendor = require("../models/vendor");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews Index
router.get("/", function (req, res) {
    Vendor.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, vendor) {
        if (err || !vendor) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {vendor: vendor});
    });
});

// Reviews New
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the vendor, only one review per user is allowed
    Vendor.findById(req.params.id, function (err, vendor) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {vendor: vendor});

    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    //lookup vendor using ID
    Vendor.findById(req.params.id).populate("reviews").exec(function (err, vendor) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated vendor to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.vendor = vendor;
            //save review
            review.save();
            vendor.reviews.push(review);
            // calculate the new average review for the vendor
            vendor.rating = calculateAverage(vendor.reviews);
            //save vendor
            vendor.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/vendors/' + vendor._id);
        });
    });
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {vendor_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Vendor.findById(req.params.id).populate("reviews").exec(function (err, vendor) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate vendor average
            vendor.rating = calculateAverage(vendor.reviews);
            //save changes
            vendor.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/vendors/' + vendor._id);
        });
    });
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Vendor.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, vendor) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate vendor average
            vendor.rating = calculateAverage(vendor.reviews);
            //save changes
            vendor.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/vendors/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;