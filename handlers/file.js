var User = require('./../models/user'),
    File = require('./../models/file');

module.exports = {
    getAvatar: function(req, res) {
        File.getReadStream(req.params.file_id)
            .then(function(stream) {
                stream.pipe(res);
            });
    },

    serveAvatarForm: function(req, res) {
        res.render("avatar");
    },

    uploadAvatar: function(req, res) {
        User.findByToken(req.cookies.pandafeed_token)
            .then(function(user) {
                if(user){
                    var tempfile = req.files.filename.path,
                        file     = new File(user._id, user.avatar_id, req.files.filename.originalname);

                    file.save_from(tempfile, function() {
                        res.redirect("/");
                    });
                }
                else {
                    res.redirect("/login");
                }});
    }
};
